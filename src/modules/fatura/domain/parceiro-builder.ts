import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { PartnerInvoice } from "../schemas";

function createPartnerInvoice(
	partner: Parceiro,
	invoiceTotal: number,
	totalClients: number,
	totalLines: number,
): PartnerInvoice {
	return {
		partner,
		invoiceTotal,
		totalClients,
		totalLines,
	};
}

export { createPartnerInvoice };
