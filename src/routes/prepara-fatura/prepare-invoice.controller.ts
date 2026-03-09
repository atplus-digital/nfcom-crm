import type { FastifyReply, FastifyRequest } from "fastify";
import { formatToISODate } from "@/modules/fatura/domain/date-calculator";
import { invoiceService } from "@/modules/fatura/invoice.service";

import type {
	PreparaFaturaBody,
	PrepareInvoiceResponse,
} from "./prepare-invoice.schemas";

const prepareInvoiceHandler = async (
	request: FastifyRequest<{ Body: PreparaFaturaBody }>,
	reply: FastifyReply,
): Promise<PrepareInvoiceResponse> => {
	const { f_parceiro, f_data_referencia, f_tipo_de_faturamento } = request.body;

	const dateStr = formatToISODate(f_data_referencia);

	const invoice = await invoiceService.calculate({
		partnerId: f_parceiro,
		referenceDate: dateStr,
		billingType: f_tipo_de_faturamento,
	});

	const response: PrepareInvoiceResponse = {
		status: 200,
		success: true,
		dateStr,
		date: f_data_referencia,
		billingType: f_tipo_de_faturamento,
		data: invoice,
	};

	return reply.status(200).send(response);
};

export { prepareInvoiceHandler };
