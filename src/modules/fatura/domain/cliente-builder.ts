import type { Cliente } from "@/@types/atacado/Cliente";
import type { LinhaProcessada, LinhaAgrupada, DetalheCliente } from "./types";
import { LinhaProcessor } from "./linha-processor";

class ClienteBuilder {
	static criarDetalheCliente(
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
}

export { ClienteBuilder };
