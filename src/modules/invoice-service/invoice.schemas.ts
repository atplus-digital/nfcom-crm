import z from "zod";
import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";

const TipoFaturamentoEnum = z.enum([
	"parceiro",
	"via-parceiro",
	"cofaturamento",
	"cliente-final",
]);

export type TipoFaturamento = z.infer<typeof TipoFaturamentoEnum>;

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
	client: z.custom<Cliente>(),
	total: z.number(),
	totalLines: z.number(),
	lines: z.array(ProcessedLineSchema),
	groupedLines: z.array(GroupedLineSchema),
});

const PartnerInvoiceSchema = z.object({
	partner: z.custom<Parceiro>(),
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

export type ProcessedLine = z.infer<typeof ProcessedLineSchema>;
export type GroupedLine = z.infer<typeof GroupedLineSchema>;
export type GroupedService = z.infer<typeof GroupedServiceSchema>;

export type ClientDetailBase = z.infer<typeof ClientDetailSchema>;
export type PartnerInvoiceBase = z.infer<typeof PartnerInvoiceSchema>;
export type InvoicePartnerBase = z.infer<typeof InvoicePartnerSchema>;

export interface ClientDetail extends Omit<ClientDetailBase, "client"> {
	readonly client: Cliente;
}

export interface PartnerInvoice extends Omit<PartnerInvoiceBase, "partner"> {
	readonly partner: Parceiro;
}

export interface InvoicePartner
	extends Omit<InvoicePartnerBase, "partner" | "clients"> {
	readonly partner: PartnerInvoice;
	readonly clients: ClientDetail[];
}

export interface CalculateInvoiceParams {
	readonly partnerId: string | number;
	readonly referenceDate: string;
	readonly billingType?: TipoFaturamento;
}

export {
	TipoFaturamentoEnum,
	ProcessedLineSchema,
	GroupedLineSchema,
	GroupedServiceSchema,
	ClientDetailSchema,
	PartnerInvoiceSchema,
	InvoicePartnerSchema,
};
