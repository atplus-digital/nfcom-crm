import * as cpfCnpjValidator from "cpf-cnpj-validator";
import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import { DocumentValidationError } from "@/shared/base.error";
import { Failure, type Result, Success } from "@/shared/result";

type DocumentType = "CPF" | "CNPJ";

interface DocumentError {
	readonly entity: string;
	readonly type: DocumentType;
	readonly message: string;
}

type DocumentValidationResult = Result<void, DocumentError>;

const validateCPF = (document: string): boolean =>
	cpfCnpjValidator.cpf.isValid(document);

const validateCNPJ = (document: string): boolean =>
	cpfCnpjValidator.cnpj.isValid(document);

const detectDocumentType = (document: string): DocumentType =>
	document.length <= 11 ? "CPF" : "CNPJ";

const validateDocument = (document: string, type: DocumentType): boolean =>
	type === "CNPJ" ? validateCNPJ(document) : validateCPF(document);

const sanitizeDocument = (document: string | undefined): string =>
	(document ?? "").replace(/\D/g, "");

const documentValidator = {
	validate(document: string): boolean {
		const sanitized = sanitizeDocument(document);
		const type = detectDocumentType(sanitized);
		return validateDocument(sanitized, type);
	},

	validateParceiro(parceiro: Parceiro): DocumentValidationResult {
		const cnpj = sanitizeDocument(parceiro.f_cnpj);

		if (!validateCNPJ(cnpj)) {
			return Failure({
				entity: parceiro.f_razao_social ?? "Parceiro",
				type: "CNPJ",
				message: `CNPJ do parceiro "${parceiro.f_razao_social}" (${parceiro.id}) é inválido`,
			});
		}

		return Success(undefined);
	},

	validateCliente(cliente: Cliente): DocumentValidationResult {
		const documento = sanitizeDocument(cliente.f_cpf_cnpj);
		const type = detectDocumentType(documento);

		if (!validateDocument(documento, type)) {
			return Failure({
				entity: cliente.f_nome_razao ?? "Cliente",
				type,
				message: `${type} do cliente "${cliente.f_nome_razao}" (${cliente.id}) é inválido`,
			});
		}

		return Success(undefined);
	},

	validateAll(parceiro: Parceiro, clientes: readonly Cliente[]): void {
		const parceiroResult = this.validateParceiro(parceiro);

		if (!parceiroResult.success) {
			throw DocumentValidationError.create(parceiroResult.error.message);
		}

		for (const cliente of clientes) {
			const clienteResult = this.validateCliente(cliente);

			if (!clienteResult.success) {
				throw DocumentValidationError.create(clienteResult.error.message);
			}
		}
	},
};

export { documentValidator };
