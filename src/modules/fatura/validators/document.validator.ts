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

	validatePartner(partner: Parceiro): DocumentValidationResult {
		const cnpj = sanitizeDocument(partner.f_cnpj);

		if (!validateCNPJ(cnpj)) {
			return Failure({
				entity: partner.f_razao_social ?? "Parceiro",
				type: "CNPJ",
				message: `CNPJ do parceiro "${partner.f_razao_social}" (${partner.id}) é inválido`,
			});
		}

		return Success(undefined);
	},

	validateClient(client: Cliente): DocumentValidationResult {
		const document = sanitizeDocument(client.f_cpf_cnpj);
		const type = detectDocumentType(document);

		if (!validateDocument(document, type)) {
			return Failure({
				entity: client.f_nome_razao ?? "Cliente",
				type,
				message: `${type} do cliente "${client.f_nome_razao}" (${client.id}) é inválido`,
			});
		}

		return Success(undefined);
	},

	validateAll(partner: Parceiro, clients: readonly Cliente[]): void {
		const partnerResult = this.validatePartner(partner);

		if (!partnerResult.success) {
			throw DocumentValidationError.create(partnerResult.error.message);
		}

		for (const client of clients) {
			const clientResult = this.validateClient(client);

			if (!clientResult.success) {
				throw DocumentValidationError.create(clientResult.error.message);
			}
		}
	},
};

export { documentValidator };
