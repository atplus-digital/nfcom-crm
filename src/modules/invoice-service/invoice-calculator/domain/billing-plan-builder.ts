import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type {
	BillingChargePlan,
	BillingItem,
	BillingNotePlan,
	BillingParticipant,
	ClientDetail,
	GroupedService,
	TipoFaturamento,
} from "@/modules/invoice-service/invoice.schemas";

interface BillingPlanParams {
	readonly billingType: TipoFaturamento;
	readonly partner: Parceiro;
	readonly clients: readonly ClientDetail[];
	readonly groupedServices: readonly GroupedService[];
	readonly invoiceTotal: number;
}

const resolvePartnerName = (partner: Parceiro): string => {
	return partner.f_razao_social || partner.f_fantasia || "";
};

const resolveClientName = (client: Cliente): string => {
	return client.f_nome_razao || client.f_fantasia || "";
};

const toBillingItemsFromGroupedServices = (
	groupedServices: readonly GroupedService[],
): BillingItem[] => {
	return groupedServices.map((service) => ({
		planId: service.planId,
		description: service.description,
		unitPrice: service.unitPrice,
		quantity: service.quantity,
		total: service.total,
	}));
};

const toBillingItemsFromClient = (client: ClientDetail): BillingItem[] => {
	return client.groupedLines.map((line) => ({
		planId: line.planId,
		description: line.description,
		unitPrice: line.unitPrice,
		quantity: line.quantity,
		total: line.total,
	}));
};

const buildPartnerParticipant = (partner: Parceiro): BillingParticipant => ({
	type: "partner",
	id: partner.id ?? 0,
	name: resolvePartnerName(partner),
	document: partner.f_cnpj || "",
	email: partner.f_email_faturamento || "",
});

const buildClientParticipant = (client: Cliente): BillingParticipant => ({
	type: "client",
	id: client.id ?? 0,
	name: resolveClientName(client),
	document: client.f_cpf_cnpj || "",
	email: client.f_email || "",
});

const buildPartnerNotePlan = (
	partner: Parceiro,
	total: number,
	totalLines: number,
	groupedServices: readonly GroupedService[],
): BillingNotePlan => ({
	recipient: buildPartnerParticipant(partner),
	total,
	totalLines,
	items: toBillingItemsFromGroupedServices(groupedServices),
});

const buildClientNotePlan = (client: ClientDetail): BillingNotePlan => ({
	recipient: buildClientParticipant(client.client),
	total: client.total,
	totalLines: client.totalLines,
	items: toBillingItemsFromClient(client),
});

const buildPartnerCharge = (
	partner: Parceiro,
	invoiceTotal: number,
	noteRecipients: BillingNotePlan[],
): BillingChargePlan => ({
	chargeKey: "partner-charge",
	total: invoiceTotal,
	debtor: buildPartnerParticipant(partner),
	noteRecipients,
});

const buildClientCharge = (client: ClientDetail): BillingChargePlan => {
	const participant = buildClientParticipant(client.client);

	return {
		chargeKey: `client-charge-${participant.id}`,
		total: client.total,
		debtor: participant,
		noteRecipients: [buildClientNotePlan(client)],
	};
};

const createBillingCharges = ({
	billingType,
	partner,
	clients,
	groupedServices,
	invoiceTotal,
}: BillingPlanParams): BillingChargePlan[] => {
	switch (billingType) {
		case "parceiro":
			return [
				buildPartnerCharge(partner, invoiceTotal, [
					buildPartnerNotePlan(
						partner,
						invoiceTotal,
						clients.reduce((sum, client) => sum + client.totalLines, 0),
						groupedServices,
					),
				]),
			];
		case "via-parceiro":
		case "cofaturamento":
			return [
				buildPartnerCharge(
					partner,
					invoiceTotal,
					clients.map((client) => buildClientNotePlan(client)),
				),
			];
		case "cliente-final":
			return clients.map((client) => buildClientCharge(client));
		default:
			return [
				buildPartnerCharge(partner, invoiceTotal, [
					buildPartnerNotePlan(
						partner,
						invoiceTotal,
						clients.reduce((sum, client) => sum + client.totalLines, 0),
						groupedServices,
					),
				]),
			];
	}
};

const createBillingPlan = (params: BillingPlanParams) => ({
	billingType: params.billingType,
	charges: createBillingCharges(params),
});

export { createBillingPlan };
