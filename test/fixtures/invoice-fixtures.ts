import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";
import type { Servico } from "@/@types/atacado/Servico";
import type { AtacadoRepository } from "@/modules/atacado-repository/wholesale.repository.types";

export const VALID_CNPJ = "11222333000181";
export const VALID_CPF = "52998224725";
export const INVALID_CNPJ = "00000000000000";
export const INVALID_CPF = "00000000000";

export const createParceiro = (overrides?: Partial<Parceiro>): Parceiro => ({
	id: 1,
	f_razao_social: "Empresa Teste",
	f_cnpj: VALID_CNPJ,
	f_endereco: "Rua Teste",
	f_numero: "100",
	f_bairro: "Centro",
	f_cidade: "São Paulo",
	f_uf: "SP",
	f_cep: "01000000",
	f_data_vencimento: 10,
	...overrides,
});

export const createServico = (overrides?: Partial<Servico>): Servico => ({
	id: 100,
	f_status: "1",
	f_coghzwfvcnx: 4,
	...overrides,
});

export const createCliente = (overrides?: Partial<Cliente>): Cliente => ({
	id: 10,
	f_nome_razao: "Cliente Teste",
	f_cpf_cnpj: VALID_CPF,
	f_endereco: "Rua Cliente",
	f_numero: "200",
	f_bairro: "Bairro",
	f_cidade: "São Paulo",
	f_uf: "SP",
	f_cep: "02000000",
	f_linhas_fixas: [createServico()],
	...overrides,
});

export const DEFAULT_PLANOS: PlanoDeServico[] = [
	{ id: 4, f_nome: "1 Linha - 1 Canal", f_assinatura_mensal: "3" },
	{ id: 5, f_nome: "1 Linha - 2 Canais", f_assinatura_mensal: "5" },
];

export const createMockRepository = (
	overrides?: Partial<{
		partner: Parceiro;
		clients: Cliente[];
		plans: PlanoDeServico[];
	}>,
): AtacadoRepository => ({
	findParceiroById: jest
		.fn()
		.mockResolvedValue(overrides?.partner ?? createParceiro()),
	findClientesAtivosByParceiroId: jest
		.fn()
		.mockResolvedValue(overrides?.clients ?? [createCliente()]),
	findAllPlanosDeServico: jest
		.fn()
		.mockResolvedValue(overrides?.plans ?? DEFAULT_PLANOS),
	createFatura: jest.fn(),
	createCobranca: jest.fn(),
	createNFCom: jest.fn(),
	createItemNFCom: jest.fn(),
});
