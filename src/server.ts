import fastify from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { env } from "@/env";
import { appRoutes } from "@/routes/routes";
import { errorHandler } from "@/shared/error-handler";
import { createLoggerConfig } from "@/shared/logging/logger.config";

const buildServer = async () => {
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
};

export { buildServer };
