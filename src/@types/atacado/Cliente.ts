import type { Parceiro } from "./Parceiro";

export interface Cliente {
	f_fk_servicos_adicionais?: number;
	f_area_local?: string;
	f_cpf_cnpj?: string;
	f_telefone?: string;
	f_nome_razao?: string;
	f_cidade?: string;
	id?: number;
	f_tipo_assinante?: string;
	f_endereco?: string;
	f_cep?: string;
	f_fantasia?: string;
	f_email?: string;
	f_rg_ie?: string;
	updatedAt?: string;
	f_codigo_area_local?: string;
	f_codigo_cnl?: string;
	createdAt?: string;
	f_numero?: string;
	f_bairro?: string;
	f_fk_parceiro?: number;
	f_parceiro?: Parceiro;
	f_uf?: string;
	updatedById?: number;
	createdById?: number;
}
