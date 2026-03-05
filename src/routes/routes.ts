import type { FastifyPluginAsync } from "fastify";
import { preparaFaturaRoutes } from "./prepara-fatura";

const appRoutes: FastifyPluginAsync = async (server) => {
	server.get("/", () => ({ api: "on" }));

	await server.register(preparaFaturaRoutes);
};

export { appRoutes };
