import type { Cliente } from "@/@types/atacado/Cliente";
import { LinhaProcessor } from "./linha-processor";
import type { DetalheCliente, LinhaProcessada } from "./types";

function criarDetalheCliente(
	cliente: Cliente,
	linhas: readonly LinhaProcessada[],
	total: number,
): DetalheCliente {
	const linhasAgrupadas = LinhaProcessor.agruparLinhasPorPlano(linhas);

	return {
		cliente,
		total,
		totalLinhas: linhas.length,
		linhas,
		linhasAgrupadas,
	};
}

export { criarDetalheCliente };
