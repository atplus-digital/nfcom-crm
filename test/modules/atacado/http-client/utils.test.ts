import {
	DEFAULT_MAX_RETRIES,
	DEFAULT_RETRY_DELAY,
	DEFAULT_TIMEOUT,
	extractErrorMessage,
	shouldRetry,
	sleep,
} from "@/modules/atacado/http-client/utils";
import { AxiosError, type AxiosRequestHeaders } from "axios";

describe("http-client utils", () => {
	describe("constants", () => {
		it("deve ter valores padrão corretos", () => {
			expect(DEFAULT_TIMEOUT).toBe(30000);
			expect(DEFAULT_MAX_RETRIES).toBe(3);
			expect(DEFAULT_RETRY_DELAY).toBe(1000);
		});
	});

	describe("sleep", () => {
		beforeEach(() => {
			jest.useFakeTimers();
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it("deve resolver após o tempo especificado", async () => {
			const promise = sleep(1000);

			jest.advanceTimersByTime(1000);

			await expect(promise).resolves.toBeUndefined();
		});
	});

	describe("extractErrorMessage", () => {
		it("deve extrair mensagem de AxiosError com response data", () => {
			const error = new AxiosError("Request failed");

			error.response = {
				data: { message: "API Error" },
				status: 500,
				statusText: "Internal Server Error",
				headers: {},
				config: { headers: {} as AxiosRequestHeaders },
			};

			expect(extractErrorMessage(error)).toBe("API Error");
		});

		it("deve usar mensagem do AxiosError quando response.data.message não existe", () => {
			const error = new AxiosError("Network Error");

			expect(extractErrorMessage(error)).toBe("Network Error");
		});

		it("deve extrair mensagem de Error genérico", () => {
			const error = new Error("Erro genérico");

			expect(extractErrorMessage(error)).toBe("Erro genérico");
		});

		it("deve retornar mensagem padrão para tipo desconhecido", () => {
			expect(extractErrorMessage("string error")).toBe("Erro desconhecido");
			expect(extractErrorMessage(null)).toBe("Erro desconhecido");
			expect(extractErrorMessage(42)).toBe("Erro desconhecido");
		});
	});

	describe("shouldRetry", () => {
		it("deve retornar false para erros não-Axios", () => {
			expect(shouldRetry(new Error("generic"))).toBe(false);
			expect(shouldRetry("string")).toBe(false);
			expect(shouldRetry(null)).toBe(false);
		});

		it("deve retornar true quando não há status (erro de rede)", () => {
			const error = new AxiosError("Network Error");
			expect(shouldRetry(error)).toBe(true);
		});

		it("deve retornar true para status >= 500", () => {
			const error = new AxiosError("Server Error");
			error.response = {
				status: 500,
				data: {},
				statusText: "Internal Server Error",
				headers: {},
				config: { headers: {} as AxiosRequestHeaders },
			};
			expect(shouldRetry(error)).toBe(true);
		});

		it("deve retornar true para status 429 (rate limit)", () => {
			const error = new AxiosError("Too Many Requests");
			error.response = {
				status: 429,
				data: {},
				statusText: "Too Many Requests",
				headers: {},
				config: { headers: {} as AxiosRequestHeaders },
			};
			expect(shouldRetry(error)).toBe(true);
		});

		it("deve retornar false para status 400", () => {
			const error = new AxiosError("Bad Request");
			error.response = {
				status: 400,
				data: {},
				statusText: "Bad Request",
				headers: {},
				config: { headers: {} as AxiosRequestHeaders },
			};
			expect(shouldRetry(error)).toBe(false);
		});

		it("deve retornar false para status 404", () => {
			const error = new AxiosError("Not Found");
			error.response = {
				status: 404,
				data: {},
				statusText: "Not Found",
				headers: {},
				config: { headers: {} as AxiosRequestHeaders },
			};
			expect(shouldRetry(error)).toBe(false);
		});

		it("deve retornar false para status 401", () => {
			const error = new AxiosError("Unauthorized");
			error.response = {
				status: 401,
				data: {},
				statusText: "Unauthorized",
				headers: {},
				config: { headers: {} as AxiosRequestHeaders },
			};
			expect(shouldRetry(error)).toBe(false);
		});
	});
});
