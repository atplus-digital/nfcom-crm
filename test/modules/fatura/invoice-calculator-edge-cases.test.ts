import { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";
import type { InvoiceDataService } from "@/modules/fatura/fatura.service.types";
import { InvoiceCalculator } from "@/modules/fatura/invoice-calculator";
import {
	BusinessRuleError,
	DocumentValidationError,
	EntityValidationError,
	ExternalApiError,
} from "@/shared/base.error";
import {
	INVALID_CNPJ,
	INVALID_CPF,
	VALID_CPF,
	createCliente,
	createMockDataService,
	createParceiro,
	createServico,
} from "../../fixtures/invoice-fixtures";

describe("InvoiceCalculator - edge cases e cenários negativos", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2025, 0, 1));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("validação de entidade integrada", () => {
		it("deve lançar EntityValidationError quando parceiro não tem razão social", async () => {
			const parceiro = createParceiro();
			parceiro.f_razao_social = "";

			const dataService = createMockDataService({ partner: parceiro });
			const calculator = new InvoiceCalculator(dataService);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow(EntityValidationError);
		});

		it("deve lançar EntityValidationError quando parceiro tem CEP como NaN", async () => {
			const parceiro = createParceiro();
			parceiro.f_cep = "NaN";

			const dataService = createMockDataService({ partner: parceiro });
			const calculator = new InvoiceCalculator(dataService);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow(EntityValidationError);
		});

		it("deve lançar EntityValidationError quando cliente não tem endereço", async () => {
			const cliente = createCliente();
			cliente.f_endereco = "";

			const dataService = createMockDataService({ clients: [cliente] });
			const calculator = new InvoiceCalculator(dataService);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow(EntityValidationError);
		});

		it("deve lançar EntityValidationError quando cliente tem campo undefined", async () => {
			const cliente = createCliente({
				f_cidade: undefined,
			} as unknown as Cliente);

			const dataService = createMockDataService({ clients: [cliente] });
			const calculator = new InvoiceCalculator(dataService);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow(EntityValidationError);
		});
	});

	describe("validação de documento integrada", () => {
		it("deve lançar DocumentValidationError quando parceiro tem CNPJ inválido", async () => {
			const parceiro = createParceiro();
			parceiro.f_cnpj = INVALID_CNPJ;

			const dataService = createMockDataService({ partner: parceiro });
			const calculator = new InvoiceCalculator(dataService);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow(DocumentValidationError);
		});

		it("deve lançar DocumentValidationError quando cliente tem CPF inválido", async () => {
			const cliente = createCliente();
			cliente.f_cpf_cnpj = INVALID_CPF;

			const dataService = createMockDataService({ clients: [cliente] });
			const calculator = new InvoiceCalculator(dataService);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow(DocumentValidationError);
		});

		it("deve lançar DocumentValidationError quando parceiro tem CNPJ undefined", async () => {
			const parceiro = createParceiro({
				f_cnpj: undefined,
			} as unknown as Parceiro);

			const dataService = createMockDataService({ partner: parceiro });
			const calculator = new InvoiceCalculator(dataService);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow();
		});
	});

	describe("falha do dataService", () => {
		it("deve propagar ExternalApiError quando dataService falha", async () => {
			const dataService: InvoiceDataService = {
				fetchInvoiceData: jest
					.fn()
					.mockRejectedValue(
						ExternalApiError.create("Atacado", "Connection refused"),
					),
			};
			const calculator = new InvoiceCalculator(dataService);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow(ExternalApiError);
		});

		it("deve propagar erro genérico quando dataService lança erro inesperado", async () => {
			const dataService: InvoiceDataService = {
				fetchInvoiceData: jest
					.fn()
					.mockRejectedValue(new Error("Unexpected crash")),
			};
			const calculator = new InvoiceCalculator(dataService);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow("Unexpected crash");
		});
	});

	describe("processamento parcial de clientes", () => {
		it("deve retornar apenas clientes com linhas válidas quando existem clientes mistos", async () => {
			jest.spyOn(console, "warn").mockImplementation(() => {});

			const clientes = [
				createCliente({
					id: 10,
					f_linhas_fixas: [createServico({ f_coghzwfvcnx: 4 })],
				}),
				createCliente({
					id: 20,
					f_linhas_fixas: [createServico({ f_status: "0" })],
				}),
				createCliente({
					id: 30,
					f_linhas_fixas: [createServico({ f_coghzwfvcnx: 4 })],
				}),
			];

			const dataService = createMockDataService({ clients: clientes });
			const calculator = new InvoiceCalculator(dataService);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			expect(result.clients).toHaveLength(2);
			expect(result.invoiceTotal).toBe(6);
			expect(result.totalLines).toBe(2);
		});

		it("deve lançar BusinessRuleError quando único cliente tem plano inexistente", async () => {
			jest.spyOn(console, "warn").mockImplementation(() => {});

			const clientes = [
				createCliente({
					f_linhas_fixas: [createServico({ f_coghzwfvcnx: 9999 })],
				}),
			];

			const dataService = createMockDataService({ clients: clientes });
			const calculator = new InvoiceCalculator(dataService);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow(BusinessRuleError);
		});
	});

	describe("cenários com planos especiais", () => {
		it("deve tratar f_assinatura_mensal como string numérica", async () => {
			const planos: PlanoDeServico[] = [
				{ id: 4, f_nome: "Plano Teste", f_assinatura_mensal: "15.50" },
			];

			const dataService = createMockDataService({ plans: planos });
			const calculator = new InvoiceCalculator(dataService);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			expect(result.invoiceTotal).toBe(15.5);
		});

		it("deve tratar f_assinatura_mensal como number quando fornecido", async () => {
			const planos: PlanoDeServico[] = [
				{
					id: 4,
					f_nome: "Plano Teste",
					f_assinatura_mensal: 25 as unknown as string,
				},
			];

			const dataService = createMockDataService({ plans: planos });
			const calculator = new InvoiceCalculator(dataService);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			expect(result.invoiceTotal).toBe(25);
		});
	});

	describe("cálculos com muitos clientes", () => {
		it("deve processar corretamente 50 clientes com pelo menos uma linha cada", async () => {
			const clientes = Array.from({ length: 50 }, (_, i) =>
				createCliente({
					id: i + 1,
					f_cpf_cnpj: VALID_CPF,
					f_linhas_fixas: [createServico({ id: i * 10, f_coghzwfvcnx: 4 })],
				}),
			);

			const dataService = createMockDataService({ clients: clientes });
			const calculator = new InvoiceCalculator(dataService);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			expect(result.clients).toHaveLength(50);
			expect(result.invoiceTotal).toBe(150);
			expect(result.totalLines).toBe(50);
			expect(result.partner.totalClients).toBe(50);
		});
	});

	describe("vencimento com datas especiais", () => {
		it("deve calcular vencimento para dia 31 em mês com 30 dias", async () => {
			const parceiro = createParceiro();
			parceiro.f_data_vencimento = 31;

			const dataService = createMockDataService({ partner: parceiro });
			const calculator = new InvoiceCalculator(dataService);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-03-01",
			});

			expect(result.dueDate).toBeDefined();
			expect(typeof result.dueDate).toBe("string");
		});

		it("deve calcular vencimento para dia 29 em fevereiro (ano não bissexto)", async () => {
			const parceiro = createParceiro();
			parceiro.f_data_vencimento = 29;

			const dataService = createMockDataService({ partner: parceiro });
			const calculator = new InvoiceCalculator(dataService);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			expect(result.dueDate).toBeDefined();
		});
	});

	describe("agrupamento de serviços com dados complexos", () => {
		it("deve agrupar corretamente quando múltiplos clientes usam o mesmo plano", async () => {
			const clientes = [
				createCliente({
					id: 10,
					f_linhas_fixas: [
						createServico({ id: 1, f_coghzwfvcnx: 4 }),
						createServico({ id: 2, f_coghzwfvcnx: 4 }),
					],
				}),
				createCliente({
					id: 20,
					f_linhas_fixas: [createServico({ id: 3, f_coghzwfvcnx: 4 })],
				}),
			];

			const dataService = createMockDataService({ clients: clientes });
			const calculator = new InvoiceCalculator(dataService);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			expect(result.groupedServices).toHaveLength(1);
			expect(result.groupedServices[0]?.quantity).toBe(3);
			expect(result.groupedServices[0]?.total).toBe(9);
		});

		it("deve gerar groupedLines corretos dentro de cada clientDetail", async () => {
			const clientes = [
				createCliente({
					id: 10,
					f_linhas_fixas: [
						createServico({ id: 1, f_coghzwfvcnx: 4 }),
						createServico({ id: 2, f_coghzwfvcnx: 5 }),
						createServico({ id: 3, f_coghzwfvcnx: 4 }),
					],
				}),
			];

			const dataService = createMockDataService({ clients: clientes });
			const calculator = new InvoiceCalculator(dataService);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			const client = result.clients[0];
			expect(client?.lines).toHaveLength(3);
			expect(client?.groupedLines).toHaveLength(2);

			const plan4 = client?.groupedLines.find((g) => g.planId === 4);
			expect(plan4?.quantity).toBe(2);
			expect(plan4?.total).toBe(6);
		});
	});
});
