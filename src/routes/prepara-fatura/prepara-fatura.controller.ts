import type { FastifyReply, FastifyRequest } from "fastify";
import { faturaService } from "@/modules/fatura/fatura.service";
import type { PreparaFaturaBody } from "./prepara-fatura.schemas";
import { DateCalculator } from "@/modules/fatura/domain/date-calculator";

interface PreparaFaturaResponse {
	readonly status: 200;
	readonly success: true;
	readonly dateStr: string;
	readonly date: Date;
	readonly data: unknown;
}

const preparaFaturaHandler = async (
	request: FastifyRequest<{ Body: PreparaFaturaBody }>,
	reply: FastifyReply,
): Promise<PreparaFaturaResponse> => {
	const { f_parceiro, f_data_referencia } = request.body;

	const fatura = await faturaService.calcular({
		parceiroId: f_parceiro,
		dataReferencia: DateCalculator.formatToISODate(f_data_referencia),
	});

	const response: PreparaFaturaResponse = {
		status: 200,
		success: true,
		dateStr: DateCalculator.formatToISODate(f_data_referencia),
		date: f_data_referencia,
		data: fatura,
	};

	return reply.status(200).send(response);
};

export { preparaFaturaHandler };
