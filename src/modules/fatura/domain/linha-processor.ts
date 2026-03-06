import type { Cliente } from "@/@types/atacado/Cliente";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";
import { BusinessRuleError } from "@/shared/base.error";
import { LINES } from "./constants";
import type { LinhaAgrupada, LinhaProcessada, ServicoAgrupado } from "./types";

interface PlanoInfo {
	readonly id: string | number;
	readonly nome: string;
	readonly valorMensal: number;
}

type PlanoLookup = Map<string | number, PlanoInfo>;

const buildPlanoLookup = (planos: readonly PlanoDeServico[]): PlanoLookup => {
	return new Map(
		planos
			.filter((plano) => plano.id !== undefined)
			.map((plano) => [
				plano.id as string | number,
				{
					id: plano.id as string | number,
					nome: plano.f_nome ?? "",
					valorMensal: Number(plano.f_assinatura_mensal) || 0,
				},
			]),
	);
};

const getPlanoInfo = (
	planoId: string | number | undefined,
	lookup: PlanoLookup,
	clienteId: string | number | undefined,
): PlanoInfo => {
	if (!planoId) {
		throw BusinessRuleError.create(
			`ID do plano é inválido para cliente ${clienteId}`,
		);
	}

	const plano = lookup.get(planoId);

	if (
		!plano ||
		plano.valorMensal === 0 ||
		plano.nome === "Cadastrar Plano no Fluxo"
	) {
		throw BusinessRuleError.create(
			`Plano com ID ${planoId} não encontrado ou inválido. ID Cliente: ${clienteId}`,
		);
	}

	return plano;
};

const isLinhaAtiva = (linha: Record<string, unknown>): boolean =>
	linha.f_status === LINES.STATUS_ACTIVE;

class LinhaProcessor {
	private constructor(private readonly planoLookup: PlanoLookup) {
		this.planoLookup = planoLookup;
	}

	static create(planos: readonly PlanoDeServico[]): LinhaProcessor {
		return new LinhaProcessor(buildPlanoLookup(planos));
	}

	processarLinhasCliente(cliente: Cliente): {
		readonly linhas: LinhaProcessada[];
		readonly total: number;
	} {
		const linhas = cliente.f_linhas_fixas;

		if (!linhas || linhas.length === 0) {
			throw BusinessRuleError.create(
				`Cliente ${cliente.id} - ${cliente.f_nome_razao} não possui linhas fixas`,
			);
		}

		let total = 0;
		const linhasProcessadas: LinhaProcessada[] = [];

		for (const linha of linhas) {
			if (!isLinhaAtiva(linha as Record<string, unknown>)) {
				continue;
			}

			const planoId = linha[LINES.PLAN_ID_FIELD as keyof typeof linha] as
				| string
				| number
				| undefined;
			const planoInfo = getPlanoInfo(planoId, this.planoLookup, cliente.id);

			linhasProcessadas.push({
				id: linha.id ?? 0,
				planoId: planoId ?? 0,
				unitario: planoInfo.valorMensal,
				descricao: planoInfo.nome,
			});
			total += planoInfo.valorMensal;
		}

		return { linhas: linhasProcessadas, total };
	}

	static agruparLinhasPorPlano(
		linhas: readonly LinhaProcessada[],
	): LinhaAgrupada[] {
		const agrupadas = new Map<string | number, LinhaAgrupada>();

		for (const linha of linhas) {
			const existente = agrupadas.get(linha.planoId);

			if (existente) {
				agrupadas.set(linha.planoId, {
					...linha,
					quantidade: existente.quantidade + 1,
					total: existente.total + linha.unitario,
				});
			} else {
				agrupadas.set(linha.planoId, {
					...linha,
					quantidade: 1,
					total: linha.unitario,
				});
			}
		}

		return Array.from(agrupadas.values());
	}

	static agruparServicos(
		clientes: readonly { readonly linhas: readonly LinhaProcessada[] }[],
	): ServicoAgrupado[] {
		const servicosMap = new Map<
			string | number,
			{ nome: string; custo: number; quantidade: number }
		>();

		for (const cliente of clientes) {
			for (const linha of cliente.linhas) {
				const existente = servicosMap.get(linha.planoId);

				if (existente) {
					servicosMap.set(linha.planoId, {
						...existente,
						quantidade: existente.quantidade + 1,
					});
				} else {
					servicosMap.set(linha.planoId, {
						nome: linha.descricao,
						custo: linha.unitario,
						quantidade: 1,
					});
				}
			}
		}

		return Array.from(servicosMap.entries()).map(([planoId, servico]) => ({
			planoId,
			descricao: servico.nome,
			unitario: servico.custo,
			quantidade: servico.quantidade,
			total: servico.custo * servico.quantidade,
		}));
	}
}

export { LinhaProcessor };
