import type { Cliente } from "@/@types/atacado/Cliente";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";
import type { Servico } from "@/@types/atacado/Servico";
import { LineProcessor } from "@/modules/fatura/domain/line-processor";
import { BusinessRuleError } from "@/shared/base.error";

const createPlano = (overrides?: Partial<PlanoDeServico>): PlanoDeServico => ({
	id: 4,
	f_nome: "1 Linha - 1 Canal",
	f_assinatura_mensal: "3",
	...overrides,
});

const createServico = (overrides?: Partial<Servico>): Servico => ({
	id: 100,
	f_status: "1",
	f_coghzwfvcnx: 4,
	...overrides,
});

const createCliente = (overrides?: Partial<Cliente>): Cliente => ({
	id: 1,
	f_nome_razao: "Cliente Teste",
	f_linhas_fixas: [createServico()],
	...overrides,
});

const defaultPlanos: PlanoDeServico[] = [
	createPlano({ id: 4, f_nome: "1 Linha - 1 Canal", f_assinatura_mensal: "3" }),
	createPlano({
		id: 5,
		f_nome: "1 Linha - 2 Canais",
		f_assinatura_mensal: "5",
	}),
	createPlano({
		id: 6,
		f_nome: "1 Linha - 5 Canais",
		f_assinatura_mensal: "13",
	}),
];

