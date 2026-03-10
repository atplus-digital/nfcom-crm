import {
	calculateDueDate,
	formatToISODate,
} from "@/modules/invoice-service/invoice-calculator/domain/date-calculator";

describe("date-calculator", () => {
	describe("formatToISODate", () => {
		it("deve formatar data no formato yyyy-MM-dd", () => {
			const date = new Date(2025, 5, 15);
			expect(formatToISODate(date)).toBe("2025-06-15");
		});

		it("deve adicionar zero à esquerda para dias e meses", () => {
			const date = new Date(2025, 0, 5);
			expect(formatToISODate(date)).toBe("2025-01-05");
		});
	});

	describe("calculateDueDate", () => {
		beforeEach(() => {
			jest.useFakeTimers();
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it("deve calcular vencimento para o próximo mês", () => {
			jest.setSystemTime(new Date(2025, 0, 1));

			const result = calculateDueDate("2025-01-01", 10);
			expect(result).toBe("2025-02-10");
		});

		it("deve usar data mínima quando vencimento é muito próximo", () => {
			jest.setSystemTime(new Date(2025, 1, 7));

			const result = calculateDueDate("2025-01-01", 10);

			const minimumDate = new Date(2025, 1, 13);
			expect(result).toBe(formatToISODate(minimumDate));
		});

		it("deve calcular corretamente para dezembro -> janeiro", () => {
			jest.setSystemTime(new Date(2025, 0, 1));

			const result = calculateDueDate("2025-12-01", 15);
			expect(result).toBe("2026-01-15");
		});

		it("deve respeitar o due day configurado", () => {
			jest.setSystemTime(new Date(2025, 0, 1));

			const result = calculateDueDate("2025-03-01", 20);
			expect(result).toBe("2025-04-20");
		});

		it("deve funcionar com due day no dia 1", () => {
			jest.setSystemTime(new Date(2025, 0, 1));

			const result = calculateDueDate("2025-05-01", 1);
			expect(result).toBe("2025-06-01");
		});
	});
});
