import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { isAppError } from "@/shared/base.error";
import { ERROR_CODES, HTTP_STATUS } from "@/shared/constants";

interface ErrorResponse {
	readonly success: false;
	readonly error: {
		readonly code: string;
		readonly message: string;
		readonly details?: unknown;
	};
}

const isProduction = process.env.NODE_ENV === "production";

const buildErrorResponse = (
	code: string,
	message: string,
	details?: unknown,
): ErrorResponse => ({
	success: false,
	error: {
		code,
		message,
		...(details && !isProduction ? { details } : {}),
	},
});

const getStatusCode = (error: FastifyError | Error): number => {
	if ("statusCode" in error && typeof error.statusCode === "number") {
		return error.statusCode;
	}
	if (isAppError(error)) {
		return error.statusCode;
	}
	return HTTP_STATUS.INTERNAL_SERVER_ERROR;
};

const getErrorCode = (error: FastifyError | Error): string => {
	if (isAppError(error)) {
		return error.type;
	}
	if ("code" in error && typeof error.code === "string") {
		return error.code;
	}
	return ERROR_CODES.FASTIFY_ERROR;
};

export const errorHandler = (
	error: FastifyError | Error,
	request: FastifyRequest,
	reply: FastifyReply,
): void => {
	const statusCode = getStatusCode(error);
	const errorCode = getErrorCode(error);

	request.log.error({
		error: {
			message: error.message,
			stack: error.stack,
			name: error.name,
		},
		request: {
			method: request.method,
			url: request.url,
			body: request.body,
		},
	});

	const response = buildErrorResponse(
		errorCode,
		isProduction && statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR
			? "Erro interno do servidor"
			: error.message,
		!isProduction ? { stack: error.stack } : undefined,
	);

	reply.status(statusCode).send(response);
};
