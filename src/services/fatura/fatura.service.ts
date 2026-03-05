import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";

import { atacadoApi, atacadoRoutes } from "../atacado/atacado-api";

// Constants
const LINHA_STATUS_ATIVA = "1";
const FK_PLANO_ID = "f_coghzwfvcnx";

// Types - Reutilizando tipos do @types/atacado
export interface LinhaProcessada {
	id: number | string;
	planoId: string | number;
	unitario: number;
	descricao: string;
}

export interface LinhaAgrupada extends LinhaProcessada {
	quantidade: number;
	total: number;
}

// Campos de endereço compartilhados entre Cliente e Parceiro
type EnderecoFields = Pick<
	Cliente,
	"f_endereco" | "f_numero" | "f_bairro" | "f_cidade" | "f_uf" | "f_cep"
>;

// Detalhe do Cliente reutilizando campos de Cliente
export interface DetalheCliente
	extends Pick<
			Cliente,
			| "id"
			| "f_nome_razao"
			| "f_cpf_cnpj"
			| "f_rg_ie"
			| "f_telefone"
			| "f_email"
		>,
		EnderecoFields {
	total: number;
	totalLinhas: number;
	linhas: LinhaProcessada[];
	linhasAgrupadas: LinhaAgrupada[];
}

export interface ServicoAgrupado {
	planoId: string | number;
	descricao: string;
	unitario: number;
	quantidade: number;
	total: number;
}

// Parceiro da Fatura reutilizando campos de Parceiro
export interface ParceiroFatura
	extends Pick<
			Parceiro,
			| "id"
			| "f_razao_social"
			| "f_cnpj"
			| "f_ie"
			| "f_telefone"
			| "f_email_faturamento"
		>,
		EnderecoFields {
	totalFatura: number;
	totalClientes: number;
	totalLinhas: number;
}

export interface FaturaParceiro {
	dataVencimento: string;
	totalFatura: number;
	totalLinhas: number;
	parceiro: ParceiroFatura;
	clientes: DetalheCliente[];
	servicosAgrupados: ServicoAgrupado[];
}

export interface CalcularFaturaParams {
	parceiroId: number | string;
	dataReferencia: string;
}

/**
 * Busca os dados de um parceiro pelo ID
 */
export async function getParceiro(id: number | string): Promise<Parceiro> {
	const response = await atacadoApi.get<{ data: Parceiro }>(
		`${atacadoRoutes.parceiros}:get`,
		{
			params: { filterByTk: id },
		},
	);

	if (!response.data.data) {
		throw new Error("Parceiro não encontrado.");
	}

	return response.data.data;
}

/**
 * Busca os clientes ativos de um parceiro
 */
export async function getClientesAtivos(
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

	const clientesAtivos = response.data.data;

	if (!clientesAtivos || clientesAtivos.length === 0) {
		throw new Error("Nenhum cliente ativo encontrado.");
	}

	return clientesAtivos;
}

/**
 * Busca todos os planos de serviço disponíveis
 */
export async function getPlanosDeServico(): Promise<PlanoDeServico[]> {
	const response = await atacadoApi.get<{ data: PlanoDeServico[] }>(
		`${atacadoRoutes.planosDeServico}:list`,
		{
			params: { pageSize: 9999 },
		},
	);

	const planos = response.data.data;

	if (!planos || planos.length === 0) {
		throw new Error("Nenhum plano encontrado.");
	}

	return planos;
}

/**
 * Busca um plano específico pelo ID
 */
export function getPlanoById(
	id: string | number | undefined,
	planos: PlanoDeServico[],
): PlanoDeServico {
	if (!id) {
		throw new Error("ID do plano é inválido.");
	}

	const plano = planos.find((p) => p.id === id);

	if (!plano) {
		throw new Error(`Plano com ID ${id} não encontrado.`);
	}

	return plano;
}

/**
 * Calcula a data de vencimento baseada na data de referência e dia de vencimento
 * Garante que o vencimento seja pelo menos 6 dias no futuro
 */
export function calcularVencimento(
	dataReferencia: string,
	diaVencimento: number,
): string {
	const hoje = new Date();
	const limite = new Date(hoje);
	limite.setDate(limite.getDate() + 6);

	const dataRef = new Date(`${dataReferencia}T00:00:00`);
	const ano = dataRef.getFullYear();
	const mes = dataRef.getMonth();

	let venc = new Date(ano, mes + 1, diaVencimento);

	if (venc < limite) {
		venc = new Date(limite);
	}

	return venc.toISOString().slice(0, 10);
}

/**
 * Processa as linhas fixas de um cliente, filtrando apenas as ativas
 * e calculando os valores
 */
export function processarLinhasCliente(
	cliente: Cliente,
	planos: PlanoDeServico[],
): { linhas: LinhaProcessada[]; total: number } {
	let total = 0;
	const linhas: LinhaProcessada[] = [];

	if (!cliente.f_linhas_fixas || cliente.f_linhas_fixas.length === 0) {
		throw new Error(
			`Cliente ${cliente.id} - ${cliente.f_nome_razao} não possui linhas fixas.`,
		);
	}

	for (const linha of cliente.f_linhas_fixas) {
		if (linha.f_status !== LINHA_STATUS_ATIVA) {
			continue;
		}

		const planoId = linha?.[FK_PLANO_ID as keyof typeof linha];
		const servico = getPlanoById(planoId, planos);
		const valorMensal = Number(servico.f_assinatura_mensal) || 0;

		if (valorMensal === 0 || servico.f_nome === "Cadastrar Plano no Fluxo") {
			throw new Error(
				`Plano com ID ${planoId} não encontrado ou inválido. ID Cliente: ${cliente.id} - ${cliente.f_nome_razao}`,
			);
		}

		if (valorMensal > 0) {
			linhas.push({
				id: linha.id ?? 0,
				planoId: planoId ?? 0,
				unitario: valorMensal,
				descricao: servico.f_nome ?? "",
			});
			total += valorMensal;
		}
	}

	return { linhas, total };
}

