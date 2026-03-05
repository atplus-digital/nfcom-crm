import type { FastifyRequest, FastifyReply } from "fastify";
import type { PreparaFaturaBody } from "./prepara-fatura.schemas";

export async function preparaFaturaHandler(
	request: FastifyRequest<{ Body: PreparaFaturaBody }>,
	reply: FastifyReply
) {
	return reply
		.status(200)
		.send({
			status: 201,
			dateStr: request.body.f_data_referencia,
			date: new Date(request.body.f_data_referencia),
			success: true,
		});
}
