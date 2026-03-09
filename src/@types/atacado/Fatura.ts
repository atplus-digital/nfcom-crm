import type { Cobranca } from "./Cobranca";
import type { Parceiro } from "./Parceiro";

export interface Fatura {
	f_data_referencia: string;
	f_valor_total: string;
	f_status: string;
	f_fk_parceiro: number;
	f_tipo_de_faturamento: string;
	f_data_vencimento: string;

	f_parceiro?: Parceiro;
	f_cobrancas?: Cobranca[];

	id?: number;
	createdAt?: string;
	updatedAt?: string;
	createdById?: number;
	updatedById?: number;
}
