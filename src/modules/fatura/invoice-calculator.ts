import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";
import { documentValidator } from "@/modules/fatura/validators/document.validator";
import { entityValidator } from "@/modules/fatura/validators/entity.validator";
import { BusinessRuleError, NotFoundError } from "@/shared/base.error";
import { createClientDetail } from "./domain/cliente-builder";
import { calculateDueDate } from "./domain/date-calculator";
import { LineProcessor } from "./domain/linha-processor";
import { createPartnerInvoice } from "./domain/parceiro-builder";
import { BILLING_TYPE_CONFIG, DATES } from "./fatura.constants";
import type {
	CalculateInvoiceParams,
	ClientDetail,
	InvoicePartner,
	TipoFaturamento,
} from "./fatura.schemas";
import type {
	BillingTypeConfig,
	InvoiceDataService,
} from "./fatura.service.types";

export class InvoiceCalculator {
	private readonly dataService: InvoiceDataService;

	constructor(dataService: InvoiceDataService) {
		this.dataService = dataService;
	}

	async calculate(params: CalculateInvoiceParams): Promise<InvoicePartner> {
		const { partnerId, referenceDate, billingType = "parceiro" } = params;

		this.validateBillingType(billingType);

		const { partner, clients, plans } =
			await this.dataService.fetchInvoiceData(partnerId);

		const config = BILLING_TYPE_CONFIG[billingType];
		this.validateData(partner, clients, plans, config);

		const lineProcessor = LineProcessor.create(plans);
		const processedClients = this.processClients(clients, lineProcessor);

		if (processedClients.length === 0) {
			throw BusinessRuleError.create(
				"Nenhum cliente com linhas ativas encontrado para faturamento",
				{ resource: "Invoice Processing", identifier: partnerId },
			);
		}

		const invoiceTotal = this.calculateTotal(processedClients);
		const totalLines = this.calculateTotalLines(processedClients);
		const dueDate = this.calculateInvoiceDueDate(partner, referenceDate);
		const groupedServices = LineProcessor.groupServices(processedClients);

		const partnerInvoice = createPartnerInvoice(
			partner,
			invoiceTotal,
			processedClients.length,
			totalLines,
		);

		return {
			dueDate,
			invoiceTotal,
			totalLines,
			partner: partnerInvoice,
			clients: processedClients,
			groupedServices,
		};
	}

	private validateBillingType(type: TipoFaturamento): void {
		const validTypes: TipoFaturamento[] = [
			"parceiro",
			"via-parceiro",
			"cofaturamento",
			"cliente-final",
		];

		if (!validTypes.includes(type)) {
			throw BusinessRuleError.create(
				`Tipo de faturamento inválido: ${type}. Tipos válidos: ${validTypes.join(", ")}`,
				{ resource: "Invoice Type" },
			);
		}
	}

	private validateData(
		partner: Parceiro,
		clients: readonly Cliente[],
		plans: readonly PlanoDeServico[],
		config: BillingTypeConfig,
	): void {
		if (config.requiresPartnerValidation && clients.length === 0) {
			throw NotFoundError.create("Clientes ativos", partner.id ?? 0);
		}

		if (plans.length === 0) {
			throw NotFoundError.create("Planos de serviço", "");
		}

		entityValidator.validateAll(partner, clients);
		documentValidator.validateAll(partner, clients);
	}

	private processClients(
		clients: readonly Cliente[],
		lineProcessor: LineProcessor,
	): ClientDetail[] {
		const processed: ClientDetail[] = [];

		for (const client of clients) {
			try {
				const { lines, total } = lineProcessor.processClientLines(client);

				if (lines.length > 0) {
					processed.push(createClientDetail(client, lines, total));
				}
			} catch (error) {
				console.warn(`Erro ao processar cliente ${client.id}: ${error}`);
			}
		}

		return processed;
	}

	private calculateTotal(clients: readonly ClientDetail[]): number {
		return clients.reduce((sum, c) => sum + c.total, 0);
	}

	private calculateTotalLines(clients: readonly ClientDetail[]): number {
		return clients.reduce((sum, c) => sum + c.totalLines, 0);
	}

	private calculateInvoiceDueDate(
		partner: Parceiro,
		referenceDate: string,
	): string {
		const dueDay = partner.f_data_vencimento ?? DATES.DEFAULT_DUE_DAY;
		return calculateDueDate(referenceDate, dueDay);
	}
}
