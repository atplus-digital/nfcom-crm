import type { FastifyReply, FastifyRequest } from "fastify";
import { formatToISODate } from "@/modules/fatura/domain/date-calculator";
import { invoiceService } from "@/modules/fatura/fatura.service";
import type { PreparaFaturaBody } from "./prepara-fatura.schemas";

interface PrepareInvoiceResponse {
	readonly status: 200;
	readonly success: true;
	readonly dateStr: string;
	readonly date: Date;
	readonly data: unknown;
}

const prepareInvoiceHandler = async (
	request: FastifyRequest<{ Body: PreparaFaturaBody }>,
	reply: FastifyReply,
): Promise<PrepareInvoiceResponse> => {
	const { f_parceiro, f_data_referencia } = request.body;

	const invoice = await invoiceService.calculate({
		partnerId: f_parceiro,
		referenceDate: formatToISODate(f_data_referencia),
	});

	const response: PrepareInvoiceResponse = {
		status: 200,
		success: true,
		dateStr: formatToISODate(f_data_referencia),
		date: f_data_referencia,
		data: invoice,
	};

	return reply.status(200).send(response);
};

export { prepareInvoiceHandler };
