import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { AtacadoRepository } from "@/modules/atacado-repository/wholesale.repository.types";
import {
	DEFAULT_CCLASS,
	DEFAULT_CFOP,
} from "@/modules/invoice-service/invoice.constants";
import { BusinessRuleError, ExternalApiError } from "@/shared/base.error";
import type {
	CalculateInvoiceParams,
	ClientDetail,
	InvoicePartner,
	PersistInvoiceResult,
} from "./invoice.schemas";
import { InvoiceCalculator } from "./invoice-calculator/invoice-calculator";

const MONTHS_PT_BR = [
	"Jan",
	"Fev",
	"Mar",
	"Abr",
	"Mai",
	"Jun",
	"Jul",
	"Ago",
	"Set",
	"Out",
	"Nov",
	"Dez",
] as const;

const resolveMonthReference = (referenceDate: string): string => {
	const date = new Date(`${referenceDate}T00:00:00.000Z`);
	const month = MONTHS_PT_BR[date.getUTCMonth()];
	const year = date.getUTCFullYear();
	return `${month}/${year}`;
};

const formatCurrency = (value: number): string => value.toFixed(2);

const ensureEntityId = (entityName: string, id: number | undefined): number => {
	if (id === undefined) {
		throw ExternalApiError.create(
			"Atacado",
			`Resposta sem id ao criar ${entityName}`,
		);
	}

	return id;
};

const resolveName = (
	preferred: string | undefined,
	fallback: string | undefined,
) => preferred || fallback || "";

type PersistenceStep =
	| "createFatura"
	| "createCobranca"
	| "createNFCom"
	| "createItemNFCom";

interface PersistedEntities {
	faturaId: number | undefined;
	cobrancaIds: number[];
	nfComIds: number[];
	itemNfComIds: number[];
}

interface RollbackResult {
	readonly revertedFaturas: readonly number[];
	readonly revertedCobrancas: readonly number[];
	readonly revertedNfComs: readonly number[];
	readonly revertedItemNfComs: readonly number[];
	readonly rollbackErrors: readonly string[];
}

const resolveErrorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : "Erro desconhecido";

class InvoiceService {
	private readonly calculator: InvoiceCalculator;

	constructor(private readonly repository: AtacadoRepository) {
		this.calculator = new InvoiceCalculator(repository);
	}

	calculate(params: CalculateInvoiceParams): Promise<InvoicePartner> {
		return this.calculator.calculate(params);
	}

