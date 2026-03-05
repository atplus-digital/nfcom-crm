import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import {
	REQUIRED_CLIENT_FIELDS,
	REQUIRED_PARTNER_FIELDS,
} from "../constants/campos-obrigatorios";
import type { EntityValidationResult, InvalidField } from "../types/validation";

const isEmptyValue = (valor: unknown): boolean => {
	return (
		!valor ||
		(typeof valor === "string" && valor.trim() === "") ||
		(typeof valor === "string" && valor.trim().toLowerCase() === "nan")
	);
};

const validateRequiredFields = (
	entity: Record<string, unknown>,
	fields: readonly { campo: string; label: string }[],
): InvalidField[] => {
	const invalidFields: InvalidField[] = [];

	for (const { campo, label } of fields) {
		const valor = entity[campo];
		if (isEmptyValue(valor)) {
			invalidFields.push({ campo, label });
		}
	}

	return invalidFields;
};

export const validateCliente = (
	cliente: Record<string, unknown>,
	id: string | number,
): EntityValidationResult => {
	const invalidFields = validateRequiredFields(cliente, REQUIRED_CLIENT_FIELDS);

	return {
		id,
		name: (cliente.f_nome_razao as string) || "Sem nome",
		valid: invalidFields.length === 0,
		invalidFields,
	};
};

export const validateParceiro = (
	parceiro: Record<string, unknown>,
	id: string | number,
): EntityValidationResult => {
	const invalidFields = validateRequiredFields(
		parceiro,
		REQUIRED_PARTNER_FIELDS,
	);

	return {
		id,
		name: (parceiro.f_razao_social as string) || "Sem nome",
		valid: invalidFields.length === 0,
		invalidFields,
	};
};

// ============================================
// Main validation functions
// ============================================
export const validateRegistrationData = (
	parceiro: Parceiro,
	clientes: Cliente[],
) => {
	const partnerResult = validateParceiro(
		parceiro as unknown as Record<string, unknown>,
		parceiro.id ?? 0,
	);
	const clientResults = clientes.map(cliente =>
		validateCliente(
			cliente as unknown as Record<string, unknown>,
			cliente.id ?? 0,
		),
	);

	const invalidClients = clientResults.filter(r => !r.valid);

	if (!partnerResult.valid) {
		const campos = partnerResult.invalidFields.map(c => c.label).join(", ");
		throw new Error(`Dados do parceiro inválidos: ${campos}`);
	}

	const firstInvalidClient = invalidClients?.[0];
	if (firstInvalidClient) {
		const campos = firstInvalidClient.invalidFields
			.map(ci => ci.label)
			.join(", ");
		const mensagem = `Cliente "${firstInvalidClient.name}" (${firstInvalidClient.id}) com dados inválidos: ${campos}`;
		const additionalError =
			invalidClients.length > 1
				? ` e mais ${invalidClients.length - 1} erro(s)`
				: "";
		throw new Error(`${mensagem}${additionalError}`);
	}

	return { success: true };
};
