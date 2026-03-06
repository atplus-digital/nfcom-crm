import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { env } from "@/env";
import { ExternalApiError } from "@/shared/base.error";
import { API_HEADERS, HEADERS } from "../atacado.constants";
import { ATACADO_ROUTES, type AtacadoRouteWithSuffix } from "./atacado.routes";
import type { ApiResponse, HttpClientConfig } from "./types";
import {
	DEFAULT_MAX_RETRIES,
	DEFAULT_RETRY_DELAY,
	DEFAULT_TIMEOUT,
	extractErrorMessage,
	shouldRetry,
	sleep,
} from "./utils";

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
		route: AtacadoRouteWithSuffix,
		config?: AxiosRequestConfig,
	): Promise<ApiResponse<T>> {
		return this.executeWithRetry(() =>
			this.client.get<ApiResponse<T>>(route, config).then((r) => r.data),
		);
	}

	async post<T>(
		route: AtacadoRouteWithSuffix,
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
