import type { FastifyPluginAsync } from "fastify";
import z from "zod";
import { preparaFaturaSchema } from "./prepara-fatura.schemas";
import { preparaFaturaHandler } from "./prepara-fatura.controller";

export const preparaFaturaRoutes: FastifyPluginAsync = async (server) => {
	server.post(
		"/prepara-fatura",
		{
			schema: {
				body: preparaFaturaSchema,
				response: {
					201: z.object({
						status: z.literal(201),
						success: z.literal(true),
					}),
				},
			},
		},
		preparaFaturaHandler,
	);
};
