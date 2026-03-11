import type { Fatura } from "./Fatura";
import type { NFCom } from "./NFCom";

export interface Cobranca {
	f_data_vencimento: string;
	f_valor_total: string;
	f_status: string;
	f_nome_devedor: string;
	f_email_devedor: string;
	f_documento_devedor: string;
	f_descricao: string;

	f_id_externo?: string;
	f_link_fatura?: string;
	f_fk_fatura?: number;
	f_fatura?: Fatura;
	f_data_emissao?: string;
	f_notas_fiscais?: NFCom[];

	id?: number;
	createdAt?: string;
	updatedAt?: string;
	createdById?: number;
	updatedById?: number;
}
