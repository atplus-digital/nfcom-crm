import type { Cliente } from "@/@types/atacado/Cliente";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";
import { BusinessRuleError } from "@/shared/base.error";
import { LINES } from "./constants";
import type { GroupedLine, GroupedService, ProcessedLine } from "./types";

interface PlanInfo {
	readonly id: string | number;
	readonly name: string;
	readonly monthlyValue: number;
}

type PlanLookup = Map<string | number, PlanInfo>;

const buildPlanLookup = (plans: readonly PlanoDeServico[]): PlanLookup => {
	return new Map(
		plans
			.filter(plan => plan.id !== undefined)
			.map(plan => [
				plan.id as string | number,
				{
					id: plan.id as string | number,
					name: plan.f_nome ?? "",
					monthlyValue: Number(plan.f_assinatura_mensal) || 0,
				},
			]),
	);
};

const getPlanInfo = (
	planId: string | number | undefined,
	lookup: PlanLookup,
	clientId: string | number | undefined,
): PlanInfo => {
	if (!planId) {
		throw BusinessRuleError.create(`Invalid plan ID for client ${clientId}`);
	}

	const plan = lookup.get(planId);

	if (
		!plan ||
		plan.monthlyValue === 0 ||
		plan.name === "Cadastrar Plano no Fluxo"
	) {
		throw BusinessRuleError.create(
			`Plan with ID ${planId} not found or invalid. Client ID: ${clientId}`,
		);
	}

	return plan;
};

const isLineActive = (line: Record<string, unknown>): boolean =>
	line.f_status === LINES.STATUS_ACTIVE;

class LineProcessor {
	private constructor(private readonly planLookup: PlanLookup) {
		this.planLookup = planLookup;
	}

	static create(plans: readonly PlanoDeServico[]): LineProcessor {
		return new LineProcessor(buildPlanLookup(plans));
	}

	processClientLines(client: Cliente): {
		readonly lines: ProcessedLine[];
		readonly total: number;
	} {
		const lines = client.f_linhas_fixas;

		if (!lines || lines.length === 0) {
			throw BusinessRuleError.create(
				`Client ${client.id} - ${client.f_nome_razao} has no fixed lines`,
			);
		}

		let total = 0;
		const processedLines: ProcessedLine[] = [];

		for (const line of lines) {
			if (!isLineActive(line as Record<string, unknown>)) {
				continue;
			}

			const planId = line[LINES.PLAN_ID_FIELD as keyof typeof line] as
				| string
				| number
				| undefined;
			const planInfo = getPlanInfo(planId, this.planLookup, client.id);

			processedLines.push({
				id: line.id ?? 0,
				planId: planId ?? 0,
				unitPrice: planInfo.monthlyValue,
				description: planInfo.name,
			});
			total += planInfo.monthlyValue;
		}

		return { lines: processedLines, total };
	}

	static groupLinesByPlan(lines: readonly ProcessedLine[]): GroupedLine[] {
		const grouped = new Map<string | number, GroupedLine>();

		for (const line of lines) {
			const existing = grouped.get(line.planId);

			if (existing) {
				grouped.set(line.planId, {
					...line,
					quantity: existing.quantity + 1,
					total: existing.total + line.unitPrice,
				});
			} else {
				grouped.set(line.planId, {
					...line,
					quantity: 1,
					total: line.unitPrice,
				});
			}
		}

		return Array.from(grouped.values());
	}

	static groupServices(
		clients: readonly { readonly lines: readonly ProcessedLine[] }[],
	): GroupedService[] {
		const servicesMap = new Map<
			string | number,
			{ name: string; cost: number; quantity: number }
		>();

		for (const client of clients) {
			for (const line of client.lines) {
				const existing = servicesMap.get(line.planId);

				if (existing) {
					servicesMap.set(line.planId, {
						...existing,
						quantity: existing.quantity + 1,
					});
				} else {
					servicesMap.set(line.planId, {
						name: line.description,
						cost: line.unitPrice,
						quantity: 1,
					});
				}
			}
		}

		return Array.from(servicesMap.entries()).map(([planId, service]) => ({
			planId,
			description: service.name,
			unitPrice: service.cost,
			quantity: service.quantity,
			total: service.cost * service.quantity,
		}));
	}
}

export { LineProcessor };
