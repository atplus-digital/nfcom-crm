import {
	BusinessRuleError,
	DocumentValidationError,
	EntityValidationError,
	ExternalApiError,
	isAppError,
	NotFoundError,
} from "@/shared/base.error";

import { ERROR_CODES, HTTP_STATUS } from "@/shared/constants";

describe("AppError classes", () => {
	describe("NotFoundError", () => {
		it("deve criar erro com recurso e identificador", () => {
			const error = NotFoundError.create("Parceiro", 123);

			expect(error.type).toBe(ERROR_CODES.NOT_FOUND);
			expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
			expect(error.message).toBe(
				'Parceiro com identificador "123" não encontrado',
			);
			expect(error.context?.resource).toBe("Parceiro");
			expect(error.context?.identifier).toBe(123);
		});

		it("deve criar erro sem identificador", () => {
			const error = NotFoundError.create("Clientes ativos");

			expect(error.message).toBe("Clientes ativos não encontrado");
			expect(error.context?.identifier).toBeUndefined();
		});

		it("deve serializar corretamente via toJSON", () => {
			const error = NotFoundError.create("Parceiro", 1);
			const json = error.toJSON();

			expect(json.type).toBe(ERROR_CODES.NOT_FOUND);
			expect(json.message).toContain("Parceiro");
			expect(json.context).toBeDefined();
		});
	});

	describe("EntityValidationError", () => {
		it("deve criar erro com campos inválidos", () => {
			const fields = [
				{ field: "f_cnpj", label: "CNPJ" },
				{ field: "f_endereco", label: "Endereço" },
			];
			const error = EntityValidationError.create("Parceiro", 10, fields);

			expect(error.type).toBe(ERROR_CODES.ENTITY_VALIDATION_ERROR);
			expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
			expect(error.message).toContain("CNPJ");
			expect(error.message).toContain("Endereço");
			expect(error.fields).toEqual(fields);
		});

		it("deve retornar fields via getter", () => {
			const fields = [{ field: "f_nome", label: "Nome" }];
			const error = EntityValidationError.create("Cliente", 5, fields);

			expect(error.fields).toHaveLength(1);
			expect(error.fields?.[0]?.label).toBe("Nome");
		});
	});

	describe("DocumentValidationError", () => {
		it("deve criar erro de validação de documento", () => {
			const error = DocumentValidationError.create("CNPJ inválido");

			expect(error.type).toBe(ERROR_CODES.DOCUMENT_VALIDATION_ERROR);
			expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
			expect(error.message).toBe("CNPJ inválido");
		});
	});

	describe("ExternalApiError", () => {
		it("deve criar erro com serviço e detalhes", () => {
			const error = ExternalApiError.create("Atacado", "timeout");

			expect(error.type).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
			expect(error.statusCode).toBe(HTTP_STATUS.BAD_GATEWAY);
			expect(error.message).toBe("Erro na API Atacado: timeout");
		});

		it("deve criar erro sem detalhes", () => {
			const error = ExternalApiError.create("Atacado");

			expect(error.message).toBe("Erro ao comunicar com Atacado");
		});
	});

	describe("BusinessRuleError", () => {
		it("deve criar erro de regra de negócio", () => {
			const error = BusinessRuleError.create("Nenhum cliente ativo");

			expect(error.type).toBe(ERROR_CODES.BUSINESS_RULE_ERROR);
			expect(error.statusCode).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
			expect(error.message).toBe("Nenhum cliente ativo");
		});

		it("deve criar erro com contexto", () => {
			const error = BusinessRuleError.create("Erro", {
				resource: "Invoice",
				identifier: 1,
			});

			expect(error.context?.resource).toBe("Invoice");
		});
	});

	describe("isAppError", () => {
		it("deve retornar true para AppError instances", () => {
			expect(isAppError(NotFoundError.create("x"))).toBe(true);
			expect(isAppError(EntityValidationError.create("x", 1, []))).toBe(true);
			expect(isAppError(DocumentValidationError.create("x"))).toBe(true);
			expect(isAppError(ExternalApiError.create("x"))).toBe(true);
			expect(isAppError(BusinessRuleError.create("x"))).toBe(true);
		});

		it("deve retornar false para erros genéricos", () => {
			expect(isAppError(new Error("generic"))).toBe(false);
			expect(isAppError("string")).toBe(false);
			expect(isAppError(null)).toBe(false);
			expect(isAppError(undefined)).toBe(false);
			expect(isAppError({})).toBe(false);
		});
	});

	describe("toJSON", () => {
		it("deve omitir context quando não fornecido", () => {
			const error = DocumentValidationError.create("erro");
			const json = error.toJSON();

			expect(json.context).toBeUndefined();
		});

		it("deve incluir context quando fornecido", () => {
			const error = BusinessRuleError.create("erro", {
				resource: "test",
			});
			const json = error.toJSON();

			expect(json.context).toEqual({ resource: "test" });
		});
	});
});
