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

const BillingParticipantSchema = z.object({
	type: z.enum(["partner", "client"]),
	id: z.union([z.string(), z.number()]),
	name: z.string(),
	document: z.string(),
	email: z.string(),
});

const BillingItemSchema = z.object({
	planId: z.union([z.string(), z.number()]),
	description: z.string(),
	unitPrice: z.number(),
	quantity: z.number(),
	total: z.number(),
});

const BillingNotePlanSchema = z.object({
	recipient: BillingParticipantSchema,
	total: z.number(),
	totalLines: z.number(),
	items: z.array(BillingItemSchema),
});

const BillingChargePlanSchema = z.object({
	chargeKey: z.string(),
	total: z.number(),
	debtor: BillingParticipantSchema,
	noteRecipients: z.array(BillingNotePlanSchema),
});

const BillingPlanSchema = z.object({
	billingType: TipoFaturamentoEnum,
	charges: z.array(BillingChargePlanSchema),
});

const InvoicePartnerSchema = z.object({
	dueDate: z.string(),
	invoiceTotal: z.number(),
	totalLines: z.number(),
	partner: PartnerInvoiceSchema,
	clients: z.array(ClientDetailSchema),
	groupedServices: z.array(GroupedServiceSchema),
	billingPlan: BillingPlanSchema,
});

export type ProcessedLine = z.infer<typeof ProcessedLineSchema>;
export type GroupedLine = z.infer<typeof GroupedLineSchema>;
export type GroupedService = z.infer<typeof GroupedServiceSchema>;
export type BillingParticipant = z.infer<typeof BillingParticipantSchema>;
export type BillingItem = z.infer<typeof BillingItemSchema>;
export type BillingNotePlan = z.infer<typeof BillingNotePlanSchema>;
export type BillingChargePlan = z.infer<typeof BillingChargePlanSchema>;
export type BillingPlan = z.infer<typeof BillingPlanSchema>;

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

export interface PersistInvoiceSummary {
	readonly totalClientes: number;
	readonly totalLinhas: number;
	readonly valorTotal: number;
}

export interface PersistedFatura {
	readonly id: number;
	readonly f_status: "criada";
	readonly f_data_referencia: string;
	readonly f_data_vencimento: string;
	readonly f_valor_total: string;
	readonly f_tipo_de_faturamento: string;
}

export interface PersistedCobranca {
	readonly id: number;
	readonly f_valor_total: string;
	readonly f_nome_devedor: string;
	readonly f_status: "a-emitir";
}

export interface PersistedNotaFiscal {
	readonly id: number;
	readonly f_nome: string;
	readonly f_cpfcnpj: string;
	readonly f_status_interno: "a-emitir";
	readonly f_fk_cobranca: number;
}

export interface PersistInvoiceData {
	readonly fatura: PersistedFatura;
	readonly cobrancas: PersistedCobranca[];
	readonly notasFiscais: PersistedNotaFiscal[];
}

export interface PersistInvoiceResult {
	readonly dateStr: string;
	readonly billingType: TipoFaturamento;
	readonly resumo: PersistInvoiceSummary;
	readonly data: PersistInvoiceData;
}

export type BillingTypeConfig = {
	allowsDirectClientBilling: boolean;
};

export {
	TipoFaturamentoEnum,
	ProcessedLineSchema,
	GroupedLineSchema,
	GroupedServiceSchema,
	InvoicePartnerSchema,
};
