import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import { EntityValidationError, type FieldError } from "@/shared/base.error";
import { Failure, type Result, Success } from "@/shared/result";

type ValidationResult = Result<void, FieldError[]>;

interface RequiredField {
	readonly field: string;
	readonly label: string;
}

const REQUIRED_PARTNER_FIELDS: readonly RequiredField[] = [
	{ field: "f_razao_social", label: "Razão Social" },
	{ field: "f_cnpj", label: "CNPJ" },
	{ field: "f_endereco", label: "Endereço" },
	{ field: "f_numero", label: "Número" },
	{ field: "f_bairro", label: "Bairro" },
	{ field: "f_cidade", label: "Cidade" },
	{ field: "f_uf", label: "UF" },
	{ field: "f_cep", label: "CEP" },
] as const;

const REQUIRED_CLIENT_FIELDS: readonly RequiredField[] = [
	{ field: "f_nome_razao", label: "Nome/Razão Social" },
	{ field: "f_cpf_cnpj", label: "CPF/CNPJ" },
	{ field: "f_endereco", label: "Endereço" },
	{ field: "f_numero", label: "Número" },
	{ field: "f_bairro", label: "Bairro" },
	{ field: "f_cidade", label: "Cidade" },
	{ field: "f_uf", label: "UF" },
	{ field: "f_cep", label: "CEP" },
] as const;

const isEmptyValue = (value: unknown): boolean => {
	return (
		!value ||
		(typeof value === "string" && value.trim() === "") ||
		(typeof value === "string" && value.trim().toLowerCase() === "nan")
	);
};

const validateEntity = (
	entity: Record<string, unknown>,
	requiredFields: readonly RequiredField[],
): ValidationResult => {
	const errors = requiredFields
		.filter(({ field }) => isEmptyValue(entity[field]))
		.map(({ field, label }) => ({ field, label }));

	if (errors.length === 0) {
		return Success(undefined);
	}
	return Failure(errors);
};

const entityValidator = {
	validateParceiro(parceiro: Parceiro): ValidationResult {
		return validateEntity(
			parceiro as Record<string, unknown>,
			REQUIRED_PARTNER_FIELDS,
		);
	},

	validateCliente(cliente: Cliente): ValidationResult {
		return validateEntity(
			cliente as Record<string, unknown>,
			REQUIRED_CLIENT_FIELDS,
		);
	},

	validateAll(parceiro: Parceiro, clientes: readonly Cliente[]): void {
		const parceiroResult = this.validateParceiro(parceiro);

		if (!parceiroResult.success) {
			throw EntityValidationError.create(
				"Parceiro",
				parceiro.id ?? 0,
				parceiroResult.error,
			);
		}

		for (const cliente of clientes) {
			const clienteResult = this.validateCliente(cliente);

			if (!clienteResult.success) {
				throw EntityValidationError.create(
					`Cliente "${cliente.f_nome_razao}"`,
					cliente.id ?? 0,
					clienteResult.error,
				);
			}
		}
	},
};

export { entityValidator };
