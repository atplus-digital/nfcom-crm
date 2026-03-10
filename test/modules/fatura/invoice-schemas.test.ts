import {
	GroupedLineSchema,
	GroupedServiceSchema,
	ProcessedLineSchema,
	TipoFaturamentoEnum,
} from "@/modules/invoice-service/invoice.schemas";

describe("fatura.schemas", () => {
	describe("TipoFaturamentoEnum", () => {
		it("deve aceitar valores válidos", () => {
			expect(TipoFaturamentoEnum.safeParse("parceiro").success).toBe(true);
			expect(TipoFaturamentoEnum.safeParse("via-parceiro").success).toBe(true);
			expect(TipoFaturamentoEnum.safeParse("cofaturamento").success).toBe(true);
			expect(TipoFaturamentoEnum.safeParse("cliente-final").success).toBe(true);
		});

		it("deve rejeitar valores inválidos", () => {
			expect(TipoFaturamentoEnum.safeParse("invalido").success).toBe(false);
			expect(TipoFaturamentoEnum.safeParse("").success).toBe(false);
			expect(TipoFaturamentoEnum.safeParse(123).success).toBe(false);
		});
	});

	describe("ProcessedLineSchema", () => {
		it("deve validar linha processada válida", () => {
			const line = {
				id: 1,
				planId: 4,
				unitPrice: 3,
				description: "Plano A",
			};

			expect(ProcessedLineSchema.safeParse(line).success).toBe(true);
		});

		it("deve aceitar id como string", () => {
			const line = {
				id: "abc",
				planId: "xyz",
				unitPrice: 3,
				description: "Plano A",
			};

			expect(ProcessedLineSchema.safeParse(line).success).toBe(true);
		});

		it("deve rejeitar quando falta campo obrigatório", () => {
			const line = { id: 1, planId: 4 };

			expect(ProcessedLineSchema.safeParse(line).success).toBe(false);
		});
	});

	describe("GroupedLineSchema", () => {
		it("deve validar linha agrupada válida", () => {
			const line = {
				id: 1,
				planId: 4,
				unitPrice: 3,
				description: "Plano A",
				quantity: 2,
				total: 6,
			};

			expect(GroupedLineSchema.safeParse(line).success).toBe(true);
		});

		it("deve rejeitar sem quantity", () => {
			const line = {
				id: 1,
				planId: 4,
				unitPrice: 3,
				description: "Plano A",
				total: 6,
			};

			expect(GroupedLineSchema.safeParse(line).success).toBe(false);
		});
	});

	describe("GroupedServiceSchema", () => {
		it("deve validar serviço agrupado válido", () => {
			const service = {
				planId: 4,
				description: "Plano A",
				unitPrice: 3,
				quantity: 5,
				total: 15,
			};

			expect(GroupedServiceSchema.safeParse(service).success).toBe(true);
		});
	});
});
