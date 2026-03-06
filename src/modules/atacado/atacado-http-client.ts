import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { env } from "@/env";
import { ExternalApiError } from "@/shared/base.error";
import { API_HEADERS, HEADERS } from "./constants";

const ATACADO_ROUTES = {
	parceiros: "/t_parceiros",
	clientes: "/t_clientes",
	planosDeServico: "/t_planos_de_servico",
	faturas: "/t_nfcom_faturas",
	cobrancas: "/t_nfcom_cobrancas",
	notasFiscais: "/t_nfcom_notas",
} as const;

type AtacadoRoute = (typeof ATACADO_ROUTES)[keyof typeof ATACADO_ROUTES];

interface HttpClientConfig {
	readonly baseURL: string;
	readonly apiKey: string;
	readonly timeout?: number;
	readonly maxRetries?: number;
	readonly retryDelay?: number;
}

interface ApiResponse<T> {
	readonly data: T;
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

const extractErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		return error.response?.data?.message ?? error.message;
	}
	if (error instanceof Error) {
		return error.message;
	}
	return "Erro desconhecido";
};

const shouldRetry = (error: unknown): boolean => {
	if (!axios.isAxiosError(error)) return false;
	const status = error.response?.status;
	if (!status) return true;
	return status >= 500 || status === 429;
};

class AtacadoHttpClient {
	private readonly client: AxiosInstance;
	private readonly maxRetries: number;
	private readonly retryDelay: number;
	readonly routes = ATACADO_ROUTES;

	constructor(config: HttpClientConfig) {
		this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
		this.retryDelay = config.retryDelay ?? DEFAULT_RETRY_DELAY;

		this.client = axios.create({
			baseURL: config.baseURL,
			timeout: config.timeout ?? DEFAULT_TIMEOUT,
			headers: {
				...API_HEADERS,
				[HEADERS.AUTHORIZATION]: `Bearer ${config.apiKey}`,
			},
		});
	}

	private async executeWithRetry<T>(
		operation: () => Promise<T>,
		attempt = 1,
	): Promise<T> {
		try {
			return await operation();
		} catch (error) {
			if (attempt < this.maxRetries && shouldRetry(error)) {
				await sleep(this.retryDelay * attempt);
				return this.executeWithRetry(operation, attempt + 1);
			}
			throw ExternalApiError.create("Atacado", extractErrorMessage(error));
		}
	}

	async get<T>(
		route: AtacadoRoute | string,
		config?: AxiosRequestConfig,
	): Promise<ApiResponse<T>> {
		return this.executeWithRetry(() =>
			this.client.get<ApiResponse<T>>(route, config).then((r) => r.data),
		);
	}

	async post<T>(
		route: AtacadoRoute | string,
		data?: unknown,
		config?: AxiosRequestConfig,
	): Promise<ApiResponse<T>> {
		return this.executeWithRetry(() =>
			this.client.post<ApiResponse<T>>(route, data, config).then((r) => r.data),
		);
	}
}

const createAtacadoHttpClient = (): AtacadoHttpClient =>
	new AtacadoHttpClient({
		baseURL: env.ATACADO_API_URL,
		apiKey: env.ATACADO_API_KEY,
	});

const atacadoHttpClient = createAtacadoHttpClient();

export { atacadoHttpClient, ATACADO_ROUTES };
