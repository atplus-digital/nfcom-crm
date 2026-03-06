import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";
import { atacadoRepository } from "@/modules/atacado/atacado.repository";
import { documentValidator } from "@/modules/fatura/validators/document.validator";
import { entityValidator } from "@/modules/fatura/validators/entity.validator";
import { NotFoundError } from "@/shared/base.error";
import { DATES } from "./constants";
import { createClientDetail } from "./domain/cliente-builder";
import { calculateDueDate } from "./domain/date-calculator";
import { LineProcessor } from "./domain/linha-processor";
import { createPartnerInvoice } from "./domain/parceiro-builder";
import type {
	CalculateInvoiceParams,
	ClientDetail,
	InvoicePartner,
} from "./domain/types";

interface InvoiceDataService {
	fetchInvoiceData(partnerId: string | number): Promise<{
		partner: Parceiro;
		clients: readonly Cliente[];
		plans: readonly PlanoDeServico[];
	}>;
}

class AtacadoInvoiceDataService implements InvoiceDataService {
	async fetchInvoiceData(partnerId: string | number) {
		const [partner, clients, plans] = await Promise.all([
			atacadoRepository.findParceiroById(partnerId),
			atacadoRepository.findClientesAtivosByParceiroId({
				parceiroId: partnerId,
				linhaStatusAtiva: true,
			}),
			atacadoRepository.findAllPlanosDeServico(),
		]);

		return { partner, clients, plans };
	}
}

class InvoiceCalculator {
	private readonly dataService: InvoiceDataService;

	constructor(dataService: InvoiceDataService) {
		this.dataService = dataService;
	}

	async calculate(params: CalculateInvoiceParams): Promise<InvoicePartner> {
		const { partnerId, referenceDate } = params;

		const { partner, clients, plans } =
			await this.dataService.fetchInvoiceData(partnerId);

		this.validateData(partner, clients, plans);

		const lineProcessor = LineProcessor.create(plans);
		const processedClients = this.processClients(clients, lineProcessor);

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

	private validateData(
		partner: Parceiro,
		clients: readonly Cliente[],
		plans: readonly PlanoDeServico[],
	): void {
		if (clients.length === 0) {
			throw NotFoundError.create("Active clients", partner.id ?? 0);
		}

		if (plans.length === 0) {
			throw NotFoundError.create("Service plans", "");
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
			const { lines, total } = lineProcessor.processClientLines(client);

			if (lines.length > 0) {
				processed.push(createClientDetail(client, lines, total));
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

const invoiceService = new InvoiceCalculator(new AtacadoInvoiceDataService());

export { invoiceService, InvoiceCalculator, AtacadoInvoiceDataService };
