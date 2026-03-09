import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";
import { InvoiceCalculator } from "@/modules/fatura/invoice-calculator";
import type { InvoiceDataService } from "@/modules/fatura/invoice.service.types";
import {
	BusinessRuleError,
	DocumentValidationError,
	EntityValidationError,
} from "@/shared/base.error";
import {
	createCliente,
	createParceiro,
	createServico,
} from "../../fixtures/invoice-fixtures";

const planos: PlanoDeServico[] = [
	{ id: 1, f_nome: "Básico - 1 Canal", f_assinatura_mensal: "10" },
	{ id: 2, f_nome: "Intermediário - 3 Canais", f_assinatura_mensal: "25" },
	{ id: 3, f_nome: "Avançado - 5 Canais", f_assinatura_mensal: "50" },
	{ id: 4, f_nome: "Enterprise - 10 Canais", f_assinatura_mensal: "100" },
];

const createDataService = (
	partner: Parceiro,
	clients: Cliente[],
	plans: PlanoDeServico[] = planos,
): InvoiceDataService => ({
	fetchInvoiceData: jest.fn().mockResolvedValue({ partner, clients, plans }),
});

describe("Pipeline de integração: Calculator + Validators + Processor + Builders", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2025, 0, 1));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("fluxo completo de sucesso", () => {
		it("deve processar fatura com 1 parceiro, 3 clientes, múltiplos planos", async () => {
			const clientes = [
				createCliente({
					id: 10,
					f_nome_razao: "Cliente Alpha",
					f_linhas_fixas: [
						createServico({ id: 1, f_coghzwfvcnx: 1 }),
						createServico({ id: 2, f_coghzwfvcnx: 2 }),
					],
				}),
				createCliente({
					id: 20,
					f_nome_razao: "Cliente Beta",
					f_linhas_fixas: [
						createServico({ id: 3, f_coghzwfvcnx: 2 }),
						createServico({ id: 4, f_coghzwfvcnx: 3 }),
						createServico({ id: 5, f_coghzwfvcnx: 3 }),
					],
				}),
				createCliente({
					id: 30,
					f_nome_razao: "Cliente Gamma",
					f_linhas_fixas: [createServico({ id: 6, f_coghzwfvcnx: 4 })],
				}),
			];

			const parceiro = createParceiro({
				f_razao_social: "Distribuidora Nacional LTDA",
				f_data_vencimento: 20,
			});
			const calculator = new InvoiceCalculator(
				createDataService(parceiro, clientes),
			);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			expect(result.clients).toHaveLength(3);
			expect(result.invoiceTotal).toBe(10 + 25 + 25 + 50 + 50 + 100);
			expect(result.totalLines).toBe(6);
			expect(result.dueDate).toBe("2025-02-20");

			expect(result.partner.totalClients).toBe(3);
			expect(result.partner.totalLines).toBe(6);
			expect(result.partner.invoiceTotal).toBe(260);
			expect(result.partner.partner.f_razao_social).toBe(
				"Distribuidora Nacional LTDA",
			);

			expect(result.groupedServices).toHaveLength(4);

			const basico = result.groupedServices.find((s) => s.planId === 1);
			expect(basico?.quantity).toBe(1);
			expect(basico?.total).toBe(10);

			const intermediario = result.groupedServices.find((s) => s.planId === 2);
			expect(intermediario?.quantity).toBe(2);
			expect(intermediario?.total).toBe(50);

			const avancado = result.groupedServices.find((s) => s.planId === 3);
			expect(avancado?.quantity).toBe(2);
			expect(avancado?.total).toBe(100);

			const enterprise = result.groupedServices.find((s) => s.planId === 4);
			expect(enterprise?.quantity).toBe(1);
			expect(enterprise?.total).toBe(100);
		});

		it("deve gerar groupedLines corretos dentro de cada clientDetail", async () => {
			const clientes = [
				createCliente({
					id: 10,
					f_linhas_fixas: [
						createServico({ id: 1, f_coghzwfvcnx: 1 }),
						createServico({ id: 2, f_coghzwfvcnx: 1 }),
						createServico({ id: 3, f_coghzwfvcnx: 2 }),
					],
				}),
			];

			const calculator = new InvoiceCalculator(
				createDataService(createParceiro(), clientes),
			);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			const client = result.clients[0];

			if (!client) {
				fail("Client deveria existir");
			}
			expect(client.lines).toHaveLength(3);
			expect(client.groupedLines).toHaveLength(2);

			const grouped1 = client.groupedLines.find((g) => g.planId === 1);
			expect(grouped1?.quantity).toBe(2);
			expect(grouped1?.total).toBe(20);

			const grouped2 = client.groupedLines.find((g) => g.planId === 2);
			expect(grouped2?.quantity).toBe(1);
			expect(grouped2?.total).toBe(25);
		});
	});

	describe("fluxo com clientes mistos (válidos e inválidos)", () => {
		it("deve processar apenas clientes com linhas ativas, ignorando inativos", async () => {
			jest.spyOn(console, "warn").mockImplementation(() => {});

			const clientes = [
				createCliente({
					id: 10,
					f_linhas_fixas: [createServico({ id: 1, f_coghzwfvcnx: 1 })],
				}),
				createCliente({
					id: 20,
					f_linhas_fixas: [
						createServico({ id: 2, f_status: "0", f_coghzwfvcnx: 2 }),
					],
				}),
				createCliente({
					id: 30,
					f_linhas_fixas: [createServico({ id: 3, f_coghzwfvcnx: 3 })],
				}),
			];

			const calculator = new InvoiceCalculator(
				createDataService(createParceiro(), clientes),
			);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			expect(result.clients).toHaveLength(2);
			expect(result.invoiceTotal).toBe(60);
		});

		it("deve ignorar clientes com plano inexistente e processar os demais", async () => {
			jest.spyOn(console, "warn").mockImplementation(() => {});

			const clientes = [
				createCliente({
					id: 10,
					f_linhas_fixas: [createServico({ id: 1, f_coghzwfvcnx: 9999 })],
				}),
				createCliente({
					id: 20,
					f_linhas_fixas: [createServico({ id: 2, f_coghzwfvcnx: 1 })],
				}),
			];

			const calculator = new InvoiceCalculator(
				createDataService(createParceiro(), clientes),
			);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			expect(result.clients).toHaveLength(1);
			expect(result.invoiceTotal).toBe(10);
		});
	});

	describe("validações de entidade no pipeline", () => {
		it("deve falhar antes de processar linhas quando parceiro tem campo obrigatório vazio", async () => {
			const parceiro = createParceiro({ f_uf: "" });
			const clientes = [createCliente()];

			const calculator = new InvoiceCalculator(
				createDataService(parceiro, clientes),
			);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow(EntityValidationError);
		});

		it("deve falhar quando primeiro cliente tem endereço vazio", async () => {
			const clientes = [
				createCliente({ id: 10, f_bairro: "" }),
				createCliente({ id: 20 }),
			];

			const calculator = new InvoiceCalculator(
				createDataService(createParceiro(), clientes),
			);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow(EntityValidationError);
		});

		it("deve falhar quando segundo cliente tem CPF/CNPJ vazio", async () => {
			const clientes = [
				createCliente({ id: 10 }),
				createCliente({ id: 20, f_cpf_cnpj: undefined } as unknown as Cliente),
			];

			const calculator = new InvoiceCalculator(
				createDataService(createParceiro(), clientes),
			);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow(EntityValidationError);
		});
	});

	describe("validações de documento no pipeline", () => {
		it("deve falhar quando CNPJ do parceiro é inválido", async () => {
			const parceiro = createParceiro({ f_cnpj: "00000000000000" });
			const clientes = [createCliente()];

			const calculator = new InvoiceCalculator(
				createDataService(parceiro, clientes),
			);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow(DocumentValidationError);
		});

		it("deve falhar quando CPF de um cliente é inválido", async () => {
			const clientes = [
				createCliente({ id: 10 }),
				createCliente({ id: 20, f_cpf_cnpj: "00000000000" }),
			];

			const calculator = new InvoiceCalculator(
				createDataService(createParceiro(), clientes),
			);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow(DocumentValidationError);
		});
	});

	describe("cenários de borda com dados", () => {
		it("deve lançar BusinessRuleError quando todos os clientes têm linhas inativas", async () => {
			jest.spyOn(console, "warn").mockImplementation(() => {});

			const clientes = [
				createCliente({
					id: 10,
					f_linhas_fixas: [createServico({ f_status: "0" })],
				}),
				createCliente({
					id: 20,
					f_linhas_fixas: [createServico({ f_status: "2" })],
				}),
			];

			const calculator = new InvoiceCalculator(
				createDataService(createParceiro(), clientes),
			);

			await expect(
				calculator.calculate({ partnerId: 1, referenceDate: "2025-01-01" }),
			).rejects.toThrow(BusinessRuleError);
		});

		it("deve processar clientes onde linhas mistas (ativa + inativa) geram resultado parcial", async () => {
			const clientes = [
				createCliente({
					id: 10,
					f_linhas_fixas: [
						createServico({ id: 1, f_status: "1", f_coghzwfvcnx: 1 }),
						createServico({ id: 2, f_status: "0", f_coghzwfvcnx: 2 }),
						createServico({ id: 3, f_status: "1", f_coghzwfvcnx: 3 }),
					],
				}),
			];

			const calculator = new InvoiceCalculator(
				createDataService(createParceiro(), clientes),
			);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			expect(result.clients).toHaveLength(1);
			expect(result.totalLines).toBe(2);
			expect(result.invoiceTotal).toBe(60);
		});
	});

	describe("consistência entre totais", () => {
		it("deve garantir que invoiceTotal == soma dos totais dos clientes", async () => {
			const clientes = [
				createCliente({
					id: 10,
					f_linhas_fixas: [
						createServico({ id: 1, f_coghzwfvcnx: 1 }),
						createServico({ id: 2, f_coghzwfvcnx: 2 }),
					],
				}),
				createCliente({
					id: 20,
					f_linhas_fixas: [createServico({ id: 3, f_coghzwfvcnx: 3 })],
				}),
			];

			const calculator = new InvoiceCalculator(
				createDataService(createParceiro(), clientes),
			);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			const sumOfClients = result.clients.reduce((s, c) => s + c.total, 0);
			expect(result.invoiceTotal).toBe(sumOfClients);
		});

		it("deve garantir que totalLines == soma dos totalLines dos clientes", async () => {
			const clientes = [
				createCliente({
					id: 10,
					f_linhas_fixas: [
						createServico({ id: 1, f_coghzwfvcnx: 1 }),
						createServico({ id: 2, f_coghzwfvcnx: 1 }),
					],
				}),
				createCliente({
					id: 20,
					f_linhas_fixas: [
						createServico({ id: 3, f_coghzwfvcnx: 2 }),
						createServico({ id: 4, f_coghzwfvcnx: 3 }),
						createServico({ id: 5, f_coghzwfvcnx: 4 }),
					],
				}),
			];

			const calculator = new InvoiceCalculator(
				createDataService(createParceiro(), clientes),
			);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			const sumOfLines = result.clients.reduce((s, c) => s + c.totalLines, 0);
			expect(result.totalLines).toBe(sumOfLines);
		});

		it("deve garantir que groupedServices.total == soma(unitPrice * quantity)", async () => {
			const clientes = [
				createCliente({
					id: 10,
					f_linhas_fixas: [
						createServico({ id: 1, f_coghzwfvcnx: 1 }),
						createServico({ id: 2, f_coghzwfvcnx: 1 }),
						createServico({ id: 3, f_coghzwfvcnx: 2 }),
					],
				}),
				createCliente({
					id: 20,
					f_linhas_fixas: [createServico({ id: 4, f_coghzwfvcnx: 2 })],
				}),
			];

			const calculator = new InvoiceCalculator(
				createDataService(createParceiro(), clientes),
			);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			for (const service of result.groupedServices) {
				expect(service.total).toBe(service.unitPrice * service.quantity);
			}
		});

		it("deve garantir que partner.invoiceTotal == invoiceTotal", async () => {
			const clientes = [
				createCliente({
					id: 10,
					f_linhas_fixas: [
						createServico({ id: 1, f_coghzwfvcnx: 1 }),
						createServico({ id: 2, f_coghzwfvcnx: 4 }),
					],
				}),
			];

			const calculator = new InvoiceCalculator(
				createDataService(createParceiro(), clientes),
			);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			expect(result.partner.invoiceTotal).toBe(result.invoiceTotal);
			expect(result.partner.totalClients).toBe(result.clients.length);
			expect(result.partner.totalLines).toBe(result.totalLines);
		});
	});

	describe("integração com data de vencimento", () => {
		it("deve usar f_data_vencimento do parceiro para calcular dueDate", async () => {
			const parceiro = createParceiro({ f_data_vencimento: 25 });
			const clientes = [createCliente()];

			const calculator = new InvoiceCalculator(
				createDataService(parceiro, clientes),
			);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			expect(result.dueDate).toBe("2025-02-25");
		});

		it("deve respeitar limite mínimo de 6 dias quando vencimento é próximo", async () => {
			jest.setSystemTime(new Date(2025, 1, 7));

			const parceiro = createParceiro({ f_data_vencimento: 10 });
			const clientes = [createCliente()];

			const calculator = new InvoiceCalculator(
				createDataService(parceiro, clientes),
			);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			});

			const dueDate = new Date(result.dueDate);
			const today = new Date(2025, 1, 7);
			const diffDays = Math.ceil(
				(dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
			);
			expect(diffDays).toBeGreaterThanOrEqual(6);
		});
	});
});
