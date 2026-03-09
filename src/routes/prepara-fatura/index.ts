import type { FastifyPluginAsync } from "fastify";
import { prepareInvoiceHandler } from "./prepare-invoice.controller";
import {
	preparaFaturaResponseSchema,
	preparaFaturaSchema,
} from "./prepare-invoice.schemas";

const preparaFaturaRoutes: FastifyPluginAsync = async (server) => {
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
