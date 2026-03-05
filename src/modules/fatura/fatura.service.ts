import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { Cliente } from "@/@types/atacado/Cliente";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";
import { atacadoRepository } from "@/modules/atacado/atacado.repository";
import { NotFoundError } from "@/infra/http/base.error";
import { documentValidator } from "@/modules/fatura/validators/document.validator";
import { entityValidator } from "@/modules/fatura/validators/entity.validator";
import { DateCalculator } from "./domain/date-calculator";
import { LinhaProcessor } from "./domain/linha-processor";
import { ClienteBuilder } from "./domain/cliente-builder";
import { ParceiroBuilder } from "./domain/parceiro-builder";
import { DATES } from "./constants";
import type {
	FaturaParceiro,
	CalcularFaturaParams,
	DetalheCliente,
} from "./domain/types";

interface FaturaDataService {
	buscarDadosFatura(parceiroId: string | number): Promise<{
		parceiro: Parceiro;
		clientes: readonly Cliente[];
		planos: readonly PlanoDeServico[];
	}>;
}

class AtacadoFaturaDataService implements FaturaDataService {
	async buscarDadosFatura(parceiroId: string | number) {
		const [parceiro, clientes, planos] = await Promise.all([
			atacadoRepository.findParceiroById(parceiroId),
			atacadoRepository.findClientesAtivosByParceiroId({
				parceiroId,
				linhaStatusAtiva: true,
			}),
			atacadoRepository.findAllPlanosDeServico(),
		]);

		return { parceiro, clientes, planos };
	}
}

class FaturaCalculator {
	private readonly dataService: FaturaDataService;

	constructor(dataService: FaturaDataService) {
		this.dataService = dataService;
	}

	async calcular(params: CalcularFaturaParams): Promise<FaturaParceiro> {
		const { parceiroId, dataReferencia } = params;

		const { parceiro, clientes, planos } =
			await this.dataService.buscarDadosFatura(parceiroId);

		this.validarDados(parceiro, clientes, planos);

		const linhaProcessor = LinhaProcessor.create(planos);
		const clientesProcessados = this.processarClientes(
			clientes,
			linhaProcessor,
		);

		const totalFatura = this.calcularTotal(clientesProcessados);
		const totalLinhas = this.calcularTotalLinhas(clientesProcessados);
		const dataVencimento = this.calcularDataVencimento(
			parceiro,
			dataReferencia,
		);
		const servicosAgrupados =
			LinhaProcessor.agruparServicos(clientesProcessados);

		const parceiroFatura = ParceiroBuilder.criarFaturaParceiro(
			parceiro,
			totalFatura,
			clientesProcessados.length,
			totalLinhas,
		);

		return {
			dataVencimento,
			totalFatura,
			totalLinhas,
			parceiro: parceiroFatura,
			clientes: clientesProcessados,
			servicosAgrupados,
		};
	}

	private validarDados(
		parceiro: Parceiro,
		clientes: readonly Cliente[],
		planos: readonly PlanoDeServico[],
	): void {
		if (clientes.length === 0) {
			throw NotFoundError.create("Clientes ativos", parceiro.id ?? 0);
		}

		if (planos.length === 0) {
			throw NotFoundError.create("Planos de serviço", "");
		}

		entityValidator.validateAll(parceiro, clientes);
		documentValidator.validateAll(parceiro, clientes);
	}

	private processarClientes(
		clientes: readonly Cliente[],
		linhaProcessor: LinhaProcessor,
	): DetalheCliente[] {
		const processados: DetalheCliente[] = [];

		for (const cliente of clientes) {
			const { linhas, total } = linhaProcessor.processarLinhasCliente(cliente);

			if (linhas.length > 0) {
				processados.push(
					ClienteBuilder.criarDetalheCliente(cliente, linhas, total),
				);
			}
		}

		return processados;
	}

	private calcularTotal(clientes: readonly DetalheCliente[]): number {
		return clientes.reduce((sum, c) => sum + c.total, 0);
	}

	private calcularTotalLinhas(clientes: readonly DetalheCliente[]): number {
		return clientes.reduce((sum, c) => sum + c.totalLinhas, 0);
	}

	private calcularDataVencimento(
		parceiro: Parceiro,
		dataReferencia: string,
	): string {
		const diaVencimento = parceiro.f_data_vencimento ?? DATES.DEFAULT_DUE_DAY;
		return DateCalculator.calcularVencimento(dataReferencia, diaVencimento);
	}
}

const faturaService = new FaturaCalculator(new AtacadoFaturaDataService());

export { faturaService, FaturaCalculator, AtacadoFaturaDataService };
