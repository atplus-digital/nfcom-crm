import z from "zod";
import {
	InvoicePartnerSchema,
	TipoFaturamentoEnum,
} from "@/modules/invoice-service/invoice.schemas";

export const preparaFaturaSchema = z.object({
	f_parceiro: z
		.number({ message: "ID do parceiro deve ser um número" })
		.positive("ID do parceiro deve ser positivo"),
	f_data_referencia: z.coerce.date({ message: "Data de referência inválida" }),
	f_tipo_de_faturamento: TipoFaturamentoEnum,
});

export const preparaFaturaResponseSchema = z.object({
	status: z.literal(200),
	success: z.literal(true),
	dateStr: z.string(),
	date: z.date(),
	billingType: TipoFaturamentoEnum,
	data: InvoicePartnerSchema,
});

export type PreparaFaturaBody = z.infer<typeof preparaFaturaSchema>;

export type PrepareInvoiceResponse = z.infer<
	typeof preparaFaturaResponseSchema
>;
