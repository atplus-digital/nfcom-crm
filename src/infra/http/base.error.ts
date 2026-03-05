import { ERROR_CODES, HTTP_STATUS } from "@/infra/constants";

interface FieldError {
	readonly field: string;
	readonly label: string;
}

interface ErrorContext {
	readonly resource?: string;
	readonly identifier?: string | number | undefined;
	readonly fields?: readonly FieldError[];
	readonly service?: string;
	readonly details?: string | undefined;
}

abstract class AppError extends Error {
	abstract readonly type: string;
	abstract readonly statusCode: number;

	constructor(
		message: string,
		readonly context?: ErrorContext,
	) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}

	toJSON() {
		return {
			type: this.type,
			message: this.message,
			...(this.context && { context: this.context }),
		};
	}
}

class NotFoundError extends AppError {
	readonly type = ERROR_CODES.NOT_FOUND;
	readonly statusCode = HTTP_STATUS.NOT_FOUND;

	static create(resource: string, identifier?: string | number): NotFoundError {
		const message = identifier
			? `${resource} com identificador "${identifier}" não encontrado`
			: `${resource} não encontrado`;
		return new NotFoundError(message, { resource, identifier });
	}
}

class ValidationError extends AppError {
	readonly type = ERROR_CODES.VALIDATION_ERROR;
	readonly statusCode = HTTP_STATUS.BAD_REQUEST;

	static create(message: string): ValidationError {
		return new ValidationError(message);
	}
}

class EntityValidationError extends AppError {
	readonly type = ERROR_CODES.ENTITY_VALIDATION_ERROR;
	readonly statusCode = HTTP_STATUS.BAD_REQUEST;

	static create(
		entityName: string,
		identifier: string | number,
		fields: readonly FieldError[],
	): EntityValidationError {
		const fieldNames = fields.map((f) => f.label).join(", ");
		const message = `${entityName} "${identifier}" com dados inválidos: ${fieldNames}`;
		return new EntityValidationError(message, {
			resource: entityName,
			identifier,
			fields,
		});
	}

	get fields(): readonly FieldError[] | undefined {
		return this.context?.fields;
	}
}

class DocumentValidationError extends AppError {
	readonly type = ERROR_CODES.DOCUMENT_VALIDATION_ERROR;
	readonly statusCode = HTTP_STATUS.BAD_REQUEST;

	static create(message: string): DocumentValidationError {
		return new DocumentValidationError(message);
	}
}

class ExternalApiError extends AppError {
	readonly type = ERROR_CODES.EXTERNAL_API_ERROR;
	readonly statusCode = HTTP_STATUS.BAD_GATEWAY;

	static create(service: string, details?: string): ExternalApiError {
		const message = details
			? `Erro na API ${service}: ${details}`
			: `Erro ao comunicar com ${service}`;
		return new ExternalApiError(message, { service, details });
	}
}

class BusinessRuleError extends AppError {
	readonly type = ERROR_CODES.BUSINESS_RULE_ERROR;
	readonly statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;

	static create(message: string, context?: ErrorContext): BusinessRuleError {
		return new BusinessRuleError(message, context);
	}
}

class InternalError extends AppError {
	readonly type = ERROR_CODES.INTERNAL_ERROR;
	readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;

	static create(message: string): InternalError {
		return new InternalError(message);
	}
}

type AppErrorType =
	| NotFoundError
	| ValidationError
	| EntityValidationError
	| DocumentValidationError
	| ExternalApiError
	| BusinessRuleError
	| InternalError;

function isAppError(error: unknown): error is AppErrorType {
	return error instanceof AppError;
}

export {
	AppError,
	NotFoundError,
	ValidationError,
	EntityValidationError,
	DocumentValidationError,
	ExternalApiError,
	BusinessRuleError,
	InternalError,
	isAppError,
};

export type { FieldError, ErrorContext, AppErrorType };
