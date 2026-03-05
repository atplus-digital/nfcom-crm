import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { ParceiroFatura } from "./types";

class ParceiroBuilder {
	static criarFaturaParceiro(
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
}

export { ParceiroBuilder };
