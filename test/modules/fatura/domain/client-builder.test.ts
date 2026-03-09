import type { Cliente } from "@/@types/atacado/Cliente";
import { createClientDetail } from "@/modules/fatura/domain/client-builder";
import type { ProcessedLine } from "@/modules/fatura/invoice.schemas";

const mockCliente: Cliente = {
	id: 1,
	f_nome_razao: "Cliente Teste",
	f_cpf_cnpj: "52998224725",
};

const mockLines: ProcessedLine[] = [
	{ id: 100, planId: 4, unitPrice: 3, description: "Plano A" },
	{ id: 101, planId: 4, unitPrice: 3, description: "Plano A" },
	{ id: 102, planId: 5, unitPrice: 5, description: "Plano B" },
];

describe("createClientDetail", () => {
	it("deve criar detalhe do cliente com dados corretos", () => {
		const result = createClientDetail(mockCliente, mockLines, 11);

		expect(result.client).toBe(mockCliente);
		expect(result.total).toBe(11);
		expect(result.totalLines).toBe(3);
		expect(result.lines).toBe(mockLines);
	});

	it("deve agrupar linhas por plano", () => {
		const result = createClientDetail(mockCliente, mockLines, 11);

		expect(result.groupedLines).toHaveLength(2);

		const planoA = result.groupedLines.find((g) => g.planId === 4);
		expect(planoA?.quantity).toBe(2);
		expect(planoA?.total).toBe(6);

		const planoB = result.groupedLines.find((g) => g.planId === 5);
		expect(planoB?.quantity).toBe(1);
		expect(planoB?.total).toBe(5);
	});

	it("deve funcionar com uma única linha", () => {
		const lines: ProcessedLine[] = [
			{ id: 100, planId: 4, unitPrice: 3, description: "Plano A" },
		];

		const result = createClientDetail(mockCliente, lines, 3);

		expect(result.totalLines).toBe(1);
		expect(result.groupedLines).toHaveLength(1);
		expect(result.groupedLines[0]?.quantity).toBe(1);
	});

	it("deve funcionar com lista vazia de linhas", () => {
		const result = createClientDetail(mockCliente, [], 0);

		expect(result.totalLines).toBe(0);
		expect(result.lines).toEqual([]);
		expect(result.groupedLines).toEqual([]);
	});
});
