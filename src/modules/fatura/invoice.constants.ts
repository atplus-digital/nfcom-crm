import type { TipoFaturamento } from "./invoice.schemas";
import type { BillingTypeConfig } from "./invoice.service.types";

export const DATES = {
	MIN_DAYS_TO_DUE_DATE: 6,
	DEFAULT_DUE_DAY: 10,
} as const;

export const BILLING_TYPE_CONFIG: Record<TipoFaturamento, BillingTypeConfig> = {
	parceiro: {
		allowsDirectClientBilling: false,
	},
	"via-parceiro": {
		allowsDirectClientBilling: false,
	},
	cofaturamento: {
		allowsDirectClientBilling: true,
	},
	"cliente-final": {
		allowsDirectClientBilling: true,
	},
};
