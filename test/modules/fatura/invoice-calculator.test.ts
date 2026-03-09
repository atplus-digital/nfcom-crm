import type { Parceiro } from "@/@types/atacado/Parceiro";
import { InvoiceCalculator } from "@/modules/fatura/invoice-calculator";
import { BusinessRuleError, NotFoundError } from "@/shared/base.error";
import {
	createCliente,
	createMockDataService,
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
		const dataService = createMockDataService();
		const calculator = new InvoiceCalculator(dataService);

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

		const dataService = createMockDataService({ clients: clientes });
		const calculator = new InvoiceCalculator(dataService);

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
		const dataService = createMockDataService({ clients: [] });
		const calculator = new InvoiceCalculator(dataService);

		await expect(
			calculator.calculate({
				partnerId: 1,
				referenceDate: "2025-01-01",
			}),
		).rejects.toThrow(NotFoundError);
	});

	it("deve lançar NotFoundError quando não há planos", async () => {
		const dataService = createMockDataService({ plans: [] });
		const calculator = new InvoiceCalculator(dataService);

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

		const dataService = createMockDataService({ clients: clientes });
		const calculator = new InvoiceCalculator(dataService);

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
		} as unknown as Parceiro);
		const dataService = createMockDataService({ partner: parceiro });
		const calculator = new InvoiceCalculator(dataService);

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

		const dataService = createMockDataService({ clients: clientes });
		const calculator = new InvoiceCalculator(dataService);

		const result = await calculator.calculate({
			partnerId: 1,
			referenceDate: "2025-01-01",
		});

		expect(result.groupedServices).toHaveLength(2);

		const plano4 = result.groupedServices.find((s) => s.planId === 4);
		expect(plano4?.quantity).toBe(2);
		expect(plano4?.total).toBe(6);
	});

	it("deve ignorar clientes com erro de processamento e continuar", async () => {
		const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

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

		const dataService = createMockDataService({ clients: clientes });
		const calculator = new InvoiceCalculator(dataService);

		const result = await calculator.calculate({
			partnerId: 1,
			referenceDate: "2025-01-01",
		});

		expect(result.clients).toHaveLength(1);
		expect(consoleSpy).toHaveBeenCalled();

		consoleSpy.mockRestore();
	});

	it("deve chamar dataService.fetchInvoiceData com partnerId correto", async () => {
		const dataService = createMockDataService();
		const calculator = new InvoiceCalculator(dataService);

		await calculator.calculate({
			partnerId: 42,
			referenceDate: "2025-01-01",
		});

		expect(dataService.fetchInvoiceData).toHaveBeenCalledWith(42);
	});
});
