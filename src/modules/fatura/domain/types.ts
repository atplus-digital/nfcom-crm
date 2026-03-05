import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";

interface LinhaProcessada {
	readonly id: string | number;
	readonly planoId: string | number;
	readonly unitario: number;
	readonly descricao: string;
}

interface LinhaAgrupada extends LinhaProcessada {
	readonly quantidade: number;
	readonly total: number;
}

interface ServicoAgrupado {
	readonly planoId: string | number;
	readonly descricao: string;
	readonly unitario: number;
	readonly quantidade: number;
	readonly total: number;
}

interface DetalheCliente {
	readonly cliente: Cliente;
	readonly total: number;
	readonly totalLinhas: number;
	readonly linhas: readonly LinhaProcessada[];
	readonly linhasAgrupadas: readonly LinhaAgrupada[];
}

interface ParceiroFatura {
	readonly parceiro: Parceiro;
	readonly totalFatura: number;
	readonly totalClientes: number;
	readonly totalLinhas: number;
}

interface FaturaParceiro {
	readonly dataVencimento: string;
	readonly totalFatura: number;
	readonly totalLinhas: number;
	readonly parceiro: ParceiroFatura;
	readonly clientes: readonly DetalheCliente[];
	readonly servicosAgrupados: readonly ServicoAgrupado[];
}

interface CalcularFaturaParams {
	readonly parceiroId: string | number;
	readonly dataReferencia: string;
}

export type {
	LinhaProcessada,
	LinhaAgrupada,
	ServicoAgrupado,
	DetalheCliente,
	ParceiroFatura,
	FaturaParceiro,
	CalcularFaturaParams,
};
