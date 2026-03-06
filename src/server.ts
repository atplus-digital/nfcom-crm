import fastify from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { env } from "@/env";
import { appRoutes } from "@/routes/routes";
import { errorHandler } from "@/shared/error-handler";
import { createLoggerConfig } from "@/shared/logging/logger.config";

interface ServerInfo {
	readonly address: string;
	readonly port: number;
}

const buildServer = async (): Promise<ServerInfo> => {
	const server = fastify({
		logger: createLoggerConfig(),
	});

	server.setValidatorCompiler(validatorCompiler);
	server.setSerializerCompiler(serializerCompiler);
	server.setErrorHandler(errorHandler);

	await server.register(appRoutes);

	const address = await server.listen({
		port: env.SERVER_PORT,
		host: env.SERVER_URL,
	});

	server.log.info(`Server listening at ${address}`);

	return {
		address: env.SERVER_URL,
		port: env.SERVER_PORT,
	};
};

export { buildServer };
