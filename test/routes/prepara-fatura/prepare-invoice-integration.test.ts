import fastify, { type FastifyInstance } from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { preparaFaturaRoutes } from "@/routes/prepara-fatura";
import { ERROR_CODES, HTTP_STATUS } from "@/shared/constants";
import { errorHandler } from "@/shared/error-handler";

jest.mock("@/modules/invoice-service/invoice.service", () => {
	const mockCalculate = jest.fn();
	return {
		invoiceService: { calculate: mockCalculate },
		__mockCalculate: mockCalculate,
	};
});

const getMockCalculate = () => {
	const mod = jest.requireMock("@/modules/invoice-service/invoice.service");
	return mod.__mockCalculate as jest.Mock;
};

import {
	BusinessRuleError,
	DocumentValidationError,
	EntityValidationError,
	ExternalApiError,
	NotFoundError,
} from "@/shared/base.error";

const buildTestServer = async (): Promise<FastifyInstance> => {
	const server = fastify({ logger: false });
	server.setValidatorCompiler(validatorCompiler);
	server.setSerializerCompiler(serializerCompiler);
	server.setErrorHandler(errorHandler);
	await server.register(preparaFaturaRoutes);
	await server.ready();
	return server;
};

const validBody = {
	f_parceiro: 1,
	f_data_referencia: "2025-01-15",
	f_tipo_de_faturamento: "parceiro",
};

const validInvoiceResult = {
	dueDate: "2025-02-10",
	invoiceTotal: 30,
	totalLines: 5,
	partner: {
		partner: {
			id: 1,
			f_razao_social: "Empresa Teste",
			f_cnpj: "11222333000181",
		},
		invoiceTotal: 30,
		totalClients: 2,
		totalLines: 5,
	},
	clients: [
		{
			client: { id: 10, f_nome_razao: "Cliente 1" },
			total: 15,
			totalLines: 3,
			lines: [
				{ id: 1, planId: 4, unitPrice: 5, description: "Plano A" },
				{ id: 2, planId: 4, unitPrice: 5, description: "Plano A" },
				{ id: 3, planId: 4, unitPrice: 5, description: "Plano A" },
			],
			groupedLines: [
				{
					id: 1,
					planId: 4,
					unitPrice: 5,
					description: "Plano A",
					quantity: 3,
					total: 15,
				},
			],
		},
		{
			client: { id: 20, f_nome_razao: "Cliente 2" },
			total: 15,
			totalLines: 2,
			lines: [
				{ id: 4, planId: 5, unitPrice: 7.5, description: "Plano B" },
				{ id: 5, planId: 5, unitPrice: 7.5, description: "Plano B" },
			],
			groupedLines: [
				{
					id: 4,
					planId: 5,
					unitPrice: 7.5,
					description: "Plano B",
					quantity: 2,
					total: 15,
				},
			],
		},
	],
	groupedServices: [
		{ planId: 4, description: "Plano A", unitPrice: 5, quantity: 3, total: 15 },
		{
			planId: 5,
			description: "Plano B",
			unitPrice: 7.5,
			quantity: 2,
			total: 15,
		},
	],
};

