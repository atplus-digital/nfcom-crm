import { preparaFaturaSchema } from "@/routes/prepara-fatura/prepare-invoice.schemas";

describe("prepara-fatura.schemas", () => {
	describe("preparaFaturaSchema", () => {
		it("deve validar body válido", () => {
			const body = {
				f_parceiro: 1,
				f_data_referencia: "2025-01-01",
				f_tipo_de_faturamento: "parceiro",
			};

			const result = preparaFaturaSchema.safeParse(body);
			expect(result.success).toBe(true);
		});

		it("deve rejeitar f_parceiro negativo", () => {
			const body = {
				f_parceiro: -1,
				f_data_referencia: "2025-01-01",
				f_tipo_de_faturamento: "parceiro",
			};

			const result = preparaFaturaSchema.safeParse(body);
			expect(result.success).toBe(false);
		});

		it("deve rejeitar f_parceiro zero", () => {
			const body = {
				f_parceiro: 0,
				f_data_referencia: "2025-01-01",
				f_tipo_de_faturamento: "parceiro",
			};

			const result = preparaFaturaSchema.safeParse(body);
			expect(result.success).toBe(false);
		});

		it("deve rejeitar f_parceiro string", () => {
			const body = {
				f_parceiro: "abc",
				f_data_referencia: "2025-01-01",
				f_tipo_de_faturamento: "parceiro",
			};

			const result = preparaFaturaSchema.safeParse(body);
			expect(result.success).toBe(false);
		});

		it("deve rejeitar f_parceiro indefinido", () => {
			const body = {
				f_parceiro: undefined,
				f_data_referencia: "2025-01-01",
				f_tipo_de_faturamento: "parceiro",
			};

			const result = preparaFaturaSchema.safeParse(body);
			expect(result.success).toBe(false);
		});

		it("deve rejeitar data indefinida", () => {
			const body = {
				f_parceiro: 1,
				f_data_referencia: undefined,
				f_tipo_de_faturamento: "parceiro",
			};

			const result = preparaFaturaSchema.safeParse(body);
			expect(result.success).toBe(false);
		});

		it("deve rejeitar data inválida", () => {
			const body = {
				f_parceiro: 1,
				f_data_referencia: "not-a-date",
				f_tipo_de_faturamento: "parceiro",
			};

			const result = preparaFaturaSchema.safeParse(body);
			expect(result.success).toBe(false);
		});

		it("deve rejeitar tipo de faturamento inválido", () => {
			const body = {
				f_parceiro: 1,
				f_data_referencia: "2025-01-01",
				f_tipo_de_faturamento: "invalido",
			};

			const result = preparaFaturaSchema.safeParse(body);
			expect(result.success).toBe(false);
		});

		it("deve rejeitar tipo de faturamento indefinido", () => {
			const body = {
				f_parceiro: 1,
				f_data_referencia: "2025-01-01",
				f_tipo_de_faturamento: undefined,
			};

			const result = preparaFaturaSchema.safeParse(body);
			expect(result.success).toBe(false);
		});

		it("deve aceitar todos os tipos de faturamento válidos", () => {
			const tipos = [
				"parceiro",
				"via-parceiro",
				"cofaturamento",
				"cliente-final",
			];

			for (const tipo of tipos) {
				const body = {
					f_parceiro: 1,
					f_data_referencia: "2025-01-01",
					f_tipo_de_faturamento: tipo,
				};

				const result = preparaFaturaSchema.safeParse(body);
				expect(result.success).toBe(true);
			}
		});

		it("deve coercer string de data para Date", () => {
			const body = {
				f_parceiro: 1,
				f_data_referencia: "2025-06-15",
				f_tipo_de_faturamento: "parceiro",
			};

			const result = preparaFaturaSchema.safeParse(body);

			if (result.success) {
				expect(result.data.f_data_referencia).toBeInstanceOf(Date);
			}
		});

		it("deve rejeitar body vazio", () => {
			const result = preparaFaturaSchema.safeParse({});
			expect(result.success).toBe(false);
		});
	});
});
