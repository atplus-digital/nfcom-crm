import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { ParceiroFatura } from "./types";

function criarFaturaParceiro(
	parceiro: Parceiro,
	totalFatura: number,
	totalClientes: number,
	totalLinhas: number,
): ParceiroFatura {
	return {
		parceiro,
		totalFatura,
		totalClientes,
		totalLinhas,
	};
}

export { criarFaturaParceiro };
