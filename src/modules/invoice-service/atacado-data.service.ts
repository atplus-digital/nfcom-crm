import { atacadoRepository } from "@/modules/atacado-repository/wholesale.repository";
import type { InvoiceDataService } from "./invoice-data.service.types";

export class AtacadoDataService implements InvoiceDataService {
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
