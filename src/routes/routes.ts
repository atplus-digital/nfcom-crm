import type { FastifyPluginAsync } from "fastify";
import { preparaFaturaRoutes } from "./prepara-fatura";

export const appRoutes: FastifyPluginAsync = async (server) => {
	server.get("/", async () => {
		return { ok: true };
	});

	await server.register(preparaFaturaRoutes);
};
