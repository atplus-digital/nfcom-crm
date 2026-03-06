import z from "zod";

/**
 * Tipos de faturamento disponíveis
 * - parceiro: Faturamento direto ao parceiro
 * - via-parceiro: Faturamento através do parceiro
 * - cofaturamento: Faturamento compartilhado
 * - cliente-final: Faturamento direto ao cliente final
 */
const TipoFaturamentoEnum = z.enum([
	"parceiro",
	"via-parceiro",
	"cofaturamento",
	"cliente-final",
]);

type TipoFaturamento = z.infer<typeof TipoFaturamentoEnum>;

const preparaFaturaSchema = z.object({
	f_parceiro: z
		.number({ message: "ID do parceiro deve ser um número" })
		.positive("ID do parceiro deve ser positivo"),
	f_data_referencia: z.coerce.date({ message: "Data de referência inválida" }),
	f_tipo_de_faturamento: TipoFaturamentoEnum,
});

type PreparaFaturaBody = z.infer<typeof preparaFaturaSchema>;

const ProcessedLineSchema = z.object({
	id: z.union([z.string(), z.number()]),
	planId: z.union([z.string(), z.number()]),
	unitPrice: z.number(),
	description: z.string(),
});

const GroupedLineSchema = ProcessedLineSchema.extend({
	quantity: z.number(),
	total: z.number(),
});

const GroupedServiceSchema = z.object({
	planId: z.union([z.string(), z.number()]),
	description: z.string(),
	unitPrice: z.number(),
	quantity: z.number(),
	total: z.number(),
});

const ClientDetailSchema = z.object({
	client: z.record(z.string(), z.unknown()),
	total: z.number(),
	totalLines: z.number(),
	lines: z.array(ProcessedLineSchema),
	groupedLines: z.array(GroupedLineSchema),
});

const PartnerInvoiceSchema = z.object({
	partner: z.record(z.string(), z.unknown()),
	invoiceTotal: z.number(),
	totalClients: z.number(),
	totalLines: z.number(),
});

const InvoicePartnerSchema = z.object({
	dueDate: z.string(),
	invoiceTotal: z.number(),
	totalLines: z.number(),
	partner: PartnerInvoiceSchema,
	clients: z.array(ClientDetailSchema),
	groupedServices: z.array(GroupedServiceSchema),
});

const preparaFaturaResponseSchema = z.object({
	status: z.literal(200),
	success: z.literal(true),
	dateStr: z.string(),
	date: z.date(),
	tipoFaturamento: TipoFaturamentoEnum,
	data: InvoicePartnerSchema,
});

export {
	preparaFaturaSchema,
	preparaFaturaResponseSchema,
	TipoFaturamentoEnum,
	type PreparaFaturaBody,
	type TipoFaturamento,
};
