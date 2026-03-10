import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { Result } from "@/shared/result";

interface ValidateAllParams<E> {
	readonly partner: Parceiro;
	readonly clients: readonly Cliente[];
	readonly validatePartner: (partner: Parceiro) => Result<void, E>;
	readonly validateClient: (client: Cliente) => Result<void, E>;
	readonly buildPartnerError: (partner: Parceiro, error: E) => Error;
	readonly buildClientError: (client: Cliente, error: E) => Error;
}

const runValidateAll = <E>(params: ValidateAllParams<E>): void => {
	const {
		partner,
		clients,
		validatePartner,
		validateClient,
		buildPartnerError,
		buildClientError,
	} = params;

	const partnerResult = validatePartner(partner);

	if (!partnerResult.success) {
		throw buildPartnerError(partner, partnerResult.error);
	}

	for (const client of clients) {
		const clientResult = validateClient(client);

		if (!clientResult.success) {
			throw buildClientError(client, clientResult.error);
		}
	}
};

export { runValidateAll };
