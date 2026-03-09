import { Failure, type Result, Success } from "@/shared/result";

describe("Result", () => {
	describe("Success", () => {
		it("deve criar um resultado de sucesso com dados", () => {
			const result = Success("valor");

			expect(result.success).toBe(true);
			expect(result.data).toBe("valor");
		});

		it("deve criar sucesso com objeto complexo", () => {
			const data = { id: 1, nome: "teste" };
			const result = Success(data);

			expect(result.success).toBe(true);
			expect(result.data).toEqual(data);
		});

		it("deve criar sucesso com undefined", () => {
			const result = Success(undefined);

			expect(result.success).toBe(true);
			expect(result.data).toBeUndefined();
		});
	});

	describe("Failure", () => {
		it("deve criar um resultado de falha com erro", () => {
			const error = new Error("falhou");
			const result = Failure(error);

			expect(result.success).toBe(false);
			expect(result.error).toBe(error);
		});

		it("deve criar falha com erro customizado", () => {
			const error = { code: "ERR", message: "erro" };
			const result = Failure(error);

			expect(result.success).toBe(false);
			expect(result.error).toEqual(error);
		});

		it("deve criar falha com string", () => {
			const result = Failure("mensagem de erro");

			expect(result.success).toBe(false);
			expect(result.error).toBe("mensagem de erro");
		});
	});

	describe("type narrowing", () => {
		it("deve permitir narrowing via success check", () => {
			const result: Result<string, string> = Success("ok");

			if (result.success) {
				expect(result.data).toBe("ok");
			} else {
				fail("Deveria ser sucesso");
			}
		});

		it("deve permitir narrowing para falha", () => {
			const result: Result<string, string> = Failure("erro");

			if (!result.success) {
				expect(result.error).toBe("erro");
			} else {
				fail("Deveria ser falha");
			}
		});
	});
});
