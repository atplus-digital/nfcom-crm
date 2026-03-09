import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import { runValidateAll } from "@/modules/fatura/validators/validation-utils";
import { Failure, Success } from "@/shared/result";

const mockParceiro: Parceiro = { id: 1, f_razao_social: "Parceiro" };
const mockCliente1: Cliente = { id: 10, f_nome_razao: "Cliente 1" };
const mockCliente2: Cliente = { id: 20, f_nome_razao: "Cliente 2" };

describe("runValidateAll", () => {
	it("deve passar quando todas as validações retornam sucesso", () => {
		expect(() =>
			runValidateAll({
				partner: mockParceiro,
				clients: [mockCliente1, mockCliente2],
				validatePartner: () => Success(undefined),
				validateClient: () => Success(undefined),
				buildPartnerError: () => new Error("partner error"),
				buildClientError: () => new Error("client error"),
			}),
		).not.toThrow();
	});

	it("deve lançar erro quando validação do parceiro falha", () => {
		expect(() =>
			runValidateAll({
				partner: mockParceiro,
				clients: [mockCliente1],
				validatePartner: () => Failure("erro parceiro"),
				validateClient: () => Success(undefined),
				buildPartnerError: (_p, error) => new Error(`Partner: ${error}`),
				buildClientError: () => new Error("client error"),
			}),
		).toThrow("Partner: erro parceiro");
	});

	it("deve lançar erro quando validação de cliente falha", () => {
		expect(() =>
			runValidateAll({
				partner: mockParceiro,
				clients: [mockCliente1],
				validatePartner: () => Success(undefined),
				validateClient: () => Failure("erro cliente"),
				buildPartnerError: () => new Error("partner error"),
				buildClientError: (_c, error) => new Error(`Client: ${error}`),
			}),
		).toThrow("Client: erro cliente");
	});

	it("deve parar no primeiro cliente com erro", () => {
		const validateClient = jest
			.fn()
			.mockReturnValueOnce(Failure("erro"))
			.mockReturnValueOnce(Success(undefined));

		expect(() =>
			runValidateAll({
				partner: mockParceiro,
				clients: [mockCliente1, mockCliente2],
				validatePartner: () => Success(undefined),
				validateClient,
				buildPartnerError: () => new Error("partner error"),
				buildClientError: () => new Error("client error"),
			}),
		).toThrow("client error");

		expect(validateClient).toHaveBeenCalledTimes(1);
	});

	it("deve validar parceiro antes dos clientes", () => {
		const callOrder: string[] = [];

		expect(() =>
			runValidateAll({
				partner: mockParceiro,
				clients: [mockCliente1],
				validatePartner: () => {
					callOrder.push("partner");
					return Failure("erro");
				},
				validateClient: () => {
					callOrder.push("client");
					return Success(undefined);
				},
				buildPartnerError: () => new Error("partner error"),
				buildClientError: () => new Error("client error"),
			}),
		).toThrow();

		expect(callOrder).toEqual(["partner"]);
	});

	it("deve funcionar com lista vazia de clientes", () => {
		expect(() =>
			runValidateAll({
				partner: mockParceiro,
				clients: [],
				validatePartner: () => Success(undefined),
				validateClient: () => Success(undefined),
				buildPartnerError: () => new Error("partner error"),
				buildClientError: () => new Error("client error"),
			}),
		).not.toThrow();
	});
});
