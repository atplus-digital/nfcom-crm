export interface HttpClientConfig {
	readonly baseURL: string;
	readonly apiKey: string;
	readonly timeout?: number;
	readonly maxRetries?: number;
	readonly retryDelay?: number;
}

export interface ApiResponse<T> {
	readonly data: T;
}
