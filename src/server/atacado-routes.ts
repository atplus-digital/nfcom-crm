import type { FastifyPluginAsync } from "fastify";
import { atacadoApi } from "@/services/atacado/atacado-api";

export const atacadoRoutes: FastifyPluginAsync = async (server) => {
	server.get("/cobrancas", async () => {
		const response = await atacadoApi.get(
			"/swagger:get?ns=collections/t_nfcom_cobrancas"
		);

		return response.data;
	});
};
