import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { Result } from "@/shared/result";

interface ValidateAllParams<P, C, E> {
	readonly partner: Parceiro;
	readonly clients: readonly Cliente[];
	readonly validatePartner: (partner: P) => Result<void, E>;
	readonly validateClient: (client: C) => Result<void, E>;
	readonly buildPartnerError: (partner: Parceiro, error: E) => Error;
	readonly buildClientError: (client: Cliente, error: E) => Error;
}

const runValidateAll = <P, C, E>(params: ValidateAllParams<P, C, E>): void => {
	const {
		partner,
		clients,
		validatePartner,
		validateClient,
		buildPartnerError,
		buildClientError,
	} = params;

	const partnerResult = validatePartner(partner as P);

	if (!partnerResult.success) {
		throw buildPartnerError(partner, partnerResult.error);
	}

	for (const client of clients) {
		const clientResult = validateClient(client as C);

		if (!clientResult.success) {
			throw buildClientError(client, clientResult.error);
		}
	}
};

export { runValidateAll };
