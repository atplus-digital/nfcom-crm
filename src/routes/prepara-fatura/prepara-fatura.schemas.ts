import z from "zod";

const TipoFaturamentoEnum = z.enum([
	"parceiro",
	"via-parceiro",
	"cofaturamento",
	"cliente-final",
]);

const preparaFaturaSchema = z.object({
	f_parceiro: z
		.number({ message: "ID do parceiro deve ser um número" })
		.positive("ID do parceiro deve ser positivo"),
	f_data_referencia: z.coerce.date({ message: "Data de referência inválida" }),
	f_tipo_de_faturamento: TipoFaturamentoEnum,
});

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
	client: z.unknown(),
	total: z.number(),
	totalLines: z.number(),
	lines: z.array(ProcessedLineSchema),
	groupedLines: z.array(GroupedLineSchema),
});

const PartnerInvoiceSchema = z.object({
	partner: z.unknown(),
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
	billingType: TipoFaturamentoEnum,
	data: InvoicePartnerSchema,
});

export type PrepareInvoiceResponse = z.infer<
	typeof preparaFaturaResponseSchema
>;

export {
	preparaFaturaSchema,
	preparaFaturaResponseSchema,
	TipoFaturamentoEnum,
	ProcessedLineSchema,
	GroupedLineSchema,
	GroupedServiceSchema,
	ClientDetailSchema,
	PartnerInvoiceSchema,
	InvoicePartnerSchema,
};

export type PreparaFaturaBody = z.infer<typeof preparaFaturaSchema>;
export type TipoFaturamento = z.infer<typeof TipoFaturamentoEnum>;
export type ProcessedLine = z.infer<typeof ProcessedLineSchema>;
export type GroupedLine = z.infer<typeof GroupedLineSchema>;
export type GroupedService = z.infer<typeof GroupedServiceSchema>;
export type ClientDetail = z.infer<typeof ClientDetailSchema>;
export type PartnerInvoice = z.infer<typeof PartnerInvoiceSchema>;
export type InvoicePartner = z.infer<typeof InvoicePartnerSchema>;
