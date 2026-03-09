import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import { documentValidator } from "@/modules/fatura/validators/document.validator";
import { DocumentValidationError } from "@/shared/base.error";

const validCNPJ = "11222333000181";
const invalidCNPJ = "00000000000000";
const validCPF = "52998224725";
const invalidCPF = "00000000000";

const createParceiro = (overrides?: Partial<Parceiro>): Parceiro => ({
	id: 1,
	f_razao_social: "Empresa Teste",
	f_cnpj: validCNPJ,
	f_endereco: "Rua Teste",
	f_numero: "100",
	f_bairro: "Centro",
	f_cidade: "São Paulo",
	f_uf: "SP",
	f_cep: "01000000",
	...overrides,
});

const createCliente = (overrides?: Partial<Cliente>): Cliente => ({
	id: 1,
	f_nome_razao: "Cliente Teste",
	f_cpf_cnpj: validCPF,
	f_endereco: "Rua Cliente",
	f_numero: "200",
	f_bairro: "Bairro",
	f_cidade: "São Paulo",
	f_uf: "SP",
	f_cep: "02000000",
	...overrides,
});

describe("documentValidator", () => {
	describe("validate", () => {
		it("deve retornar true para CPF válido", () => {
			expect(documentValidator.validate(validCPF)).toBe(true);
		});

		it("deve retornar false para CPF inválido", () => {
			expect(documentValidator.validate(invalidCPF)).toBe(false);
		});

		it("deve retornar true para CNPJ válido", () => {
			expect(documentValidator.validate(validCNPJ)).toBe(true);
		});

		it("deve retornar false para CNPJ inválido", () => {
			expect(documentValidator.validate(invalidCNPJ)).toBe(false);
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
			const parceiro = createParceiro({ f_cnpj: invalidCNPJ });
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
	});

	describe("validateClient", () => {
		it("deve retornar sucesso para CPF válido", () => {
			const cliente = createCliente();
			const result = documentValidator.validateClient(cliente);

			expect(result.success).toBe(true);
		});

		it("deve retornar falha para CPF inválido", () => {
			const cliente = createCliente({ f_cpf_cnpj: invalidCPF });
			const result = documentValidator.validateClient(cliente);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.type).toBe("CPF");
			}
		});

		it("deve validar cliente com CNPJ", () => {
			const cliente = createCliente({ f_cpf_cnpj: validCNPJ });
			const result = documentValidator.validateClient(cliente);

			expect(result.success).toBe(true);
		});

		it("deve falhar para CNPJ inválido em cliente", () => {
			const cliente = createCliente({ f_cpf_cnpj: invalidCNPJ });
			const result = documentValidator.validateClient(cliente);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.type).toBe("CNPJ");
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
			const parceiro = createParceiro({ f_cnpj: invalidCNPJ });
			const clientes = [createCliente()];

			expect(() => documentValidator.validateAll(parceiro, clientes)).toThrow(
				DocumentValidationError,
			);
		});

		it("deve lançar DocumentValidationError para cliente inválido", () => {
			const parceiro = createParceiro();
			const clientes = [createCliente({ f_cpf_cnpj: invalidCPF })];

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
