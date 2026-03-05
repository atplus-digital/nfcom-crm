import type {
	FastifyLoggerOptions,
	PinoLoggerOptions,
} from "fastify/types/logger";

type LoggerConfig = PinoLoggerOptions & FastifyLoggerOptions;

function logConfig(): LoggerConfig {
	const config: LoggerConfig = {
		enabled: true,
		level: "debug",
		file: "logs/server.log",
	};
	return config;
}

export { logConfig };
