jest.mock("@/env", () => ({
	env: {
		ATACADO_API_URL: "https://api.test.com",
		ATACADO_API_KEY: "test-api-key",
	},
}));

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock("@/modules/atacado-repository/http-client/atacado-http-client", () => ({
	atacadoHttpClient: { get: mockGet, post: mockPost },
	ATACADO_ROUTES: {
		parceiros: "/t_parceiros",
		clientes: "/t_clientes",
		planosDeServico: "/t_planos_de_servico",
		faturas: "/t_nfcom_faturas",
		cobrancas: "/t_nfcom_cobrancas",
		notasFiscais: "/t_nfcom_notas",
	},
}));

import { atacadoRepository } from "@/modules/atacado-repository/wholesale.repository";
import { NotFoundError } from "@/shared/base.error";

describe("AtacadoApiRepository", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("findParceiroById", () => {
		it("deve retornar parceiro quando encontrado", async () => {
			const parceiro = { id: 1, f_razao_social: "Empresa Teste" };
			mockGet.mockResolvedValue({ data: parceiro });

			const result = await atacadoRepository.findParceiroById(1);

			expect(result).toEqual(parceiro);
			expect(mockGet).toHaveBeenCalledWith(
				"/t_parceiros:get",
				expect.objectContaining({
					params: { filterByTk: 1 },
				}),
			);
		});

		it("deve lançar NotFoundError quando parceiro não encontrado", async () => {
			mockGet.mockResolvedValue({ data: null });

			await expect(atacadoRepository.findParceiroById(999)).rejects.toThrow(
				NotFoundError,
			);
		});

		it("deve aceitar id como string", async () => {
			const parceiro = { id: "abc", f_razao_social: "Teste" };
			mockGet.mockResolvedValue({ data: parceiro });

			const result = await atacadoRepository.findParceiroById("abc");

			expect(result).toEqual(parceiro);
		});

		it("deve aceitar id como número", async () => {
			const parceiro = { id: 123, f_razao_social: "Teste" };
			mockGet.mockResolvedValue({ data: parceiro });

			const result = await atacadoRepository.findParceiroById(123);

			expect(result).toEqual(parceiro);
		});
	});

	describe("findClientesAtivosByParceiroId", () => {
		it("deve retornar clientes ativos com filtro de status", async () => {
			const clientes = [{ id: 10, f_nome_razao: "Cliente 1" }];
			mockGet.mockResolvedValue({ data: clientes });

			const result = await atacadoRepository.findClientesAtivosByParceiroId({
				partnerId: 1,
				activeLineStatus: true,
			});

			expect(result).toEqual(clientes);
			expect(mockGet).toHaveBeenCalledWith(
				"/t_clientes:list",
				expect.objectContaining({
					params: expect.objectContaining({
						filterByTk: 1,
						filter: expect.objectContaining({
							f_fk_parceiro: 1,
							"f_linhas_fixas.f_status": { $eq: 1 },
						}),
						appends: ["f_linhas_fixas"],
					}),
				}),
			);
		});

		it("deve buscar sem filtro de status quando activeLineStatus é false", async () => {
			const clientes = [{ id: 10 }];
			mockGet.mockResolvedValue({ data: clientes });

			const result = await atacadoRepository.findClientesAtivosByParceiroId({
				partnerId: 1,
				activeLineStatus: false,
			});

			expect(result).toEqual(clientes);
			expect(mockGet).toHaveBeenCalledWith(
				"/t_clientes:list",
				expect.objectContaining({
					params: expect.not.objectContaining({
						filter: expect.anything(),
					}),
				}),
			);
		});

		it("deve retornar array vazio quando data é null", async () => {
			mockGet.mockResolvedValue({ data: null });

			const result = await atacadoRepository.findClientesAtivosByParceiroId({
				partnerId: 1,
			});

			expect(result).toEqual([]);
		});
	});

	describe("findAllPlanosDeServico", () => {
		it("deve retornar todos os planos de serviço", async () => {
			const planos = [{ id: 4, f_nome: "Plano A", f_assinatura_mensal: "3" }];
			mockGet.mockResolvedValue({ data: planos });

			const result = await atacadoRepository.findAllPlanosDeServico();

			expect(result).toEqual(planos);
			expect(mockGet).toHaveBeenCalledWith(
				"/t_planos_de_servico:list",
				expect.objectContaining({
					params: expect.objectContaining({ pageSize: 9999 }),
				}),
			);
		});

		it("deve retornar array vazio quando data é null", async () => {
			mockGet.mockResolvedValue({ data: null });

			const result = await atacadoRepository.findAllPlanosDeServico();

			expect(result).toEqual([]);
		});
	});

	describe("createFatura", () => {
		it("deve criar fatura e retornar dados", async () => {
			const fatura = { id: 1, f_parceiro: 1 };
			mockPost.mockResolvedValue({ data: fatura });

			const input = {
				f_data_referencia: "2026-03-01",
				f_valor_total: "100.00",
				f_status: "pendente",
				f_fk_parceiro: 1,
				f_tipo_de_faturamento: "mensal",
				f_data_vencimento: "2026-03-10",
			};
			const result = await atacadoRepository.createFatura(input);

			expect(result).toEqual(fatura);
			expect(mockPost).toHaveBeenCalledWith("/t_nfcom_faturas:create", input);
		});
	});

	describe("createCobranca", () => {
		it("deve criar cobrança e retornar dados", async () => {
			const cobranca = { id: 1 };
			mockPost.mockResolvedValue({ data: cobranca });

			const input = {
				f_data_vencimento: "2026-03-10",
				f_valor_total: "100.00",
				f_status: "pendente",
				f_nome_devedor: "Cliente Teste",
				f_email_devedor: "cliente@teste.com",
				f_documento_devedor: "12345678901",
				f_id_externo: "EXT-001",
				f_descricao: "Cobrança de teste",
			};
			const result = await atacadoRepository.createCobranca(input);

			expect(result).toEqual(cobranca);
			expect(mockPost).toHaveBeenCalledWith("/t_nfcom_cobrancas:create", input);
		});
	});

	describe("createNFCom", () => {
		it("deve criar NFCom vinculada à cobrança", async () => {
			const nfcom = { id: 1 };
			mockPost.mockResolvedValue({ data: nfcom });

			const input = {
				f_nome: "Cliente NFCom",
				f_cpfcnpj: "12345678901",
				f_rgie: "123456789",
				f_endereco: "Rua Teste",
				f_endereco_numero: "123",
				f_bairro: "Centro",
				f_cidade: "São Paulo",
				f_uf: "SP",
				f_cep: "01234567",
				f_telefone: "11999999999",
				f_email: "nfcom@teste.com",
			};
			const result = await atacadoRepository.createNFCom(5, input);

			expect(result).toEqual(nfcom);
			expect(mockPost).toHaveBeenCalledWith(
				"/t_nfcom_cobrancas/5/f_notas_fiscais:create",
				input,
			);
		});
	});

	describe("createItemNFCom", () => {
		it("deve criar item vinculado à nota fiscal", async () => {
			const item = { id: 1 };
			mockPost.mockResolvedValue({ data: item });

			const input = {
				f_item: 1,
				f_descricao: "Item de teste",
				f_cclass: "0101",
				f_cfop: "5102",
				f_quantidade: 1,
				f_unitario: "100.00",
				f_total: "100.00",
			};
			const result = await atacadoRepository.createItemNFCom(10, input);

			expect(result).toEqual(item);
			expect(mockPost).toHaveBeenCalledWith(
				"/t_nfcom_notas/10/f_nota_itens:create",
				input,
			);
		});
	});
});
