import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import { entityValidator } from "@/modules/fatura/validators/entity.validator";
import { EntityValidationError } from "@/shared/base.error";

const createValidParceiro = (overrides?: Partial<Parceiro>): Parceiro => ({
	id: 1,
	f_razao_social: "Empresa Teste",
	f_cnpj: "11222333000181",
	f_endereco: "Rua Teste",
	f_numero: "100",
	f_bairro: "Centro",
	f_cidade: "São Paulo",
	f_uf: "SP",
	f_cep: "01000000",
	...overrides,
});

const createValidCliente = (overrides?: Partial<Cliente>): Cliente => ({
	id: 1,
	f_nome_razao: "Cliente Teste",
	f_cpf_cnpj: "52998224725",
	f_endereco: "Rua Cliente",
	f_numero: "200",
	f_bairro: "Bairro",
	f_cidade: "São Paulo",
	f_uf: "SP",
	f_cep: "02000000",
	...overrides,
});

describe("entityValidator", () => {
	describe("validatePartner", () => {
		it("deve retornar sucesso para parceiro com todos os campos", () => {
			const result = entityValidator.validatePartner(createValidParceiro());
			expect(result.success).toBe(true);
		});

		it("deve retornar falha quando razão social está vazia", () => {
			const result = entityValidator.validatePartner(
				createValidParceiro({ f_razao_social: "" }),
			);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContainEqual(
					expect.objectContaining({ field: "f_razao_social" }),
				);
			}
		});

		it("deve retornar falha quando CNPJ é undefined", () => {
			const result = entityValidator.validatePartner(
				createValidParceiro({ f_cnpj: undefined } as unknown as Parceiro),
			);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContainEqual(
					expect.objectContaining({ field: "f_cnpj" }),
				);
			}
		});

		it("deve retornar múltiplos erros para múltiplos campos vazios", () => {
			const result = entityValidator.validatePartner(
				createValidParceiro({
					f_razao_social: "",
					f_cnpj: undefined,
					f_endereco: "",
				} as unknown as Parceiro),
			);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.length).toBeGreaterThanOrEqual(3);
			}
		});

		it("deve considerar 'NaN' como valor vazio", () => {
			const result = entityValidator.validatePartner(
				createValidParceiro({ f_cep: "NaN" }),
			);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContainEqual(
					expect.objectContaining({ field: "f_cep" }),
				);
			}
		});

		it("deve considerar string com espaços como valor vazio", () => {
			const result = entityValidator.validatePartner(
				createValidParceiro({ f_bairro: "   " }),
			);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContainEqual(
					expect.objectContaining({ field: "f_bairro" }),
				);
			}
		});
	});

	describe("validateClient", () => {
		it("deve retornar sucesso para cliente com todos os campos", () => {
			const result = entityValidator.validateClient(createValidCliente());
			expect(result.success).toBe(true);
		});

		it("deve retornar falha quando nome/razão social está vazio", () => {
			const result = entityValidator.validateClient(
				createValidCliente({ f_nome_razao: "" }),
			);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContainEqual(
					expect.objectContaining({ field: "f_nome_razao" }),
				);
			}
		});

		it("deve retornar falha para CPF/CNPJ undefined", () => {
			const result = entityValidator.validateClient(
				createValidCliente({ f_cpf_cnpj: undefined } as unknown as Cliente),
			);

			expect(result.success).toBe(false);
		});
	});

	describe("validateAll", () => {
		it("deve passar quando todos os campos estão preenchidos", () => {
			expect(() =>
				entityValidator.validateAll(createValidParceiro(), [
					createValidCliente(),
				]),
			).not.toThrow();
		});

		it("deve lançar EntityValidationError para parceiro inválido", () => {
			expect(() =>
				entityValidator.validateAll(
					createValidParceiro({ f_razao_social: "" }),
					[createValidCliente()],
				),
			).toThrow(EntityValidationError);
		});

		it("deve lançar EntityValidationError para cliente inválido", () => {
			expect(() =>
				entityValidator.validateAll(createValidParceiro(), [
					createValidCliente({ f_nome_razao: "" }),
				]),
			).toThrow(EntityValidationError);
		});

		it("deve falhar no primeiro cliente inválido", () => {
			const clientes = [
				createValidCliente({ id: 1 }),
				createValidCliente({ id: 2, f_nome_razao: "" }),
			];

			expect(() =>
				entityValidator.validateAll(createValidParceiro(), clientes),
			).toThrow(EntityValidationError);
		});

		it("deve usar ID fallback quando parceiro.id é undefined", () => {
			const parceiro = createValidParceiro({
				id: undefined,
				f_razao_social: "",
			} as unknown as Parceiro);

			expect(() =>
				entityValidator.validateAll(parceiro, [createValidCliente()]),
			).toThrow(EntityValidationError);
		});

		it("deve usar ID fallback quando cliente.id é undefined", () => {
			const clientes = [
				createValidCliente({ id: undefined, f_nome_razao: "" } as unknown as Cliente),
			];

			expect(() =>
				entityValidator.validateAll(createValidParceiro(), clientes),
			).toThrow(EntityValidationError);
		});
	});
});
