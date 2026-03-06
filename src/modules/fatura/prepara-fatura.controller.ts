import type { FastifyReply, FastifyRequest } from "fastify";
import { invoiceService } from "@/modules/fatura/fatura.service";
import type { PreparaFaturaBody } from "@/routes/prepara-fatura/prepara-fatura.schemas";

export const preparaFaturaHandler = async (
	request: FastifyRequest<{ Body: PreparaFaturaBody }>,
	reply: FastifyReply,
): Promise<void> => {
	const { f_parceiro, f_data_referencia } = request.body;

	const invoice = await invoiceService.calculate({
		partnerId: f_parceiro,
		referenceDate: f_data_referencia.toISOString().slice(0, 10),
	});

	return reply.status(200).send({
		status: 200,
		dateStr: f_data_referencia.toISOString().slice(0, 10),
		date: f_data_referencia,
		success: true,
		data: invoice,
	});
};