	async calculateAndPersist({
		partnerId,
		referenceDate,
		billingType = "parceiro",
	}: CalculateInvoiceParams): Promise<PersistInvoiceResult> {
		const calculatedInvoice = await this.calculator.calculate({
			partnerId,
			referenceDate,
			billingType,
		});

		const partnerIdAsNumber =
			typeof partnerId === "number" ? partnerId : Number(partnerId);

		if (Number.isNaN(partnerIdAsNumber)) {
			throw BusinessRuleError.create("partnerId inválido para persistência", {
				resource: "Fatura",
				identifier: partnerId,
			});
		}

		const persistedEntities: PersistedEntities = {
			faturaId: undefined,
			cobrancaIds: [],
			nfComIds: [],
			itemNfComIds: [],
		};
		let failedStep: PersistenceStep | undefined;

		try {
			failedStep = "createFatura";
			const fatura = await this.repository.createFatura({
				f_data_referencia: referenceDate,
				f_valor_total: formatCurrency(calculatedInvoice.invoiceTotal),
				f_status: "criada",
				f_fk_parceiro: partnerIdAsNumber,
				f_tipo_de_faturamento: billingType,
				f_data_vencimento: calculatedInvoice.dueDate,
			});

			const faturaId = ensureEntityId("fatura", fatura.id);
			persistedEntities.faturaId = faturaId;
			const cobrancasPersistidas: PersistInvoiceResult["data"]["cobrancas"] =
				[];
			const notasPersistidas: PersistInvoiceResult["data"]["notasFiscais"] = [];

			for (const charge of calculatedInvoice.billingPlan.charges) {
				failedStep = "createCobranca";
				const cobranca = await this.repository.createCobranca({
					f_data_vencimento: calculatedInvoice.dueDate,
					f_valor_total: formatCurrency(charge.total),
					f_status: "a-emitir",
					f_nome_devedor: charge.debtor.name,
					f_email_devedor: charge.debtor.email,
					f_documento_devedor: charge.debtor.document,
					f_descricao: `Descrição dos itens da cobrança - ${resolveMonthReference(referenceDate)}`,
					f_fk_fatura: faturaId,
				});

				const cobrancaId = ensureEntityId("cobrança", cobranca.id);
				persistedEntities.cobrancaIds.push(cobrancaId);

				cobrancasPersistidas.push({
					id: cobrancaId,
					f_valor_total: cobranca.f_valor_total,
					f_nome_devedor: cobranca.f_nome_devedor,
					f_status: "a-emitir",
				});

				for (const noteRecipient of charge.noteRecipients) {
					const recipientData = this.resolveRecipientData(
						calculatedInvoice.clients,
						calculatedInvoice.partner.partner,
						noteRecipient.recipient.type,
						noteRecipient.recipient.id,
					);

					failedStep = "createNFCom";
					const nfCom = await this.repository.createNFCom(cobrancaId, {
						f_nome: recipientData.name,
						f_cpfcnpj: recipientData.document,
						f_rgie: recipientData.rgie,
						f_endereco: recipientData.address,
						f_endereco_numero: recipientData.addressNumber,
						f_bairro: recipientData.district,
						f_cidade: recipientData.city,
						f_uf: recipientData.state,
						f_cep: recipientData.zipCode,
						f_telefone: recipientData.phone,
						f_email: recipientData.email,
						f_status_interno: "a-emitir",
					});

					const nfComId = ensureEntityId("NFCom", nfCom.id);
					persistedEntities.nfComIds.push(nfComId);

					notasPersistidas.push({
						id: nfComId,
						f_nome: nfCom.f_nome,
						f_cpfcnpj: nfCom.f_cpfcnpj,
						f_status_interno: "a-emitir",
						f_fk_cobranca: cobrancaId,
					});

					for (const [index, item] of noteRecipient.items.entries()) {
						failedStep = "createItemNFCom";
						const itemNfCom = await this.repository.createItemNFCom(nfComId, {
							f_fk_nota_fiscal: nfComId,
							f_item: index + 1,
							f_descricao: item.description,
							f_cclass: DEFAULT_CCLASS,
							f_cfop: DEFAULT_CFOP,
							f_quantidade: item.quantity,
							f_unitario: formatCurrency(item.unitPrice),
							f_total: formatCurrency(item.total),
						});

						const itemNfComId = ensureEntityId("item NFCom", itemNfCom.id);
						persistedEntities.itemNfComIds.push(itemNfComId);
					}
				}
			}

			return {
				dateStr: referenceDate,
				billingType,
				resumo: {
					totalClientes: calculatedInvoice.partner.totalClients,
					totalLinhas: calculatedInvoice.totalLines,
					valorTotal: calculatedInvoice.invoiceTotal,
				},
				data: {
					fatura: {
						id: faturaId,
						f_status: "criada",
						f_data_referencia: fatura.f_data_referencia,
						f_data_vencimento: fatura.f_data_vencimento,
						f_valor_total: fatura.f_valor_total,
						f_tipo_de_faturamento: fatura.f_tipo_de_faturamento,
					},
					cobrancas: cobrancasPersistidas,
					notasFiscais: notasPersistidas,
				},
			};
		} catch (error) {
			if (!failedStep) {
				throw error;
			}

			const rollbackResult =
				await this.rollbackPersistedData(persistedEntities);
			const rollbackSummary = [
				`itens=${rollbackResult.revertedItemNfComs.length} [${rollbackResult.revertedItemNfComs.join(",")}]`,
				`notas=${rollbackResult.revertedNfComs.length} [${rollbackResult.revertedNfComs.join(",")}]`,
				`cobrancas=${rollbackResult.revertedCobrancas.length} [${rollbackResult.revertedCobrancas.join(",")}]`,
				`faturas=${rollbackResult.revertedFaturas.length} [${rollbackResult.revertedFaturas.join(",")}]`,
			].join("; ");
			const rollbackErrors =
				rollbackResult.rollbackErrors.length > 0
					? `; erros_rollback=${rollbackResult.rollbackErrors.join(", ")}`
					: "";

			throw ExternalApiError.create(
				"Atacado",
				`Falha na etapa ${failedStep}: ${resolveErrorMessage(error)}; rollback=${rollbackSummary}${rollbackErrors}`,
			);
		}
	}

