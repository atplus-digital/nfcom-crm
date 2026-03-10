import { BILLING_TYPE_CONFIG, DATES } from "@/modules/invoice-service/invoice.constants";

describe("fatura.constants", () => {
	describe("DATES", () => {
		it("deve ter MIN_DAYS_TO_DUE_DATE como 6", () => {
			expect(DATES.MIN_DAYS_TO_DUE_DATE).toBe(6);
		});

		it("deve ter DEFAULT_DUE_DAY como 10", () => {
			expect(DATES.DEFAULT_DUE_DAY).toBe(10);
		});
	});

	describe("BILLING_TYPE_CONFIG", () => {
		it("parceiro não permite faturamento direto ao cliente", () => {
			expect(BILLING_TYPE_CONFIG.parceiro.allowsDirectClientBilling).toBe(
				false,
			);
		});

		it("via-parceiro não permite faturamento direto ao cliente", () => {
			expect(
				BILLING_TYPE_CONFIG["via-parceiro"].allowsDirectClientBilling,
			).toBe(false);
		});

		it("cofaturamento permite faturamento direto ao cliente", () => {
			expect(BILLING_TYPE_CONFIG.cofaturamento.allowsDirectClientBilling).toBe(
				true,
			);
		});

		it("cliente-final permite faturamento direto ao cliente", () => {
			expect(
				BILLING_TYPE_CONFIG["cliente-final"].allowsDirectClientBilling,
			).toBe(true);
		});
	});
});
