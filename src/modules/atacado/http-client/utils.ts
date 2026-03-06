import axios from "axios";

export const DEFAULT_TIMEOUT = 30000;
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_RETRY_DELAY = 1000;

export const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const extractErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		return error.response?.data?.message ?? error.message;
	}
	if (error instanceof Error) {
		return error.message;
	}
	return "Erro desconhecido";
};

export const shouldRetry = (error: unknown): boolean => {
	if (!axios.isAxiosError(error)) return false;
	const status = error.response?.status;
	if (!status) return true;
	return status >= 500 || status === 429;
};
