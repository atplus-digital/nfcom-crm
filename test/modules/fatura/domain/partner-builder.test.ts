import type { Parceiro } from "@/@types/atacado/Parceiro";
import { createPartnerInvoice } from "@/modules/invoice-service/invoice-calculator/domain/partner-builder";

const mockParceiro: Parceiro = {
	id: 1,
	f_razao_social: "Empresa Teste LTDA",
	f_cnpj: "11222333000181",
	f_endereco: "Rua Teste",
	f_numero: "100",
	f_bairro: "Centro",
	f_cidade: "São Paulo",
	f_uf: "SP",
	f_cep: "01000000",
};

describe("createPartnerInvoice", () => {
	it("deve criar invoice do parceiro com dados corretos", () => {
		const result = createPartnerInvoice(mockParceiro, 1500, 10, 25);

		expect(result.partner).toBe(mockParceiro);
		expect(result.invoiceTotal).toBe(1500);
		expect(result.totalClients).toBe(10);
		expect(result.totalLines).toBe(25);
	});

	it("deve funcionar com valores zero", () => {
		const result = createPartnerInvoice(mockParceiro, 0, 0, 0);

		expect(result.invoiceTotal).toBe(0);
		expect(result.totalClients).toBe(0);
		expect(result.totalLines).toBe(0);
	});

	it("deve funcionar com valores grandes", () => {
		const result = createPartnerInvoice(mockParceiro, 999999.99, 500, 5000);

		expect(result.invoiceTotal).toBe(999999.99);
		expect(result.totalClients).toBe(500);
		expect(result.totalLines).toBe(5000);
	});
});
