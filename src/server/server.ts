import fastify from "fastify";
import { env } from "@/env";
import { atacadoRoutes } from "@/server/atacado-routes";
import {
	getActiveUsers,
	getParceiro,
	getPlanosDeServico,
} from "@/services/atacado/atacado-service";

async function buildServer() {
	const server = fastify({
		logger: {
			enabled: true,
			file: "logs/server.log",
		},
	});

	server.log.info("Iniciando o servidor...");

	server.get("/", async () => {
		const id = 17;
		const parceiro = await getParceiro(id);
		const clientes = await getActiveUsers(id);
		const planos = await getPlanosDeServico();
		return {
			parceiro,
			clientes,
			planos,
		};
	});

	server.register(atacadoRoutes, { prefix: "/atacado" });

	const address = await server.listen({
		port: env.SERVER_PORT,
		host: env.SERVER_URL,
	});

	console.log(`Server listening at ${address}`);
}

export { buildServer };
