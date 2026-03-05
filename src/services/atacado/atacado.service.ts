import type { Cliente } from "@/@types/atacado/Cliente";
import type { Cobranca } from "@/@types/atacado/Cobranca";
import type { Fatura } from "@/@types/atacado/Fatura";
import type { ItemNFCom } from "@/@types/atacado/ItemNFCom";
import type { NFCom } from "@/@types/atacado/NFCom";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";

import { atacadoApi, atacadoRoutes } from "./atacado-api";

export async function getParceiro(id: number | string): Promise<Parceiro> {
	const response = await atacadoApi.get<{ data: Parceiro }>(
		`${atacadoRoutes.parceiros}:get`,
		{
			params: { filterByTk: id },
		},
	);
	return response.data.data;
}

export async function getActiveUsers(
	parceiroId: number | string,
): Promise<Cliente[]> {
	const response = await atacadoApi.get<{ data: Cliente[] }>(
		`${atacadoRoutes.clientes}:list`,
		{
			params: {
				filterByTk: parceiroId,
				pageSize: 9999,
				filter: {
					f_fk_parceiro: parceiroId,
					"f_linhas_fixas.f_status": { $eq: 1 },
				},
				appends: ["f_linhas_fixas"],
			},
		},
	);
	return response.data.data;
}

export async function getPlanosDeServico(): Promise<PlanoDeServico[]> {
	const response = await atacadoApi.get<{ data: PlanoDeServico[] }>(
		`${atacadoRoutes.planosDeServico}:list`,
		{
			params: { pageSize: 9999 },
		},
	);
	return response.data.data;
}

export async function createFatura(
	data: Omit<
		Fatura,
		"id" | "createdAt" | "updatedAt" | "createdById" | "updatedById"
	>,
): Promise<Fatura> {
	const response = await atacadoApi.post<{ data: Fatura }>(
		`${atacadoRoutes.faturas}:create`,
		data,
	);
	return response.data.data;
}

export async function createCobranca(
	data: Omit<
		Cobranca,
		"id" | "createdAt" | "updatedAt" | "createdById" | "updatedById"
	>,
): Promise<Cobranca> {
	const response = await atacadoApi.post<{ data: Cobranca }>(
		`${atacadoRoutes.cobrancas}:create`,
		data,
	);
	return response.data.data;
}

export async function createNFCom(
	cobrancaId: number | string,
	data: Omit<
		NFCom,
		"id" | "createdAt" | "updatedAt" | "createdById" | "updatedById"
	>,
): Promise<NFCom> {
	const response = await atacadoApi.post<{ data: NFCom }>(
		`${atacadoRoutes.cobrancas}/${cobrancaId}/f_notas_fiscais:create`,
		data,
	);
	return response.data.data;
}

export async function createItemNFCom(
	notaFiscalId: number | string,
	data: Omit<
		ItemNFCom,
		"id" | "createdAt" | "updatedAt" | "createdById" | "updatedById"
	>,
): Promise<ItemNFCom> {
	const response = await atacadoApi.post<{ data: ItemNFCom }>(
		`${atacadoRoutes.notasFiscais}/${notaFiscalId}/f_nota_itens:create`,
		data,
	);
	return response.data.data;
}
