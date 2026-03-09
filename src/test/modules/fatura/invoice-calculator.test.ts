import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";
import type { Servico } from "@/@types/atacado/Servico";
import type { InvoiceDataService } from "@/modules/fatura/fatura.service.types";
import { InvoiceCalculator } from "@/modules/fatura/invoice-calculator";
import { BusinessRuleError, NotFoundError } from "@/shared/base.error";

const validCNPJ = "11222333000181";
const validCPF = "52998224725";

const createParceiro = (overrides?: Partial<Parceiro>): Parceiro => ({
	id: 1,
	f_razao_social: "Empresa Teste",
	f_cnpj: validCNPJ,
	f_endereco: "Rua Teste",
	f_numero: "100",
	f_bairro: "Centro",
	f_cidade: "São Paulo",
	f_uf: "SP",
	f_cep: "01000000",
	f_data_vencimento: 10,
	...overrides,
});

const createServico = (overrides?: Partial<Servico>): Servico => ({
	id: 100,
	f_status: "1",
	f_coghzwfvcnx: 4,
	...overrides,
});

const createCliente = (overrides?: Partial<Cliente>): Cliente => ({
	id: 10,
	f_nome_razao: "Cliente Teste",
	f_cpf_cnpj: validCPF,
	f_endereco: "Rua Cliente",
	f_numero: "200",
	f_bairro: "Bairro",
	f_cidade: "São Paulo",
	f_uf: "SP",
	f_cep: "02000000",
	f_linhas_fixas: [createServico()],
	...overrides,
});

const defaultPlanos: PlanoDeServico[] = [
	{
		id: 4,
		f_nome: "1 Linha - 1 Canal",
		f_assinatura_mensal: "3",
	},
	{
		id: 5,
		f_nome: "1 Linha - 2 Canais",
		f_assinatura_mensal: "5",
	},
];

const createMockDataService = (
	overrides?: Partial<{
		partner: Parceiro;
		clients: Cliente[];
		plans: PlanoDeServico[];
	}>,
): InvoiceDataService => ({
	fetchInvoiceData: jest.fn().mockResolvedValue({
		partner: overrides?.partner ?? createParceiro(),
		clients: overrides?.clients ?? [createCliente()],
		plans: overrides?.plans ?? defaultPlanos,
	}),
});

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
