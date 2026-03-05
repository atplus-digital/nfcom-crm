import fastify from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { env } from "@/env";
import { appRoutes } from "@/routes/routes";
import { logConfig } from "./log.config";

async function buildServer() {
	console.log("Starting server...");

	const server = fastify({
		logger: logConfig(),
	});

	server.setValidatorCompiler(validatorCompiler);
	server.setSerializerCompiler(serializerCompiler);

	server.register(appRoutes);

	const address = await server.listen({
		port: env.SERVER_PORT,
		host: env.SERVER_URL,
	});

	console.log(`Server listening at ${address}`);
	server.log.debug("Server Started");
}

export { buildServer };
