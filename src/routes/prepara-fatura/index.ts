import type { FastifyPluginAsync } from "fastify";
import { preparaFaturaHandler } from "./prepara-fatura.controller";
import {
	preparaFaturaResponseSchema,
	preparaFaturaSchema,
} from "./prepara-fatura.schemas";

const preparaFaturaRoutes: FastifyPluginAsync = async (server) => {
	server.post("/prepara-fatura", {
		schema: {
			body: preparaFaturaSchema,
			response: {
				200: preparaFaturaResponseSchema,
			},
		},
		handler: preparaFaturaHandler,
	});
};

export { preparaFaturaRoutes };
