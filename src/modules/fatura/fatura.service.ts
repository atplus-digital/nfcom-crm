import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";
import { atacadoRepository } from "@/modules/atacado/atacado.repository";
import { documentValidator } from "@/modules/fatura/validators/document.validator";
import { entityValidator } from "@/modules/fatura/validators/entity.validator";
import { BusinessRuleError, NotFoundError } from "@/shared/base.error";
import { DATES } from "./constants";
import { createClientDetail } from "./domain/cliente-builder";
import { calculateDueDate } from "./domain/date-calculator";
import { LineProcessor } from "./domain/linha-processor";
import { createPartnerInvoice } from "./domain/parceiro-builder";
import type {
	CalculateInvoiceParams,
	ClientDetail,
	InvoicePartner,
	TipoFaturamento,
} from "./domain/types";

/**
 * Interface para o serviço de dados da fatura
 * Segue o princípio de Inversão de Dependência (DIP)
 */
interface InvoiceDataService {
	fetchInvoiceData(partnerId: string | number): Promise<{
		partner: Parceiro;
		clients: readonly Cliente[];
		plans: readonly PlanoDeServico[];
	}>;
}

/**
 * Configurações específicas por tipo de faturamento
 */
type BillingTypeConfig = {
	requiresPartnerValidation: boolean;
	allowsDirectClientBilling: boolean;
};

const BILLING_TYPE_CONFIG: Record<TipoFaturamento, BillingTypeConfig> = {
	parceiro: {
		requiresPartnerValidation: true,
		allowsDirectClientBilling: false,
	},
	"via-parceiro": {
		requiresPartnerValidation: true,
		allowsDirectClientBilling: false,
	},
	cofaturamento: {
		requiresPartnerValidation: true,
		allowsDirectClientBilling: true,
	},
	"cliente-final": {
		requiresPartnerValidation: false,
		allowsDirectClientBilling: true,
	},
};

class AtacadoInvoiceDataService implements InvoiceDataService {
	async fetchInvoiceData(partnerId: string | number) {
		const [partner, clients, plans] = await Promise.all([
			atacadoRepository.findParceiroById(partnerId),
			atacadoRepository.findClientesAtivosByParceiroId({
				partnerId: partnerId,
				activeLineStatus: true,
			}),
			atacadoRepository.findAllPlanosDeServico(),
		]);

		return { partner, clients, plans };
	}
}

/**
 * FaturaService - Serviço principal para cálculo e processamento de faturas
 *
 * Responsabilidades:
 * - Calcular valores de faturamento baseado em clientes ativos
 * - Processar linhas de serviço e agrupar por plano
 * - Validar dados de parceiros e clientes
 * - Calcular data de vencimento
 * - Aplicar regras de negócio específicas por tipo de faturamento
 *
 * @example
 * const service = new InvoiceCalculator(dataService);
 * const result = await service.calculate({
 *   partnerId: 123,
 *   referenceDate: '2024-03-01',
 *   billingType: 'parceiro'
 * });
 */
class InvoiceCalculator {
	private readonly dataService: InvoiceDataService;

	constructor(dataService: InvoiceDataService) {
		this.dataService = dataService;
	}

	/**
	 * Calcula e prepara os dados da fatura para um parceiro
	 * @param params - Parâmetros de entrada do cálculo
	 * @returns Dados completos da fatura processada
	 * @throws BusinessRuleError se tipo de faturamento inválido
	 * @throws NotFoundError se parceiro/clientes/planos não encontrados
	 */
	async calculate(params: CalculateInvoiceParams): Promise<InvoicePartner> {
		const { partnerId, referenceDate, billingType = "parceiro" } = params;

		// Valida tipo de faturamento
		this.validateBillingType(billingType);

		// Busca dados necessários
		const { partner, clients, plans } =
			await this.dataService.fetchInvoiceData(partnerId);

		// Validação baseada no tipo de faturamento
		const config = BILLING_TYPE_CONFIG[billingType];
		this.validateData(partner, clients, plans, config);

		// Processa linhas e calcula valores
		const lineProcessor = LineProcessor.create(plans);
		const processedClients = this.processClients(clients, lineProcessor);

		// Valida se há clientes processados
		if (processedClients.length === 0) {
			throw BusinessRuleError.create(
				"Nenhum cliente com linhas ativas encontrado para faturamento",
				{ resource: "Invoice Processing", identifier: partnerId },
			);
		}

		// Calcula totais
		const invoiceTotal = this.calculateTotal(processedClients);
		const totalLines = this.calculateTotalLines(processedClients);
		const dueDate = this.calculateInvoiceDueDate(partner, referenceDate);
		const groupedServices = LineProcessor.groupServices(processedClients);

		// Cria estrutura de resposta
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

	/**
	 * Valida se o tipo de faturamento é válido
	 */
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

	/**
	 * Valida dados do parceiro, clientes e planos
	 */
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

	/**
	 * Processa clientes e suas linhas de serviço
	 */
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
				// Log warning mas continua processando outros clientes
				console.warn(`Erro ao processar cliente ${client.id}: ${error}`);
			}
		}

		return processed;
	}

	/**
	 * Calcula total geral da fatura
	 */
	private calculateTotal(clients: readonly ClientDetail[]): number {
		return clients.reduce((sum, c) => sum + c.total, 0);
	}

	/**
	 * Calcula total de linhas processadas
	 */
	private calculateTotalLines(clients: readonly ClientDetail[]): number {
		return clients.reduce((sum, c) => sum + c.totalLines, 0);
	}

	/**
	 * Calcula data de vencimento baseada no parceiro e data de referência
	 */
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
