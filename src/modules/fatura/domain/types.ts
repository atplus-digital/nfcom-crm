import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";

interface ProcessedLine {
	readonly id: string | number;
	readonly planId: string | number;
	readonly unitPrice: number;
	readonly description: string;
}

interface GroupedLine extends ProcessedLine {
	readonly quantity: number;
	readonly total: number;
}

interface GroupedService {
	readonly planId: string | number;
	readonly description: string;
	readonly unitPrice: number;
	readonly quantity: number;
	readonly total: number;
}

interface ClientDetail {
	readonly client: Cliente;
	readonly total: number;
	readonly totalLines: number;
	readonly lines: readonly ProcessedLine[];
	readonly groupedLines: readonly GroupedLine[];
}

interface PartnerInvoice {
	readonly partner: Parceiro;
	readonly invoiceTotal: number;
	readonly totalClients: number;
	readonly totalLines: number;
}

interface InvoicePartner {
	readonly dueDate: string;
	readonly invoiceTotal: number;
	readonly totalLines: number;
	readonly partner: PartnerInvoice;
	readonly clients: readonly ClientDetail[];
	readonly groupedServices: readonly GroupedService[];
}

interface CalculateInvoiceParams {
	readonly partnerId: string | number;
	readonly referenceDate: string;
}

export type {
	ProcessedLine,
	GroupedLine,
	GroupedService,
	ClientDetail,
	PartnerInvoice,
	InvoicePartner,
	CalculateInvoiceParams,
};
