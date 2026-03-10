import { atacadoRepository } from "@/modules/atacado-repository/wholesale.repository";
import type { InvoiceDataService } from "./invoice.service.types";
import { InvoiceCalculator } from "./invoice-calculator";

class AtacadoInvoiceDataService implements InvoiceDataService {
	async fetchInvoiceData(partnerId: string | number) {
		const [partner, clients, plans] = await Promise.all([
			atacadoRepository.findParceiroById(partnerId),
			atacadoRepository.findClientesAtivosByParceiroId({
				partnerId: partnerId,
				activeLineStatus: true,
			}),
			atacadoRepository.findAllPlanosDeServico(),
		]);

		return { partner, clients, plans };
	}
}

const invoiceService = new InvoiceCalculator(new AtacadoInvoiceDataService());

export { AtacadoInvoiceDataService, InvoiceCalculator, invoiceService };
