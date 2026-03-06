import type { FastifyReply, FastifyRequest } from "fastify";
import { formatToISODate } from "@/modules/fatura/domain/date-calculator";
import { invoiceService } from "@/modules/fatura/fatura.service";
import type {
	PreparaFaturaBody,
	TipoFaturamento,
} from "./prepara-fatura.schemas";

interface PrepareInvoiceResponse {
	readonly status: 200;
	readonly success: true;
	readonly dateStr: string;
	readonly date: Date;
	readonly tipoFaturamento: TipoFaturamento;
	readonly data: unknown;
}

const prepareInvoiceHandler = async (
	request: FastifyRequest<{ Body: PreparaFaturaBody }>,
	reply: FastifyReply,
): Promise<PrepareInvoiceResponse> => {
	const { f_parceiro, f_data_referencia, f_tipo_de_faturamento } = request.body;

	const invoice = await invoiceService.calculate({
		partnerId: f_parceiro,
		referenceDate: formatToISODate(f_data_referencia),
		billingType: f_tipo_de_faturamento,
	});

	const response: PrepareInvoiceResponse = {
		status: 200,
		success: true,
		dateStr: formatToISODate(f_data_referencia),
		date: f_data_referencia,
		tipoFaturamento: f_tipo_de_faturamento,
		data: invoice,
	};

	return reply.status(200).send(response);
};

export { prepareInvoiceHandler };
