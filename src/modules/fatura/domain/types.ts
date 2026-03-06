import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type {
	ClientDetail as ClientDetailBase,
	GroupedLine,
	GroupedService,
	InvoicePartner as InvoicePartnerBase,
	PartnerInvoice as PartnerInvoiceBase,
	ProcessedLine,
	TipoFaturamento,
} from "@/routes/prepara-fatura/prepara-fatura.schemas";

interface ClientDetail extends Omit<ClientDetailBase, "client"> {
	readonly client: Cliente;
}

interface PartnerInvoice extends Omit<PartnerInvoiceBase, "partner"> {
	readonly partner: Parceiro;
}

interface InvoicePartner
	extends Omit<InvoicePartnerBase, "partner" | "clients"> {
	readonly partner: PartnerInvoice;
	readonly clients: ClientDetail[];
}

interface CalculateInvoiceParams {
	readonly partnerId: string | number;
	readonly referenceDate: string;
	readonly billingType?: TipoFaturamento;
}

export type {
	ProcessedLine,
	GroupedLine,
	GroupedService,
	ClientDetail,
	PartnerInvoice,
	InvoicePartner,
	CalculateInvoiceParams,
	TipoFaturamento,
};
