import type {
	CalculateInvoiceParams,
	InvoicePartner,
} from "../invoice.schemas";

export interface InvoiceCalculatorService {
	calculate(params: CalculateInvoiceParams): Promise<InvoicePartner>;
}
