import { atacadoRepository } from "@/modules/atacado-repository/wholesale.repository";
import { InvoiceService } from "./invoice-persistence.service";

const invoiceService = new InvoiceService(atacadoRepository);

export { invoiceService };
