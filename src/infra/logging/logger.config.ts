import type { FastifyLoggerOptions } from "fastify";

type LogLevel =
	| "fatal"
	| "error"
	| "warn"
	| "info"
	| "debug"
	| "trace"
	| "silent";

interface LoggerConfig extends FastifyLoggerOptions {
	readonly level: LogLevel;
}

const LOG_LEVELS = {
	production: "info" as LogLevel,
	development: "debug" as LogLevel,
	test: "silent" as LogLevel,
};

const getNodeEnv = (): string => process.env.NODE_ENV ?? "development";

const isProduction = (): boolean => getNodeEnv() === "production";

const resolveLogLevel = (): LogLevel => {
	const env = getNodeEnv();
	return LOG_LEVELS[env as keyof typeof LOG_LEVELS] ?? LOG_LEVELS.development;
};

const createLoggerConfig = (): LoggerConfig => {
	const config: LoggerConfig = {
		level: resolveLogLevel(),
	};

	if (isProduction()) {
		config.file = "logs/server.log";
	}

	return config;
};

export { createLoggerConfig, isProduction };
