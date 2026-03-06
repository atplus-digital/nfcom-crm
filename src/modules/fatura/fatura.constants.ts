import type { TipoFaturamento } from "./fatura.schemas";
import type { BillingTypeConfig } from "./fatura.service.types";

export const DATES = {
	MIN_DAYS_TO_DUE_DATE: 6,
	DEFAULT_DUE_DAY: 10,
} as const;

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
