import { LINES, PLANS } from "@/modules/invoice-service/invoice-calculator/domain/constants";

describe("domain constants", () => {
	it("deve ter STATUS_ACTIVE como '1'", () => {
		expect(LINES.STATUS_ACTIVE).toBe("1");
	});

	it("deve ter PLAN_ID_FIELD correto", () => {
		expect(LINES.PLAN_ID_FIELD).toBe("f_coghzwfvcnx");
	});

	it("deve ter DEFAULT_PLAN_NAME correto", () => {
		expect(PLANS.DEFAULT_PLAN_NAME).toBe("Cadastrar Plano no Fluxo");
	});
});
