import { ExternalApiError } from "@/shared/base.error";

const mockAxiosInstance = {
	get: jest.fn(),
	post: jest.fn(),
};

const mockCreate = jest.fn().mockReturnValue(mockAxiosInstance);
const mockIsAxiosError = jest.fn();

jest.mock("axios", () => ({
	__esModule: true,
	default: {
		create: mockCreate,
		isAxiosError: mockIsAxiosError,
	},
	create: mockCreate,
	isAxiosError: mockIsAxiosError,
}));

jest.mock("@/env", () => ({
	env: {
		ATACADO_API_URL: "https://api.test.com",
		ATACADO_API_KEY: "test-api-key",
	},
}));

jest.mock("@/modules/atacado-repository/http-client/utils", () => ({
	...jest.requireActual("@/modules/atacado-repository/http-client/utils"),
	sleep: jest.fn().mockResolvedValue(undefined),
}));

import {
    ATACADO_ROUTES,
    atacadoHttpClient,
} from "@/modules/atacado-repository/http-client/atacado-http-client";

describe("AtacadoHttpClient", () => {
	beforeEach(() => {
		mockAxiosInstance.get.mockReset();
		mockAxiosInstance.post.mockReset();
		mockIsAxiosError.mockReset();
	});

	it("deve ter sido configurado com as rotas corretas", () => {
		expect(atacadoHttpClient.routes).toBeDefined();
		expect(atacadoHttpClient.routes.parceiros).toBe("/t_parceiros");
		expect(atacadoHttpClient.routes.clientes).toBe("/t_clientes");
	});

	it("deve expor as rotas do atacado", () => {
		expect(atacadoHttpClient.routes).toEqual(ATACADO_ROUTES);
	});

	describe("get", () => {
		it("deve retornar dados com sucesso", async () => {
			const responseData = { data: [{ id: 1 }] };
			mockAxiosInstance.get.mockResolvedValue({ data: responseData });

			const result = await atacadoHttpClient.get("/t_parceiros:get");

			expect(result).toEqual(responseData);
			expect(mockAxiosInstance.get).toHaveBeenCalledWith(
				"/t_parceiros:get",
				undefined,
			);
		});

		it("deve passar config para o axios", async () => {
			const responseData = { data: [] };
			mockAxiosInstance.get.mockResolvedValue({ data: responseData });

			const config = { params: { filterByTk: 1 } };
			await atacadoHttpClient.get("/t_parceiros:get", config);

			expect(mockAxiosInstance.get).toHaveBeenCalledWith(
				"/t_parceiros:get",
				config,
			);
		});

		it("deve fazer retry em erro retryable", async () => {
			const retryableError = Object.assign(new Error("Server Error"), {
				isAxiosError: true,
				response: { status: 500 },
			});
			const responseData = { data: [{ id: 1 }] };

			mockIsAxiosError.mockReturnValue(true);

			mockAxiosInstance.get
				.mockRejectedValueOnce(retryableError)
				.mockResolvedValueOnce({ data: responseData });

			const result = await atacadoHttpClient.get("/t_parceiros:get");

			expect(result).toEqual(responseData);
			expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
		});

		it("deve lançar ExternalApiError após esgotar retries", async () => {
			const retryableError = Object.assign(new Error("Server Error"), {
				isAxiosError: true,
				response: { status: 500 },
				message: "Request failed with status code 500",
			});

			mockIsAxiosError.mockReturnValue(true);
			mockAxiosInstance.get.mockRejectedValue(retryableError);

			await expect(atacadoHttpClient.get("/t_parceiros:get")).rejects.toThrow(
				ExternalApiError,
			);
		});

		it("deve lançar ExternalApiError imediatamente para erro não-retryable", async () => {
			const nonRetryableError = Object.assign(new Error("Not Found"), {
				isAxiosError: true,
				response: { status: 404 },
				message: "Not Found",
			});

			mockIsAxiosError.mockImplementation(
				(err: unknown) => err === nonRetryableError,
			);
			mockAxiosInstance.get.mockRejectedValue(nonRetryableError);

			await expect(atacadoHttpClient.get("/t_parceiros:get")).rejects.toThrow(
				ExternalApiError,
			);

			expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
		});
	});

	describe("post", () => {
		it("deve enviar dados com sucesso", async () => {
			const responseData = { data: { id: 1 } };
			mockAxiosInstance.post.mockResolvedValue({ data: responseData });

			const postData = { f_razao_social: "Teste" };
			const result = await atacadoHttpClient.post(
				"/t_nfcom_faturas:create",
				postData,
			);

			expect(result).toEqual(responseData);
			expect(mockAxiosInstance.post).toHaveBeenCalledWith(
				"/t_nfcom_faturas:create",
				postData,
				undefined,
			);
		});

		it("deve fazer retry em erro de servidor no post", async () => {
			const retryableError = Object.assign(new Error("Server Error"), {
				isAxiosError: true,
				response: { status: 502 },
			});
			const responseData = { data: { id: 1 } };

			mockIsAxiosError.mockReturnValue(true);

			mockAxiosInstance.post
				.mockRejectedValueOnce(retryableError)
				.mockResolvedValueOnce({ data: responseData });

			const result = await atacadoHttpClient.post(
				"/t_nfcom_faturas:create",
				{},
			);

			expect(result).toEqual(responseData);
			expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
		});
	});
});
