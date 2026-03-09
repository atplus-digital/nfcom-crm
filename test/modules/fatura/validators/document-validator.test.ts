import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import { documentValidator } from "@/modules/fatura/validators/document.validator";
import { DocumentValidationError } from "@/shared/base.error";
import {
	INVALID_CNPJ,
	INVALID_CPF,
	VALID_CNPJ,
	VALID_CPF,
	createCliente,
	createParceiro,
} from "../../../fixtures/invoice-fixtures";

describe("documentValidator", () => {
	describe("validate", () => {
		it("deve retornar true para CPF válido", () => {
			expect(documentValidator.validate(VALID_CPF)).toBe(true);
		});

		it("deve retornar false para CPF inválido", () => {
			expect(documentValidator.validate(INVALID_CPF)).toBe(false);
		});

		it("deve retornar true para CNPJ válido", () => {
			expect(documentValidator.validate(VALID_CNPJ)).toBe(true);
		});

		it("deve retornar false para CNPJ inválido", () => {
			expect(documentValidator.validate(INVALID_CNPJ)).toBe(false);
		});

		it("deve sanitizar documento com caracteres não numéricos", () => {
			expect(documentValidator.validate("529.982.247-25")).toBe(true);
			expect(documentValidator.validate("11.222.333/0001-81")).toBe(true);
		});
	});

	describe("validatePartner", () => {
		it("deve retornar sucesso para CNPJ válido", () => {
			const parceiro = createParceiro();
			const result = documentValidator.validatePartner(parceiro);

			expect(result.success).toBe(true);
		});

		it("deve retornar falha para CNPJ inválido", () => {
			const parceiro = createParceiro({ f_cnpj: INVALID_CNPJ });
			const result = documentValidator.validatePartner(parceiro);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.type).toBe("CNPJ");
			}
		});

		it("deve retornar falha para CNPJ undefined", () => {
			const parceiro = createParceiro({
				f_cnpj: undefined,
			} as unknown as Parceiro);
			const result = documentValidator.validatePartner(parceiro);

			expect(result.success).toBe(false);
		});

		it("deve usar nome fallback quando f_razao_social é undefined", () => {
			const parceiro = createParceiro({
				f_razao_social: undefined,
				f_cnpj: INVALID_CNPJ,
			} as unknown as Parceiro);

			const result = documentValidator.validatePartner(parceiro);

			expect(result.success).toBe(false);

			if (!result.success) {
				expect(result.error.entity).toBe("Parceiro");
			}
		});
	});

	describe("validateClient", () => {
		it("deve retornar sucesso para CPF válido", () => {
			const cliente = createCliente();
			const result = documentValidator.validateClient(cliente);

			expect(result.success).toBe(true);
		});

		it("deve retornar falha para CPF inválido", () => {
			const cliente = createCliente({ f_cpf_cnpj: INVALID_CPF });
			const result = documentValidator.validateClient(cliente);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.type).toBe("CPF");
			}
		});

		it("deve validar cliente com CNPJ", () => {
			const cliente = createCliente({ f_cpf_cnpj: VALID_CNPJ });
			const result = documentValidator.validateClient(cliente);

			expect(result.success).toBe(true);
		});

		it("deve falhar para CNPJ inválido em cliente", () => {
			const cliente = createCliente({ f_cpf_cnpj: INVALID_CNPJ });
			const result = documentValidator.validateClient(cliente);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.type).toBe("CNPJ");
			}
		});

		it("deve usar nome fallback quando f_nome_razao é undefined", () => {
			const cliente = createCliente({
				f_nome_razao: undefined,
				f_cpf_cnpj: INVALID_CPF,
			} as unknown as Cliente);
			const result = documentValidator.validateClient(cliente);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.entity).toBe("Cliente");
			}
		});
	});

	describe("validateAll", () => {
		it("deve passar quando todos os documentos são válidos", () => {
			const parceiro = createParceiro();
			const clientes = [createCliente()];

			expect(() =>
				documentValidator.validateAll(parceiro, clientes),
			).not.toThrow();
		});

		it("deve lançar DocumentValidationError para parceiro inválido", () => {
			const parceiro = createParceiro({ f_cnpj: INVALID_CNPJ });
			const clientes = [createCliente()];

			expect(() => documentValidator.validateAll(parceiro, clientes)).toThrow(
				DocumentValidationError,
			);
		});

		it("deve lançar DocumentValidationError para cliente inválido", () => {
			const parceiro = createParceiro();
			const clientes = [createCliente({ f_cpf_cnpj: INVALID_CPF })];

			expect(() => documentValidator.validateAll(parceiro, clientes)).toThrow(
				DocumentValidationError,
			);
		});

		it("deve validar múltiplos clientes", () => {
			const parceiro = createParceiro();
			const clientes = [createCliente({ id: 1 }), createCliente({ id: 2 })];

			expect(() =>
				documentValidator.validateAll(parceiro, clientes),
			).not.toThrow();
		});
	});
});
