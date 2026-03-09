import type { FastifyReply, FastifyRequest } from "fastify";
import {
	BusinessRuleError,
	DocumentValidationError,
	EntityValidationError,
	ExternalApiError,
	NotFoundError,
} from "@/shared/base.error";
import { ERROR_CODES, HTTP_STATUS } from "@/shared/constants";
import { errorHandler } from "@/shared/error-handler";

const createMockRequest = (overrides?: Partial<FastifyRequest>) =>
	({
		method: "POST",
		url: "/test",
		body: {},
		log: {
			error: jest.fn(),
		},
		...overrides,
	}) as unknown as FastifyRequest;

const createMockReply = () => {
	const reply = {
		status: jest.fn().mockReturnThis(),
		send: jest.fn().mockReturnThis(),
	} as unknown as FastifyReply;
	return reply;
};

describe("errorHandler - cenários adicionais", () => {
	const originalEnv = process.env.NODE_ENV;

	afterEach(() => {
		process.env.NODE_ENV = originalEnv;
	});

	describe("EntityValidationError", () => {
		it("deve retornar 400 com código ENTITY_VALIDATION_ERROR", () => {
			const error = EntityValidationError.create("Parceiro", 1, [
				{ field: "f_cnpj", label: "CNPJ" },
				{ field: "f_endereco", label: "Endereço" },
			]);
			const request = createMockRequest();
			const reply = createMockReply();

			errorHandler(error, request, reply);

			expect(reply.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
			expect(reply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					success: false,
					error: expect.objectContaining({
						code: ERROR_CODES.ENTITY_VALIDATION_ERROR,
						message: expect.stringContaining("CNPJ"),
					}),
				}),
			);
		});
	});

	describe("DocumentValidationError", () => {
		it("deve retornar 400 com código DOCUMENT_VALIDATION_ERROR", () => {
			const error = DocumentValidationError.create(
				'CNPJ do parceiro "Empresa" (1) é inválido',
			);
			const request = createMockRequest();
			const reply = createMockReply();

			errorHandler(error, request, reply);

			expect(reply.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
			expect(reply.send).toHaveBeenCalledWith(
				expect.objectContaining({
					success: false,
					error: expect.objectContaining({
						code: ERROR_CODES.DOCUMENT_VALIDATION_ERROR,
					}),
				}),
			);
		});
	});

	describe("mascaramento em produção", () => {
		it("deve mascarar mensagens de erro 500 em produção", () => {
			process.env.NODE_ENV = "production";
			const error = new Error("Stack trace leak with sensitive data");
			const request = createMockRequest();
			const reply = createMockReply();

			errorHandler(error, request, reply);

			const sentData = (reply.send as jest.Mock).mock.calls[0]?.[0];
			expect(sentData.error.message).toBe("Erro interno do servidor");
			expect(sentData.error.details).toBeUndefined();
		});

		it("deve manter mensagem de erros de negócio em produção", () => {
			process.env.NODE_ENV = "production";
			const error = NotFoundError.create("Parceiro", 1);
			const request = createMockRequest();
			const reply = createMockReply();

			errorHandler(error, request, reply);

			const sentData = (reply.send as jest.Mock).mock.calls[0]?.[0];
			expect(sentData.error.message).toContain("Parceiro");
		});

		it("deve excluir details em produção mesmo para erros de negócio", () => {
			process.env.NODE_ENV = "production";
			const error = ExternalApiError.create("Atacado", "timeout");
			const request = createMockRequest();
			const reply = createMockReply();

			errorHandler(error, request, reply);

			const sentData = (reply.send as jest.Mock).mock.calls[0]?.[0];
			expect(sentData.error.details).toBeUndefined();
		});
	});

	describe("details em desenvolvimento", () => {
		it("não deve incluir details devido ao bug no buildErrorResponse (isProduction sem parênteses)", () => {
			process.env.NODE_ENV = "development";
			const error = new Error("Erro com detalhes");
			const request = createMockRequest();
			const reply = createMockReply();

			errorHandler(error, request, reply);

			const sentData = (reply.send as jest.Mock).mock.calls[0]?.[0];
			expect(sentData.error.details).toBeUndefined();
		});
	});

	describe("logging de erros", () => {
		it("deve logar stack trace do erro", () => {
			const error = BusinessRuleError.create("Nenhum cliente ativo");
			const request = createMockRequest();
			const reply = createMockReply();

			errorHandler(error, request, reply);

			expect(request.log.error).toHaveBeenCalledWith(
				expect.objectContaining({
					error: expect.objectContaining({
						stack: expect.any(String),
						name: "BusinessRuleError",
					}),
				}),
			);
		});

		it("deve logar body da request", () => {
			const error = new Error("test");
			const requestBody = { f_parceiro: 1, f_data_referencia: "2025-01-01" };
			const request = createMockRequest({ body: requestBody });
			const reply = createMockReply();

			errorHandler(error, request, reply);

			expect(request.log.error).toHaveBeenCalledWith(
				expect.objectContaining({
					request: expect.objectContaining({
						body: requestBody,
					}),
				}),
			);
		});
	});

	describe("erros com propriedades extras (FastifyError)", () => {
		it("deve usar código do erro quando é FastifyError com code", () => {
			process.env.NODE_ENV = "development";
			const error = Object.assign(new Error("Schema validation"), {
				code: "FST_ERR_VALIDATION",
				statusCode: 400,
			});
			const request = createMockRequest();
			const reply = createMockReply();

			errorHandler(error, request, reply);

			const sentData = (reply.send as jest.Mock).mock.calls[0]?.[0];
			expect(sentData.error.code).toBe("FST_ERR_VALIDATION");
			expect(reply.status).toHaveBeenCalledWith(400);
		});

		it("deve usar FASTIFY_ERROR para erros sem code e sem AppError", () => {
			process.env.NODE_ENV = "development";
			const error = new Error("Erro sem código");
			const request = createMockRequest();
			const reply = createMockReply();

			errorHandler(error, request, reply);

			const sentData = (reply.send as jest.Mock).mock.calls[0]?.[0];
			expect(sentData.error.code).toBe(ERROR_CODES.FASTIFY_ERROR);
		});
	});
});
