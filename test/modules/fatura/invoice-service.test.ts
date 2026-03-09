jest.mock("@/env", () => ({
	env: {
		ATACADO_API_URL: "https://api.test.com",
		ATACADO_API_KEY: "test-api-key",
	},
}));

const mockFindParceiroById = jest.fn();
const mockFindClientesAtivos = jest.fn();
const mockFindAllPlanos = jest.fn();

jest.mock("@/modules/atacado/wholesale.repository", () => ({
	atacadoRepository: {
		findParceiroById: mockFindParceiroById,
		findClientesAtivosByParceiroId: mockFindClientesAtivos,
		findAllPlanosDeServico: mockFindAllPlanos,
	},
}));

import { AtacadoInvoiceDataService } from "@/modules/fatura/invoice.service";

describe("AtacadoInvoiceDataService", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("deve buscar partner, clients e plans em paralelo", async () => {
		const partner = { id: 1, f_razao_social: "Empresa" };
		const clients = [{ id: 10, f_nome_razao: "Cliente 1" }];
		const plans = [{ id: 4, f_nome: "Plano A" }];

		mockFindParceiroById.mockResolvedValue(partner);
		mockFindClientesAtivos.mockResolvedValue(clients);
		mockFindAllPlanos.mockResolvedValue(plans);

		const service = new AtacadoInvoiceDataService();
		const result = await service.fetchInvoiceData(1);

		expect(result).toEqual({ partner, clients, plans });
		expect(mockFindParceiroById).toHaveBeenCalledWith(1);
		expect(mockFindClientesAtivos).toHaveBeenCalledWith({
			partnerId: 1,
			activeLineStatus: true,
		});
		expect(mockFindAllPlanos).toHaveBeenCalled();
	});

	it("deve propagar erro quando findParceiroById falha", async () => {
		mockFindParceiroById.mockRejectedValue(new Error("Not Found"));
		mockFindClientesAtivos.mockResolvedValue([]);
		mockFindAllPlanos.mockResolvedValue([]);

		const service = new AtacadoInvoiceDataService();

		await expect(service.fetchInvoiceData(999)).rejects.toThrow("Not Found");
	});

	it("deve aceitar partnerId como string", async () => {
		const partner = { id: "abc", f_razao_social: "Empresa" };
		mockFindParceiroById.mockResolvedValue(partner);
		mockFindClientesAtivos.mockResolvedValue([]);
		mockFindAllPlanos.mockResolvedValue([]);

		const service = new AtacadoInvoiceDataService();
		const result = await service.fetchInvoiceData("abc");

		expect(result.partner).toEqual(partner);
		expect(mockFindParceiroById).toHaveBeenCalledWith("abc");
	});
});
