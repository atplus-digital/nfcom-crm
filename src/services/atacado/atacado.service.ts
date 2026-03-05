import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import { atacadoApi, atacadoRoutes } from "./atacado-api";
import { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";

export async function getParceiro(id: number | string): Promise<Parceiro> {
	const response = await atacadoApi.get<{ data: Parceiro }>(
		`${atacadoRoutes.parceiros}:get`,
		{
			params: {
				filterByTk: id,
			},
		}
	);
	return response.data.data;
}

export async function getActiveUsers(
	parceiroId: number | string
): Promise<Cliente[]> {
	const response = await atacadoApi.get<{ data: Cliente[] }>(
		`${atacadoRoutes.clientes}:list`,
		{
			params: {
				filterByTk: parceiroId,
				pageSize: 9999,
				filter: {
					f_fk_parceiro: parceiroId,
					"f_linhas_fixas.f_status": {
						$eq: 1,
					},
				},
				appends: ["f_linhas_fixas"],
			},
		}
	);
	return response.data.data;
}

export async function getPlanosDeServico(): Promise<PlanoDeServico[]> {
	const response = await atacadoApi.get<{ data: PlanoDeServico[] }>(
		`${atacadoRoutes.planosDeServico}:list`,
		{
			params: {
				pageSize: 9999,
			},
		}
	);
	return response.data.data;
}
