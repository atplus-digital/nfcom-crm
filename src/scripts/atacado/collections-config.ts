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
	},
	{
		collection: "t_nfcom_cobrancas",
		name: "Cobranca",
	},
	{
		collection: "t_nfcom_notas",
		name: "NFCom",
		hasMany: [{ collection: "t_nfcom_itens", fkAlias: "f_nota_fiscal" }],
	},
	{
		collection: "t_nfcom_itens",
		name: "ItemNFCom",
	},
	{
		collection: "t_parceiros",
		name: "Parceiro",
		hasMany: [{ collection: "t_clientes", fkAlias: "f_usuarios" }],
	},
	{
		collection: "t_clientes",
		name: "Cliente",
	},
];
