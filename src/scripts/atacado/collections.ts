interface HasRelation {
	collection: string;
	fkAlias?: string;
}

interface CollectionInput {
	collection: string;
	name: string;
	hasMany?: HasRelation[];
	hasOne?: HasRelation[];
}

export const COLLECTIONS: CollectionInput[] = [
	{
		collection: "t_nfcom_faturas",
		name: "Fatura",
		hasMany: [{ collection: "t_nfcom_cobrancas", fkAlias: "f_cobrancas" }],
	},
	{
		collection: "t_nfcom_cobrancas",
		name: "Cobranca",
		hasMany: [{ collection: "t_nfcom_notas", fkAlias: "f_notas_fiscais" }],
	},
	{
		collection: "t_nfcom_notas",
		name: "NFCom",
		hasMany: [{ collection: "t_nfcom_itens", fkAlias: "f_nota_itens" }],
	},
	{
		collection: "t_nfcom_itens",
		name: "ItemNFCom",
		hasOne: [{ collection: "t_nfcom_notas", fkAlias: "f_nota_fiscal" }],
	},
	{
		collection: "t_parceiros",
		name: "Parceiro",
		hasMany: [{ collection: "t_clientes", fkAlias: "f_usuarios" }],
	},
	{
		collection: "t_clientes",
		name: "Cliente",
		hasMany: [{ collection: "t_linhas_fixas", fkAlias: "f_linhas_fixas" }],
	},
	{
		collection: "t_linhas_fixas",
		name: "Servico",
	},
];
