import { InvoiceCalculator } from "@/modules/invoice-service/invoice-calculator/invoice-calculator";
import { BusinessRuleError, NotFoundError } from "@/shared/base.error";
import {
	createCliente,
	createMockRepository,
	createParceiro,
	createServico,
} from "../../fixtures/invoice-fixtures";

describe("InvoiceCalculator", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2025, 0, 1));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("deve calcular fatura com sucesso", async () => {
		const repository = createMockRepository();
		const calculator = new InvoiceCalculator(repository);

		const result = await calculator.calculate({
			partnerId: 1,
			referenceDate: "2025-01-01",
		});

		expect(result.invoiceTotal).toBe(3);
		expect(result.totalLines).toBe(1);
		expect(result.clients).toHaveLength(1);
		expect(result.partner.partner).toEqual(createParceiro());
		expect(result.dueDate).toBe("2025-02-10");
		expect(result.groupedServices).toHaveLength(1);
	});

	it("deve processar múltiplos clientes", async () => {
		const clientes = [
			createCliente({
				id: 10,
				f_linhas_fixas: [createServico({ f_coghzwfvcnx: 4 })],
			}),
			createCliente({
				id: 20,
				f_linhas_fixas: [createServico({ f_coghzwfvcnx: 5 })],
			}),
		];

		const repository = createMockRepository({ clients: clientes });
		const calculator = new InvoiceCalculator(repository);

		const result = await calculator.calculate({
			partnerId: 1,
			referenceDate: "2025-01-01",
		});

		expect(result.clients).toHaveLength(2);
		expect(result.invoiceTotal).toBe(8);
		expect(result.totalLines).toBe(2);
		expect(result.partner.totalClients).toBe(2);
	});

	it("deve lançar NotFoundError quando não há clientes", async () => {
		const repository = createMockRepository({ clients: [] });
		const calculator = new InvoiceCalculator(repository);

		await expect(
			calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			}),
		).rejects.toThrow(NotFoundError);
	});

	it("deve lançar NotFoundError quando não há planos", async () => {
		const repository = createMockRepository({ plans: [] });
		const calculator = new InvoiceCalculator(repository);

		await expect(
			calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			}),
		).rejects.toThrow(NotFoundError);
	});

	it("deve lançar BusinessRuleError quando todos os clientes falham no processamento", async () => {
		const clientes = [
			createCliente({
				id: 10,
				f_linhas_fixas: [createServico({ f_status: "0" })],
			}),
		];

		const repository = createMockRepository({ clients: clientes });
		const calculator = new InvoiceCalculator(repository);

		await expect(
			calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			}),
		).rejects.toThrow(BusinessRuleError);
	});

	it("deve usar data de vencimento padrão quando parceiro não tem", async () => {
		const parceiro = createParceiro({
			f_data_vencimento: undefined,
		});
		const repository = createMockRepository({ partner: parceiro });
		const calculator = new InvoiceCalculator(repository);

		const result = await calculator.calculate({
			partnerId: 1,
			referenceDate: "2025-01-01",
		});

		expect(result.dueDate).toBe("2025-02-10");
	});

	it("deve agrupar serviços corretamente", async () => {
		const clientes = [
			createCliente({
				id: 10,
				f_linhas_fixas: [
					createServico({ id: 100, f_coghzwfvcnx: 4 }),
					createServico({ id: 101, f_coghzwfvcnx: 4 }),
				],
			}),
			createCliente({
				id: 20,
				f_linhas_fixas: [createServico({ id: 200, f_coghzwfvcnx: 5 })],
			}),
		];

		const repository = createMockRepository({ clients: clientes });
		const calculator = new InvoiceCalculator(repository);

		const result = await calculator.calculate({
			partnerId: 1,
			referenceDate: "2025-01-01",
		});

		expect(result.groupedServices).toHaveLength(2);

		const plano4 = result.groupedServices.find((s) => s.planId === 4);
		expect(plano4?.quantity).toBe(2);
		expect(plano4?.total).toBe(6);
	});

	it("deve lançar BusinessRuleError quando cliente tem erro de processamento", async () => {
		const clientes = [
			createCliente({
				id: 10,
				f_linhas_fixas: [createServico({ f_coghzwfvcnx: 9999 })],
			}),
			createCliente({
				id: 20,
				f_linhas_fixas: [createServico({ f_coghzwfvcnx: 4 })],
			}),
		];

		const repository = createMockRepository({ clients: clientes });
		const calculator = new InvoiceCalculator(repository);

		await expect(
			calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			}),
		).rejects.toThrow(BusinessRuleError);
	});

	it("deve chamar métodos do repository com partnerId correto", async () => {
		const repository = createMockRepository();
		const calculator = new InvoiceCalculator(repository);

		await calculator.calculate({
			partnerId: 42,
			referenceDate: "2025-01-01",
		});

		expect(repository.findParceiroById).toHaveBeenCalledWith(42);
		expect(repository.findClientesAtivosByParceiroId).toHaveBeenCalledWith({
			partnerId: 42,
			activeLineStatus: true,
		});
	});

	describe("billingType na preparação para persistência", () => {
		it("deve mapear parceiro com 1 cobrança e 1 destinatário parceiro", async () => {
			const repository = createMockRepository();
			const calculator = new InvoiceCalculator(repository);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
				billingType: "parceiro",
			});

			expect(result.billingPlan.charges).toHaveLength(1);
			expect(result.billingPlan.charges[0]?.debtor.type).toBe("partner");
			expect(result.billingPlan.charges[0]?.noteRecipients).toHaveLength(1);
			expect(
				result.billingPlan.charges[0]?.noteRecipients[0]?.recipient.type,
			).toBe("partner");
		});

		it("deve mapear via-parceiro com 1 cobrança do parceiro e notas por cliente", async () => {
			const clients = [
				createCliente({ id: 10, f_linhas_fixas: [createServico({ id: 1 })] }),
				createCliente({ id: 20, f_linhas_fixas: [createServico({ id: 2 })] }),
			];
			const repository = createMockRepository({ clients });
			const calculator = new InvoiceCalculator(repository);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
				billingType: "via-parceiro",
			});

			expect(result.billingPlan.charges).toHaveLength(1);
			expect(result.billingPlan.charges[0]?.debtor.type).toBe("partner");
			expect(result.billingPlan.charges[0]?.noteRecipients).toHaveLength(2);
			expect(
				result.billingPlan.charges[0]?.noteRecipients.every(
					(note) => note.recipient.type === "client",
				),
			).toBe(true);
		});

		it("deve mapear cofaturamento igual ao via-parceiro", async () => {
			const clients = [
				createCliente({ id: 30, f_linhas_fixas: [createServico({ id: 3 })] }),
				createCliente({ id: 40, f_linhas_fixas: [createServico({ id: 4 })] }),
			];
			const repository = createMockRepository({ clients });
			const calculator = new InvoiceCalculator(repository);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
				billingType: "cofaturamento",
			});

			expect(result.billingPlan.charges).toHaveLength(1);
			expect(result.billingPlan.charges[0]?.debtor.type).toBe("partner");
			expect(result.billingPlan.charges[0]?.noteRecipients).toHaveLength(2);
			expect(
				result.billingPlan.charges[0]?.noteRecipients.every(
					(note) => note.recipient.type === "client",
				),
			).toBe(true);
		});

		it("deve mapear cliente-final com cobranças e destinatários por cliente", async () => {
			const clients = [
				createCliente({ id: 50, f_linhas_fixas: [createServico({ id: 5 })] }),
				createCliente({ id: 60, f_linhas_fixas: [createServico({ id: 6 })] }),
			];
			const repository = createMockRepository({ clients });
			const calculator = new InvoiceCalculator(repository);

			const result = await calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
				billingType: "cliente-final",
			});

			expect(result.billingPlan.charges).toHaveLength(2);
			expect(
				result.billingPlan.charges.every(
					(charge) => charge.debtor.type === "client",
				),
			).toBe(true);
			expect(
				result.billingPlan.charges.every(
					(charge) => charge.noteRecipients[0]?.recipient.type === "client",
				),
			).toBe(true);
		});
	});
});
