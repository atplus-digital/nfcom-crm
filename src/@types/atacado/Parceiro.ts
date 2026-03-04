import type { Cliente } from "./Cliente";
import type { PlanoDeServico } from "./PlanoDeServico";

export interface Parceiro {
	f_cidade?: string;
	f_endereco?: string;
	f_id_asaas?: string;
	f_contratossippulse?: string;
	f_email_faturamento?: string;
	updatedAt?: string;
	f_razao_social?: string;
	f_fantasia?: string;
	f_cep?: string;
	f_data_vencimento?: number;
	f_ie?: string;
	f_ip_encaminhamento?: string;
	f_cnpj?: string;
	f_uf?: string;
	id?: number;
	f_bairro?: string;
	f_numero?: string;
	createdAt?: string;
	f_telefone?: string;
	f_fk_usuarios?: number;
	f_fk_planos_servico?: number;
	updatedById?: number;
	createdById?: number;
	f_usuarios?: Cliente[];
	f_planos_de_servico?: PlanoDeServico[];
}
