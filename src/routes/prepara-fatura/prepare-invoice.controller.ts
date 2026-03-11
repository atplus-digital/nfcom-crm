import type { FastifyReply, FastifyRequest } from "fastify";
import { invoiceService } from "@/modules/invoice-service/invoice.service";
import { formatToISODate } from "@/modules/invoice-service/invoice-calculator/domain/date-calculator";
import { HTTP_STATUS } from "@/shared/constants";

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

	const persistedInvoice = await invoiceService.calculateAndPersist({
		partnerId: f_parceiro,
		referenceDate: dateStr,
		billingType: f_tipo_de_faturamento,
	});

	const response: PrepareInvoiceResponse = {
		status: HTTP_STATUS.CREATED,
		success: true,
		dateStr,
		billingType: f_tipo_de_faturamento,
		resumo: persistedInvoice.resumo,
		data: persistedInvoice.data,
	};

	return reply.status(HTTP_STATUS.CREATED).send(response);
};

export { prepareInvoiceHandler };
