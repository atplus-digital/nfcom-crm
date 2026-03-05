import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";

type ValidateEntity<T> = Array<{
	campo: keyof T;
	label: string;
}>;

export const REQUIRED_PARTNER_FIELDS: ValidateEntity<Parceiro> = [
	{ campo: "f_razao_social", label: "Razão Social" },
	{ campo: "f_cnpj", label: "CNPJ" },
	{ campo: "f_endereco", label: "Endereço" },
	{ campo: "f_numero", label: "Número" },
	{ campo: "f_bairro", label: "Bairro" },
	{ campo: "f_cidade", label: "Cidade" },
	{ campo: "f_uf", label: "UF" },
	{ campo: "f_cep", label: "CEP" },
] as const;

export const REQUIRED_CLIENT_FIELDS: ValidateEntity<Cliente> = [
	{ campo: "f_nome_razao", label: "Nome/Razão Social" },
	{ campo: "f_cpf_cnpj", label: "CPF/CNPJ" },
	{ campo: "f_endereco", label: "Endereço" },
	{ campo: "f_numero", label: "Número" },
	{ campo: "f_bairro", label: "Bairro" },
	{ campo: "f_cidade", label: "Cidade" },
	{ campo: "f_uf", label: "UF" },
	{ campo: "f_cep", label: "CEP" },
] as const;
