import {
    calculateDueDate,
    formatToISODate,
} from "@/modules/invoice-service/domain/date-calculator";

describe("date-calculator - edge cases", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("calculateDueDate - limites de meses", () => {
		it("deve lidar com due day 31 em mês com 30 dias (abril)", () => {
			jest.setSystemTime(new Date(2025, 0, 1));

			const result = calculateDueDate("2025-03-01", 31);

			expect(result).toBeDefined();
			expect(typeof result).toBe("string");
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});

		it("deve lidar com due day 31 em fevereiro", () => {
			jest.setSystemTime(new Date(2025, 0, 1));

			const result = calculateDueDate("2025-01-01", 31);

			expect(result).toBeDefined();
			expect(result).toMatch(/^2025-/);
		});

		it("deve lidar com due day 29 em fevereiro de ano não bissexto", () => {
			jest.setSystemTime(new Date(2025, 0, 1));

			const result = calculateDueDate("2025-01-01", 29);

			expect(result).toBeDefined();
			expect(result).toMatch(/^2025-/);
		});

		it("deve lidar com due day 29 em fevereiro de ano bissexto", () => {
			jest.setSystemTime(new Date(2024, 0, 1));

			const result = calculateDueDate("2024-01-01", 29);

			expect(result).toBe("2024-02-29");
		});
	});

	describe("calculateDueDate - transições de ano", () => {
		it("deve calcular corretamente novembro → dezembro", () => {
			jest.setSystemTime(new Date(2025, 0, 1));

			const result = calculateDueDate("2025-11-01", 15);
			expect(result).toBe("2025-12-15");
		});

		it("deve calcular corretamente dezembro → janeiro do próximo ano", () => {
			jest.setSystemTime(new Date(2025, 0, 1));

			const result = calculateDueDate("2025-12-01", 10);
			expect(result).toBe("2026-01-10");
		});
	});

	describe("calculateDueDate - data mínima (6 dias)", () => {
		it("deve usar data mínima quando vencimento calculado está no passado", () => {
			jest.setSystemTime(new Date(2025, 2, 15));

			const result = calculateDueDate("2025-01-01", 10);

			const minimumDate = new Date(2025, 2, 21);
			expect(result).toBe(formatToISODate(minimumDate));
		});

		it("deve usar vencimento calculado quando está longe no futuro", () => {
			jest.setSystemTime(new Date(2025, 0, 1));

			const result = calculateDueDate("2025-06-01", 25);
			expect(result).toBe("2025-07-25");
		});

		it("deve usar data mínima quando vencimento é exatamente hoje + 5 dias", () => {
			jest.setSystemTime(new Date(2025, 1, 5));

			const result = calculateDueDate("2025-01-01", 10);

			const minimumDate = new Date(2025, 1, 11);
			expect(result).toBe(formatToISODate(minimumDate));
		});
	});

	describe("calculateDueDate - dia 1", () => {
		it("deve funcionar com due day 1 para cada mês", () => {
			jest.setSystemTime(new Date(2025, 0, 1));

			const months = ["2025-01-01", "2025-04-01", "2025-07-01", "2025-10-01"];

			for (const refDate of months) {
				const result = calculateDueDate(refDate, 1);
				expect(result).toMatch(/^\d{4}-\d{2}-01$/);
			}
		});
	});

	describe("formatToISODate - edge cases", () => {
		it("deve formatar primeiro dia do ano", () => {
			expect(formatToISODate(new Date(2025, 0, 1))).toBe("2025-01-01");
		});

		it("deve formatar último dia do ano", () => {
			expect(formatToISODate(new Date(2025, 11, 31))).toBe("2025-12-31");
		});

		it("deve formatar 29 de fevereiro em ano bissexto", () => {
			expect(formatToISODate(new Date(2024, 1, 29))).toBe("2024-02-29");
		});
	});
});