describe("LineProcessor", () => {
	describe("create", () => {
		it("deve criar instância com planos válidos", () => {
			const processor = LineProcessor.create(defaultPlanos);
			expect(processor).toBeInstanceOf(LineProcessor);
		});

		it("deve filtrar planos sem id", () => {
			const planos = [
				createPlano({ id: undefined } as unknown as PlanoDeServico),
				createPlano({ id: 4 }),
			];
			const processor = LineProcessor.create(planos);
			const cliente = createCliente();

			const { lines } = processor.processClientLines(cliente);
			expect(lines).toHaveLength(1);
		});
	});

	describe("processClientLines", () => {
		it("deve processar linhas ativas do cliente", () => {
			const processor = LineProcessor.create(defaultPlanos);
			const cliente = createCliente({
				f_linhas_fixas: [
					createServico({ id: 100, f_coghzwfvcnx: 4 }),
					createServico({ id: 101, f_coghzwfvcnx: 5 }),
				],
			});

			const { lines, total } = processor.processClientLines(cliente);

			expect(lines).toHaveLength(2);
			expect(total).toBe(8);
		});

		it("deve ignorar linhas inativas", () => {
			const processor = LineProcessor.create(defaultPlanos);
			const cliente = createCliente({
				f_linhas_fixas: [
					createServico({ id: 100, f_status: "1", f_coghzwfvcnx: 4 }),
					createServico({ id: 101, f_status: "0", f_coghzwfvcnx: 5 }),
				],
			});

			const { lines, total } = processor.processClientLines(cliente);

			expect(lines).toHaveLength(1);
			expect(total).toBe(3);
		});

		it("deve lançar BusinessRuleError quando cliente não tem linhas", () => {
			const processor = LineProcessor.create(defaultPlanos);
			const cliente = createCliente({ f_linhas_fixas: [] });

			expect(() => processor.processClientLines(cliente)).toThrow(
				BusinessRuleError,
			);
		});

		it("deve lançar BusinessRuleError quando f_linhas_fixas é undefined", () => {
			const processor = LineProcessor.create(defaultPlanos);
			const cliente = createCliente({
				f_linhas_fixas: undefined,
			} as unknown as Cliente);

			expect(() => processor.processClientLines(cliente)).toThrow(
				BusinessRuleError,
			);
		});

		it("deve lançar BusinessRuleError quando plano não é encontrado", () => {
			const processor = LineProcessor.create(defaultPlanos);
			const cliente = createCliente({
				f_linhas_fixas: [createServico({ f_coghzwfvcnx: 9999 })],
			});

			expect(() => processor.processClientLines(cliente)).toThrow(
				BusinessRuleError,
			);
		});

		it("deve lançar BusinessRuleError quando plano tem valor 0", () => {
			const planos = [createPlano({ id: 4, f_assinatura_mensal: "0" })];
			const processor = LineProcessor.create(planos);
			const cliente = createCliente();

			expect(() => processor.processClientLines(cliente)).toThrow(
				BusinessRuleError,
			);
		});

		it("deve lançar BusinessRuleError quando plano tem nome padrão", () => {
			const planos = [
				createPlano({ id: 4, f_nome: "Cadastrar Plano no Fluxo" }),
			];
			const processor = LineProcessor.create(planos);
			const cliente = createCliente();

			expect(() => processor.processClientLines(cliente)).toThrow(
				BusinessRuleError,
			);
		});

		it("deve lançar BusinessRuleError quando f_coghzwfvcnx é undefined", () => {
			const processor = LineProcessor.create(defaultPlanos);
			const cliente = createCliente({
				f_linhas_fixas: [
					createServico({ f_coghzwfvcnx: undefined } as unknown as Servico),
				],
			});

			expect(() => processor.processClientLines(cliente)).toThrow(
				BusinessRuleError,
			);
		});

		it("deve retornar dados corretos da linha processada", () => {
			const processor = LineProcessor.create(defaultPlanos);
			const cliente = createCliente({
				f_linhas_fixas: [createServico({ id: 100, f_coghzwfvcnx: 4 })],
			});

			const { lines } = processor.processClientLines(cliente);

			expect(lines[0]).toEqual({
				id: 100,
				planId: 4,
				unitPrice: 3,
				description: "1 Linha - 1 Canal",
			});
		});
	});

	describe("groupLinesByPlan", () => {
		it("deve agrupar linhas pelo plano", () => {
			const lines = [
				{ id: 1, planId: 4, unitPrice: 3, description: "Plano A" },
				{ id: 2, planId: 4, unitPrice: 3, description: "Plano A" },
				{ id: 3, planId: 5, unitPrice: 5, description: "Plano B" },
			];

			const grouped = LineProcessor.groupLinesByPlan(lines);

			expect(grouped).toHaveLength(2);

			const planoA = grouped.find((g) => g.planId === 4);
			expect(planoA?.quantity).toBe(2);
			expect(planoA?.total).toBe(6);

			const planoB = grouped.find((g) => g.planId === 5);
			expect(planoB?.quantity).toBe(1);
			expect(planoB?.total).toBe(5);
		});

		it("deve retornar array vazio para lista vazia", () => {
			const grouped = LineProcessor.groupLinesByPlan([]);
			expect(grouped).toEqual([]);
		});
	});

	describe("groupServices", () => {
		it("deve agrupar serviços de múltiplos clientes", () => {
			const clients = [
				{
					lines: [
						{ id: 1, planId: 4, unitPrice: 3, description: "Plano A" },
						{ id: 2, planId: 5, unitPrice: 5, description: "Plano B" },
					],
				},
				{
					lines: [{ id: 3, planId: 4, unitPrice: 3, description: "Plano A" }],
				},
			];

			const grouped = LineProcessor.groupServices(clients);

			expect(grouped).toHaveLength(2);

			const planoA = grouped.find((g) => g.planId === 4);
			expect(planoA?.quantity).toBe(2);
			expect(planoA?.total).toBe(6);

			const planoB = grouped.find((g) => g.planId === 5);
			expect(planoB?.quantity).toBe(1);
			expect(planoB?.total).toBe(5);
		});

		it("deve retornar array vazio quando não há clientes", () => {
			const grouped = LineProcessor.groupServices([]);
			expect(grouped).toEqual([]);
		});

		it("deve calcular total como unitPrice * quantity", () => {
			const clients = [
				{
					lines: [
						{ id: 1, planId: 4, unitPrice: 10, description: "X" },
						{ id: 2, planId: 4, unitPrice: 10, description: "X" },
						{ id: 3, planId: 4, unitPrice: 10, description: "X" },
					],
				},
			];

			const grouped = LineProcessor.groupServices(clients);
			expect(grouped[0]?.total).toBe(30);
			expect(grouped[0]?.quantity).toBe(3);
		});
	});
});
