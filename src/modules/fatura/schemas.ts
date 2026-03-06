import z from "zod";
import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";

/**
 * Enum representing the types of billing available in the system.
 */
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

// Domain types with proper entity typing
export type ProcessedLine = z.infer<typeof ProcessedLineSchema>;
export type GroupedLine = z.infer<typeof GroupedLineSchema>;
export type GroupedService = z.infer<typeof GroupedServiceSchema>;

/**
 * Base types from schemas (with unknown for client/partner)
 */
export type ClientDetailBase = z.infer<typeof ClientDetailSchema>;
export type PartnerInvoiceBase = z.infer<typeof PartnerInvoiceSchema>;
export type InvoicePartnerBase = z.infer<typeof InvoicePartnerSchema>;

/**
 * Domain types with proper entity typing (with Cliente/Parceiro instead of unknown)
 */
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

// Re-export all schemas for convenience
export {
	TipoFaturamentoEnum,
	ProcessedLineSchema,
	GroupedLineSchema,
	GroupedServiceSchema,
	ClientDetailSchema,
	PartnerInvoiceSchema,
	InvoicePartnerSchema,
};
