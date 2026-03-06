import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";
import type { TipoFaturamento } from "./schemas";

export interface InvoiceDataService {
	fetchInvoiceData(partnerId: string | number): Promise<{
		partner: Parceiro;
		clients: readonly Cliente[];
		plans: readonly PlanoDeServico[];
	}>;
}

export type BillingTypeConfig = {
	requiresPartnerValidation: boolean;
	allowsDirectClientBilling: boolean;
};

export const BILLING_TYPE_CONFIG: Record<TipoFaturamento, BillingTypeConfig> = {
	parceiro: {
		requiresPartnerValidation: true,
		allowsDirectClientBilling: false,
	},
	"via-parceiro": {
		requiresPartnerValidation: true,
		allowsDirectClientBilling: false,
	},
	cofaturamento: {
		requiresPartnerValidation: true,
		allowsDirectClientBilling: true,
	},
	"cliente-final": {
		requiresPartnerValidation: false,
		allowsDirectClientBilling: true,
	},
};
