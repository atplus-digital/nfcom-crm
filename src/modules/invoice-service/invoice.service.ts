import { atacadoRepository } from "@/modules/atacado-repository/wholesale.repository";
import { InvoiceCalculator } from "./invoice-calculator/invoice-calculator";

const invoiceService = new InvoiceCalculator(atacadoRepository);

export { invoiceService };
