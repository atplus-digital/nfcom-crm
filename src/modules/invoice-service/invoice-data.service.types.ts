import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";

export interface InvoiceDataService {
	fetchInvoiceData(partnerId: string | number): Promise<{
		partner: Parceiro;
		clients: readonly Cliente[];
		plans: readonly PlanoDeServico[];
	}>;
}

export type BillingTypeConfig = {
	allowsDirectClientBilling: boolean;
};
