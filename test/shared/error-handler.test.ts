import {
	BusinessRuleError,
	ExternalApiError,
	NotFoundError,
} from "@/shared/base.error";
import { ERROR_CODES, HTTP_STATUS } from "@/shared/constants";
import { errorHandler } from "@/shared/error-handler";
import {
	createMockReply,
	createMockRequest,
} from "../fixtures/error-handler-fixtures";

describe("errorHandler", () => {
	const originalEnv = process.env.NODE_ENV;

	afterEach(() => {
		process.env.NODE_ENV = originalEnv;
	});

	it("deve tratar NotFoundError corretamente", () => {
		const error = NotFoundError.create("Parceiro", 1);
		const request = createMockRequest();
		const reply = createMockReply();

		errorHandler(error, request, reply);

		expect(reply.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
		expect(reply.send).toHaveBeenCalledWith(
			expect.objectContaining({
				success: false,
				error: expect.objectContaining({
					code: ERROR_CODES.NOT_FOUND,
				}),
			}),
		);
	});

	it("deve tratar BusinessRuleError corretamente", () => {
		const error = BusinessRuleError.create("Regra de negócio violada");
		const request = createMockRequest();
		const reply = createMockReply();

		errorHandler(error, request, reply);

		expect(reply.status).toHaveBeenCalledWith(HTTP_STATUS.UNPROCESSABLE_ENTITY);
		expect(reply.send).toHaveBeenCalledWith(
			expect.objectContaining({
				success: false,
				error: expect.objectContaining({
					code: ERROR_CODES.BUSINESS_RULE_ERROR,
				}),
			}),
		);
	});

	it("deve tratar ExternalApiError corretamente", () => {
		const error = ExternalApiError.create("Atacado", "timeout");
		const request = createMockRequest();
		const reply = createMockReply();

		errorHandler(error, request, reply);

		expect(reply.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_GATEWAY);
	});

	it("deve tratar erro genérico com status 500", () => {
		const error = new Error("Erro inesperado");
		const request = createMockRequest();
		const reply = createMockReply();

		errorHandler(error, request, reply);

		expect(reply.status).toHaveBeenCalledWith(
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
		);
	});

	it("deve usar código FASTIFY_ERROR para erros não-AppError", () => {
		process.env.NODE_ENV = "development";
		const error = new Error("Erro genérico");
		const request = createMockRequest();
		const reply = createMockReply();

		errorHandler(error, request, reply);

		expect(reply.send).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.objectContaining({
					code: ERROR_CODES.FASTIFY_ERROR,
				}),
			}),
		);
	});

	it("deve logar erro com detalhes da request", () => {
		const error = NotFoundError.create("Parceiro", 1);
		const request = createMockRequest({
			method: "GET",
			url: "/parceiros/1",
		});
		const reply = createMockReply();

		errorHandler(error, request, reply);

		expect(request.log.error).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.objectContaining({
					message: error.message,
				}),
				request: expect.objectContaining({
					method: "GET",
					url: "/parceiros/1",
				}),
			}),
		);
	});

	it("deve usar statusCode do FastifyError quando disponível", () => {
		const error = Object.assign(new Error("Validation"), {
			statusCode: 400,
			code: "FST_ERR_VALIDATION",
		});
		const request = createMockRequest();
		const reply = createMockReply();

		errorHandler(error, request, reply);

		expect(reply.status).toHaveBeenCalledWith(400);
	});

	it("deve mascarar mensagem em produção para erros 500", () => {
		process.env.NODE_ENV = "production";
		const error = new Error("Detalhes sensíveis do banco");
		const request = createMockRequest();
		const reply = createMockReply();

		errorHandler(error, request, reply);

		expect(reply.send).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.objectContaining({
					message: "Erro interno do servidor",
				}),
			}),
		);
	});

	it("deve não incluir details em produção", () => {
		process.env.NODE_ENV = "production";
		const error = NotFoundError.create("Parceiro", 1);
		const request = createMockRequest();
		const reply = createMockReply();

		errorHandler(error, request, reply);

		const sentData = (reply.send as jest.Mock).mock.calls[0]?.[0];
		expect(sentData.error.details).toBeUndefined();
	});

	it("deve retornar 500 quando erro tem statusCode mas não é número", () => {
		const error = Object.assign(new Error("Error with invalid statusCode"), {
			statusCode: "400",
		});
		const request = createMockRequest();
		const reply = createMockReply();

		errorHandler(error, request, reply);

		expect(reply.status).toHaveBeenCalledWith(
			HTTP_STATUS.INTERNAL_SERVER_ERROR,
		);
	});

	it("deve retornar o status code se for um AppError e o status não é número ", () => {
		const error = Object.assign(
			new NotFoundError("Error with invalid statusCode"),
			{
				statusCode: "400",
			},
		);
		const request = createMockRequest();
		const reply = createMockReply();

		errorHandler(error, request, reply);

		expect(reply.status).toHaveBeenCalledWith("400");
	});
});