describe("POST /prepara-fatura - integração rota + controller + error handler", () => {
	let server: FastifyInstance;
	let mockCalculate: jest.Mock;

	beforeAll(async () => {
		server = await buildTestServer();
	});

	beforeEach(() => {
		mockCalculate = getMockCalculate();
		mockCalculate.mockReset();
	});

	afterAll(async () => {
		await server.close();
	});

	describe("cenários de sucesso", () => {
		it("deve retornar 200 com invoice completa", async () => {
			mockCalculate.mockResolvedValue(validInvoiceResult);

			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: validBody,
			});

			expect(response.statusCode).toBe(HTTP_STATUS.OK);

			const body = response.json();
			expect(body.success).toBe(true);
			expect(body.data.invoiceTotal).toBe(30);
			expect(body.data.clients).toHaveLength(2);
			expect(body.data.groupedServices).toHaveLength(2);
		});

		it("deve chamar calculate com parâmetros corretos", async () => {
			mockCalculate.mockResolvedValue(validInvoiceResult);

			await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: validBody,
			});

			expect(mockCalculate).toHaveBeenCalledWith(
				expect.objectContaining({
					partnerId: 1,
					referenceDate: expect.any(String),
					billingType: "parceiro",
				}),
			);
		});

		it("deve aceitar todos os tipos de faturamento válidos", async () => {
			mockCalculate.mockResolvedValue(validInvoiceResult);

			const tipos = [
				"parceiro",
				"via-parceiro",
				"cofaturamento",
				"cliente-final",
			];

			for (const tipo of tipos) {
				const response = await server.inject({
					method: "POST",
					url: "/prepara-fatura",
					payload: { ...validBody, f_tipo_de_faturamento: tipo },
				});
				expect(response.statusCode).toBe(HTTP_STATUS.OK);
			}
		});
	});

	describe("validação de body (Zod)", () => {
		it("deve retornar 400 para body vazio", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: {},
			});

			expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
		});

		it("deve retornar 400 para f_parceiro negativo", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: { ...validBody, f_parceiro: -1 },
			});

			expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
		});

		it("deve retornar 400 para f_parceiro zero", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: { ...validBody, f_parceiro: 0 },
			});

			expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
		});

		it("deve retornar 400 para f_parceiro como string não numérica", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: { ...validBody, f_parceiro: "abc" },
			});

			expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
		});

		it("deve retornar 400 para data de referência inválida", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: { ...validBody, f_data_referencia: "invalid-date" },
			});

			expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
		});

		it("deve retornar 400 para tipo de faturamento inválido", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: { ...validBody, f_tipo_de_faturamento: "invalido" },
			});

			expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
		});

		it("deve retornar 400 quando f_parceiro está ausente", async () => {
			const { f_parceiro: _, ...bodyWithout } = validBody;

			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: bodyWithout,
			});

			expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
		});

		it("deve retornar 400 quando f_data_referencia está ausente", async () => {
			const { f_data_referencia: _, ...bodyWithout } = validBody;

			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: bodyWithout,
			});

			expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
		});

		it("deve retornar 400 quando f_tipo_de_faturamento está ausente", async () => {
			const { f_tipo_de_faturamento: _, ...bodyWithout } = validBody;

			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: bodyWithout,
			});

			expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
		});

		it("deve aceitar f_parceiro como float positivo (Zod z.number().positive() aceita)", async () => {
			mockCalculate.mockResolvedValue(validInvoiceResult);

			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: { ...validBody, f_parceiro: 1.5 },
			});

			expect(response.statusCode).toBe(HTTP_STATUS.OK);
		});
	});

	describe("propagação de erros de negócio", () => {
		it("deve retornar 404 quando parceiro não é encontrado", async () => {
			mockCalculate.mockRejectedValue(NotFoundError.create("Parceiro", 999));

			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: validBody,
			});

			expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);

			const body = response.json();
			expect(body.success).toBe(false);
			expect(body.error.code).toBe(ERROR_CODES.NOT_FOUND);
		});

		it("deve retornar 400 para EntityValidationError", async () => {
			mockCalculate.mockRejectedValue(
				EntityValidationError.create("Parceiro", 1, [
					{ field: "f_cnpj", label: "CNPJ" },
				]),
			);

			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: validBody,
			});

			expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);

			const body = response.json();
			expect(body.success).toBe(false);
			expect(body.error.code).toBe(ERROR_CODES.ENTITY_VALIDATION_ERROR);
		});

		it("deve retornar 400 para DocumentValidationError", async () => {
			mockCalculate.mockRejectedValue(
				DocumentValidationError.create("CNPJ do parceiro é inválido"),
			);

			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: validBody,
			});

			expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);

			const body = response.json();
			expect(body.success).toBe(false);
			expect(body.error.code).toBe(ERROR_CODES.DOCUMENT_VALIDATION_ERROR);
		});

		it("deve retornar 422 para BusinessRuleError", async () => {
			mockCalculate.mockRejectedValue(
				BusinessRuleError.create("Nenhum cliente com linhas ativas"),
			);

			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: validBody,
			});

			expect(response.statusCode).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);

			const body = response.json();
			expect(body.success).toBe(false);
			expect(body.error.code).toBe(ERROR_CODES.BUSINESS_RULE_ERROR);
		});

		it("deve retornar 502 para ExternalApiError", async () => {
			mockCalculate.mockRejectedValue(
				ExternalApiError.create("Atacado", "Connection timeout"),
			);

			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: validBody,
			});

			expect(response.statusCode).toBe(HTTP_STATUS.BAD_GATEWAY);

			const body = response.json();
			expect(body.success).toBe(false);
			expect(body.error.code).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
		});

		it("deve retornar 500 para erro genérico inesperado", async () => {
			mockCalculate.mockRejectedValue(new Error("Crash inesperado"));

			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: validBody,
			});

			expect(response.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);

			const body = response.json();
			expect(body.success).toBe(false);
		});
	});

	describe("formato de resposta de erro", () => {
		it("deve retornar formato padronizado para todos os erros de negócio", async () => {
			mockCalculate.mockRejectedValue(
				NotFoundError.create("Clientes ativos", 1),
			);

			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: validBody,
			});

			const body = response.json();
			expect(body).toHaveProperty("success", false);
			expect(body).toHaveProperty("error");
			expect(body.error).toHaveProperty("code");
			expect(body.error).toHaveProperty("message");
		});
	});
});
