import type { FastifyPluginAsync } from "fastify";
import { prepareInvoiceHandler } from "./prepara-fatura.controller";
import {
	preparaFaturaResponseSchema,
	preparaFaturaSchema,
} from "./prepara-fatura.schemas";

const preparaFaturaRoutes: FastifyPluginAsync = async server => {
	server.post("/prepara-fatura", {
		schema: {
			body: preparaFaturaSchema,
			response: {
				200: preparaFaturaResponseSchema,
			},
		},
		handler: prepareInvoiceHandler,
	});
};

export { preparaFaturaRoutes };
