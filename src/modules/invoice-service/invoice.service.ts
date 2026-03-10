import { AtacadoDataService } from "./atacado-data.service";
import type { InvoiceDataService } from "./invoice-data.service.types";
import type { InvoiceCalculatorService } from "./invoice-calculator";
import { InvoiceCalculator } from "./invoice-calculator";

function createInvoiceService(
	dataService: InvoiceDataService,
): InvoiceCalculatorService {
	return new InvoiceCalculator(dataService);
}

const invoiceService = createInvoiceService(new AtacadoDataService());

export {
	AtacadoDataService,
	createInvoiceService,
	InvoiceCalculator,
	invoiceService,
};

export type { InvoiceCalculatorService, InvoiceDataService };