	private async rollbackPersistedData(
		persistedEntities: PersistedEntities,
	): Promise<RollbackResult> {
		const revertedItemNfComs: number[] = [];
		const revertedNfComs: number[] = [];
		const revertedCobrancas: number[] = [];
		const revertedFaturas: number[] = [];
		const rollbackErrors: string[] = [];

		const deleteInReverseOrder = async (
			ids: readonly number[],
			deleteFunction: (id: number) => Promise<void>,
			revertedIds: number[],
			label: string,
		): Promise<void> => {
			for (const id of [...ids].reverse()) {
				try {
					await deleteFunction(id);
					revertedIds.push(id);
				} catch (error) {
					rollbackErrors.push(`${label}:${id} (${resolveErrorMessage(error)})`);
				}
			}
		};

		await deleteInReverseOrder(
			persistedEntities.itemNfComIds,
			(id) => this.repository.deleteItemNFCom(id),
			revertedItemNfComs,
			"itemNFCom",
		);
		await deleteInReverseOrder(
			persistedEntities.nfComIds,
			(id) => this.repository.deleteNFCom(id),
			revertedNfComs,
			"NFCom",
		);
		await deleteInReverseOrder(
			persistedEntities.cobrancaIds,
			(id) => this.repository.deleteCobranca(id),
			revertedCobrancas,
			"cobranca",
		);

		if (persistedEntities.faturaId !== undefined) {
			try {
				await this.repository.deleteFatura(persistedEntities.faturaId);
				revertedFaturas.push(persistedEntities.faturaId);
			} catch (error) {
				rollbackErrors.push(
					`fatura:${persistedEntities.faturaId} (${resolveErrorMessage(error)})`,
				);
			}
		}

		return {
			revertedFaturas,
			revertedCobrancas,
			revertedNfComs,
			revertedItemNfComs,
			rollbackErrors,
		};
	}

	private resolveRecipientData(
		clients: readonly ClientDetail[],
		partner: Parceiro,
		recipientType: "partner" | "client",
		recipientId: string | number,
	): {
		readonly name: string;
		readonly document: string;
		readonly rgie: string;
		readonly address: string;
		readonly addressNumber: string;
		readonly district: string;
		readonly city: string;
		readonly state: string;
		readonly zipCode: string;
		readonly phone: string;
		readonly email: string;
	} {
		if (recipientType === "partner") {
			return {
				name: resolveName(partner.f_razao_social, partner.f_fantasia),
				document: partner.f_cnpj || "",
				rgie: partner.f_ie || "",
				address: partner.f_endereco || "",
				addressNumber: partner.f_numero || "",
				district: partner.f_bairro || "",
				city: partner.f_cidade || "",
				state: partner.f_uf || "",
				zipCode: partner.f_cep || "",
				phone: partner.f_telefone || "",
				email: partner.f_email_faturamento || "",
			};
		}

		const matchedClient = clients.find(
			(client) => client.client.id === Number(recipientId),
		);

		if (!matchedClient) {
			throw BusinessRuleError.create(
				`Cliente ${recipientId} não encontrado para persistência da NFCom`,
				{ resource: "Cliente", identifier: recipientId },
			);
		}

		const client = matchedClient.client;

		return {
			name: resolveName(client.f_nome_razao, client.f_fantasia),
			document: client.f_cpf_cnpj || "",
			rgie: client.f_rg_ie || "",
			address: client.f_endereco || "",
			addressNumber: client.f_numero || "",
			district: client.f_bairro || "",
			city: client.f_cidade || "",
			state: client.f_uf || "",
			zipCode: client.f_cep || "",
			phone: client.f_telefone || "",
			email: client.f_email || "",
		};
	}
}

export { InvoiceService };
