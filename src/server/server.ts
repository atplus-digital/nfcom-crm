import fastify from "fastify";
import { env } from "@/env";
import { atacadoRoutes } from "@/routes/atacado-routes";

async function buildServer() {
	const server = fastify();

	server.register(atacadoRoutes, { prefix: "/atacado" });

	const address = await server.listen({
		port: env.SERVER_PORT,
		host: env.SERVER_URL,
	});

	console.log(`Server listening at ${address}`);
}

export { buildServer };
