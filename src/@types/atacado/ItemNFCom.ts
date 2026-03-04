import type { NFCom } from "./NFCom";

export interface ItemNFCom {
	id?: number;
	createdAt?: string;
	updatedAt?: string;
	createdById?: number;
	updatedById?: number;
	f_fk_nota_fiscal?: number;
	f_item?: number;
	f_descricao?: string;
	f_cclass?: string;
	f_cfop?: string;
	f_quantidade?: number;
	f_unitario?: string;
	f_total?: string;
	f_bc_icms?: string;
	f_codigo?: string;
	f_incide_aliquota?: string;
	f_icms?: string;
	f_aliq_icms?: string;
	f_nota_fiscal?: NFCom;
}
