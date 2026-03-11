import fastify, { type FastifyInstance } from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { preparaFaturaRoutes } from "@/routes/prepara-fatura";
import { ERROR_CODES, HTTP_STATUS } from "@/shared/constants";
import { errorHandler } from "@/shared/error-handler";

jest.mock("@/modules/invoice-service/invoice.service", () => {
	const mockCalculateAndPersist = jest.fn();
	return {
		invoiceService: { calculateAndPersist: mockCalculateAndPersist },
		__mockCalculateAndPersist: mockCalculateAndPersist,
	};
});

const getMockCalculateAndPersist = () => {
	const mod = jest.requireMock("@/modules/invoice-service/invoice.service");
	return mod.__mockCalculateAndPersist as jest.Mock;
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
	dateStr: "2025-01-15",
	billingType: "parceiro",
	resumo: {
		totalClientes: 2,
		totalLinhas: 5,
		valorTotal: 30,
	},
	data: {
		fatura: {
			id: 91,
			f_status: "criada",
			f_data_referencia: "2025-01-15",
			f_data_vencimento: "2025-02-10",
			f_valor_total: "30.00",
			f_tipo_de_faturamento: "parceiro",
		},
		cobrancas: [
			{
				id: 11,
				f_valor_total: "30.00",
				f_nome_devedor: "Empresa Teste",
				f_status: "a-emitir",
			},
		],
		notasFiscais: [
			{
				id: 21,
				f_nome: "Empresa Teste",
				f_cpfcnpj: "11222333000181",
				f_status_interno: "a-emitir",
				f_fk_cobranca: 11,
			},
		],
	},
};

describe("POST /prepara-fatura - integração rota + controller + error handler", () => {
	let server: FastifyInstance;
	let mockCalculateAndPersist: jest.Mock;

	beforeAll(async () => {
		server = await buildTestServer();
	});

	beforeEach(() => {
		mockCalculateAndPersist = getMockCalculateAndPersist();
		mockCalculateAndPersist.mockReset();
	});

	afterAll(async () => {
		await server.close();
	});

	describe("cenários de sucesso", () => {
		it("deve retornar 201 com fluxo persistido", async () => {
			mockCalculateAndPersist.mockResolvedValue(validInvoiceResult);

			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: validBody,
			});

			expect(response.statusCode).toBe(HTTP_STATUS.CREATED);

			const body = response.json();
			expect(body.success).toBe(true);
			expect(body.resumo.valorTotal).toBe(30);
			expect(body.data.cobrancas).toHaveLength(1);
			expect(body.data.notasFiscais).toHaveLength(1);
		});

		it("deve chamar calculateAndPersist com parâmetros corretos", async () => {
			mockCalculateAndPersist.mockResolvedValue(validInvoiceResult);

			await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: validBody,
			});

			expect(mockCalculateAndPersist).toHaveBeenCalledWith(
				expect.objectContaining({
					partnerId: 1,
					referenceDate: expect.any(String),
					billingType: "parceiro",
				}),
			);
		});

		it("deve aceitar todos os tipos de faturamento válidos", async () => {
			mockCalculateAndPersist.mockResolvedValue(validInvoiceResult);

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
				expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
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
			mockCalculateAndPersist.mockResolvedValue(validInvoiceResult);

			const response = await server.inject({
				method: "POST",
				url: "/prepara-fatura",
				payload: { ...validBody, f_parceiro: 1.5 },
			});

			expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
		});
	});

	describe("propagação de erros de negócio", () => {
		it("deve retornar 404 quando parceiro não é encontrado", async () => {
			mockCalculateAndPersist.mockRejectedValue(
				NotFoundError.create("Parceiro", 999),
			);

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
			mockCalculateAndPersist.mockRejectedValue(
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
			mockCalculateAndPersist.mockRejectedValue(
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
			mockCalculateAndPersist.mockRejectedValue(
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
			mockCalculateAndPersist.mockRejectedValue(
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
			mockCalculateAndPersist.mockRejectedValue(new Error("Crash inesperado"));

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
			mockCalculateAndPersist.mockRejectedValue(
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
