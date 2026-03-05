import type { FastifyRequest, FastifyReply } from "fastify";
import type { PreparaFaturaBody } from "./prepara-fatura.schemas";

export async function preparaFaturaHandler(
	request: FastifyRequest<{ Body: PreparaFaturaBody }>,
	reply: FastifyReply
) {
	return reply.status(201).send({ body: request.body });
}
