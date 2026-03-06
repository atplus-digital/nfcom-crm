import { join } from "node:path";
import type { FastifyLoggerOptions } from "fastify";
import type { PinoLoggerOptions } from "fastify/types/logger";

// Types
type LogLevel =
	| "fatal"
	| "error"
	| "warn"
	| "info"
	| "debug"
	| "trace"
	| "silent";

type LoggerConfig = FastifyLoggerOptions &
	PinoLoggerOptions & {
		readonly level: LogLevel;
	};

// Constants
const LOG_LEVELS = {
	production: "info" as const,
	development: "debug" as const,
	test: "silent" as const,
} as const;

const LOGS_PATH = "logs";
const DAILY_FREQUENCY = "daily";
const DATE_FORMAT = "dd-MM-yyyy";

// Helpers
const getNodeEnv = (): string => process.env.NODE_ENV ?? "development";

const isProduction = (): boolean => getNodeEnv() === "production";

const resolveLogLevel = (): LogLevel => {
	const env = getNodeEnv() as keyof typeof LOG_LEVELS;
	return LOG_LEVELS[env] ?? LOG_LEVELS.development;
};

// Transport builders
const buildRollingFileTransport = (
	level: LogLevel,
	fileName: string,
): {
	target: string;
	level: LogLevel;
	options: Record<string, unknown>;
} => ({
	target: "pino-roll",
	level,
	options: {
		file: join(LOGS_PATH, fileName),
		frequency: DAILY_FREQUENCY,
		dateFormat: DATE_FORMAT,
		mkdir: true,
	},
});

const buildPrettyTransport = (level: LogLevel) => ({
	target: "pino-pretty",
	level,
	options: { target: 1 },
});

// Logger configuration factory
const createLoggerConfig = (): LoggerConfig => {
	const level = resolveLogLevel();
	const production = isProduction();

	return {
		level,
		transport: {
			targets: [
				buildRollingFileTransport("error", "error/error"),
				buildRollingFileTransport(production ? "warn" : "trace", "info/log"),
				buildPrettyTransport(production ? "warn" : "trace"),
			],
		},
	};
};

export { createLoggerConfig, isProduction };
