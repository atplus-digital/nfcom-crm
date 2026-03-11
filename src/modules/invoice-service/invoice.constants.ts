import type { BillingTypeConfig, TipoFaturamento } from "./invoice.schemas";

export const DATES = {
	MIN_DAYS_TO_DUE_DATE: 6,
	DEFAULT_DUE_DAY: 10,
} as const;

// TODO: substituir defaults quando a origem oficial de CFOP/classificação fiscal for definida.
export const DEFAULT_CFOP = "0";
export const DEFAULT_CCLASS = "0";

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
