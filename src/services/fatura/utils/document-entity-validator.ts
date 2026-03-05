import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import { validateCPF, validateCNPJ } from "./document-validator";

export const validateDocuments = (parceiro: Parceiro, clientes: Cliente[]) => {
	const mensagens: string[] = [];

	if (!validateCNPJ(parceiro.f_cnpj ?? "")) {
		mensagens.push(
			`CNPJ do parceiro "${parceiro.f_razao_social}" (${parceiro.id}) é inválido.`,
		);
	}

	const invalidClients = clientes.filter(
		(cliente) => !validateCPF(cliente.f_cpf_cnpj ?? ""),
	);

	invalidClients.forEach((cliente) => {
		mensagens.push(
			`CPF/CNPJ do cliente "${cliente.f_nome_razao}" (${cliente.id}) é inválido.`,
		);
	});

	if (mensagens.length > 0) {
		const errorMessage = `${mensagens[0]}${mensagens.length > 1 ? ` e mais ${mensagens.length - 1} erro(s)` : ""}`;
		throw new Error(errorMessage);
	}

	return { success: true };
};
