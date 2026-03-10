import { ATACADO_ROUTES } from "@/modules/atacado-repository/http-client/atacado.routes";

describe("atacado.routes", () => {
	it("deve ter as rotas corretas", () => {
		expect(ATACADO_ROUTES.parceiros).toBe("/t_parceiros");
		expect(ATACADO_ROUTES.clientes).toBe("/t_clientes");
		expect(ATACADO_ROUTES.planosDeServico).toBe("/t_planos_de_servico");
		expect(ATACADO_ROUTES.faturas).toBe("/t_nfcom_faturas");
		expect(ATACADO_ROUTES.cobrancas).toBe("/t_nfcom_cobrancas");
		expect(ATACADO_ROUTES.notasFiscais).toBe("/t_nfcom_notas");
	});
});