/**
 * Agrupa linhas por plano, somando quantidades e totais
 */
export function agruparLinhasPorPlano(
	linhas: LinhaProcessada[],
): LinhaAgrupada[] {
	const agrupadas = new Map<string | number, LinhaAgrupada>();

	for (const linha of linhas) {
		if (agrupadas.has(linha.planoId)) {
			const agrupada = agrupadas.get(linha.planoId);
			if (agrupada) {
				agrupada.quantidade += 1;
				agrupada.total += linha.unitario;
			}
		} else {
			agrupadas.set(linha.planoId, {
				...linha,
				quantidade: 1,
				total: linha.unitario,
			});
		}
	}

	return Array.from(agrupadas.values());
}

/**
 * Calcula todas as faturas de um parceiro
 * Busca dados, processa linhas dos clientes e agrupa serviços
 */
export async function calcularFaturasParceiro(
	params: CalcularFaturaParams,
): Promise<FaturaParceiro> {
	const { parceiroId, dataReferencia } = params;

	// Busca todos os dados necessários em paralelo
	const [parceiroRaw, clientes, planos] = await Promise.all([
		getParceiro(parceiroId),
		getClientesAtivos(parceiroId),
		getPlanosDeServico(),
	]);

	const todosOsServicos = new Map<
		string | number,
		{
			nome: string;
			custo: number;
			quantidade: number;
		}
	>();

	const diaVencimento = parceiroRaw.f_data_vencimento ?? 10;
	const dataVencimento = calcularVencimento(dataReferencia, diaVencimento);

	const fatura: FaturaParceiro = {
		dataVencimento,
		totalFatura: 0,
		totalLinhas: 0,
		parceiro: {
			id: parceiroRaw.id ?? 0,
			f_razao_social: parceiroRaw.f_razao_social ?? "",
			f_cnpj: parceiroRaw.f_cnpj ?? "",
			f_ie: parceiroRaw?.f_ie || "ISENTO",
			f_telefone: parceiroRaw.f_telefone?.toString() || "",
			f_email_faturamento: parceiroRaw.f_email_faturamento || "",
			f_endereco: parceiroRaw.f_endereco || "",
			f_numero: parceiroRaw.f_numero || "",
			f_bairro: parceiroRaw.f_bairro || "",
			f_cidade: parceiroRaw.f_cidade || "",
			f_uf: parceiroRaw.f_uf || "",
			f_cep: parceiroRaw.f_cep || "",
			totalFatura: 0,
			totalClientes: 0,
			totalLinhas: 0,
		},
		clientes: [],
		servicosAgrupados: [],
	};

	for (const cliente of clientes) {
		const linhasProcessadas = processarLinhasCliente(cliente, planos);

		if (linhasProcessadas.linhas.length > 0) {
			const linhasAgrupadas = agruparLinhasPorPlano(linhasProcessadas.linhas);

			const detalheCliente: DetalheCliente = {
				id: cliente.id ?? 0,
				f_nome_razao: cliente.f_nome_razao ?? "",
				f_cpf_cnpj: cliente.f_cpf_cnpj || "",
				f_rg_ie: cliente.f_rg_ie || "",
				f_telefone: cliente.f_telefone ?? "",
				f_email: cliente.f_email ?? "",
				f_endereco: cliente.f_endereco || "",
				f_numero: cliente.f_numero || "",
				f_bairro: cliente.f_bairro || "",
				f_cidade: cliente.f_cidade || "",
				f_uf: cliente.f_uf || "",
				f_cep: cliente.f_cep || "",
				total: linhasProcessadas.total,
				totalLinhas: linhasProcessadas.linhas.length,
				linhas: linhasProcessadas.linhas,
				linhasAgrupadas,
			};

			fatura.clientes.push(detalheCliente);
			fatura.totalFatura += linhasProcessadas.total;
			fatura.totalLinhas += linhasProcessadas.linhas.length;
			fatura.parceiro.totalClientes += 1;
			fatura.parceiro.totalLinhas += linhasProcessadas.linhas.length;

			for (const linha of linhasProcessadas.linhas) {
				if (todosOsServicos.has(linha.planoId)) {
					const servico = todosOsServicos.get(linha.planoId);
					if (servico) {
						servico.quantidade += 1;
					}
				} else {
					todosOsServicos.set(linha.planoId, {
						nome: linha.descricao,
						custo: linha.unitario,
						quantidade: 1,
					});
				}
			}
		}
	}

	fatura.parceiro.totalFatura = fatura.totalFatura;
	fatura.servicosAgrupados = Array.from(todosOsServicos.entries()).map(
		([planoId, servico]) => ({
			planoId,
			descricao: servico.nome,
			unitario: servico.custo,
			quantidade: servico.quantidade,
			total: servico.custo * servico.quantidade,
		}),
	);

	return fatura;
}
