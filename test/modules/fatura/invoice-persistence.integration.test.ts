import type { Cliente } from "@/@types/atacado/Cliente";
import type { Parceiro } from "@/@types/atacado/Parceiro";
import type { PlanoDeServico } from "@/@types/atacado/PlanoDeServico";
import type { AtacadoRepository } from "@/modules/atacado-repository/wholesale.repository.types";
import { InvoiceService } from "@/modules/invoice-service/invoice-persistence.service";
import { ExternalApiError } from "@/shared/base.error";
import {
	createCliente,
	createParceiro,
	createServico,
	DEFAULT_PLANOS,
} from "../../fixtures/invoice-fixtures";

interface PersistenceRepositoryContext {
	readonly repository: AtacadoRepository;
	readonly createFaturaMock: jest.MockedFunction<
		AtacadoRepository["createFatura"]
	>;
	readonly createCobrancaMock: jest.MockedFunction<
		AtacadoRepository["createCobranca"]
	>;
	readonly createNFComMock: jest.MockedFunction<
		AtacadoRepository["createNFCom"]
	>;
	readonly createItemNFComMock: jest.MockedFunction<
		AtacadoRepository["createItemNFCom"]
	>;
	readonly deleteFaturaMock: jest.MockedFunction<
		AtacadoRepository["deleteFatura"]
	>;
	readonly deleteCobrancaMock: jest.MockedFunction<
		AtacadoRepository["deleteCobranca"]
	>;
	readonly deleteNFComMock: jest.MockedFunction<
		AtacadoRepository["deleteNFCom"]
	>;
	readonly deleteItemNFComMock: jest.MockedFunction<
		AtacadoRepository["deleteItemNFCom"]
	>;
}

const createPersistenceRepository = (
	partner: Parceiro,
	clients: Cliente[],
	plans: PlanoDeServico[] = DEFAULT_PLANOS,
): PersistenceRepositoryContext => {
	let faturaId = 100;
	let cobrancaId = 200;
	let nfComId = 300;
	let itemId = 400;

	const createFaturaMock: jest.MockedFunction<
		AtacadoRepository["createFatura"]
	> = jest.fn(async (data) => ({
		...data,
		id: faturaId++,
	}));
	const createCobrancaMock: jest.MockedFunction<
		AtacadoRepository["createCobranca"]
	> = jest.fn(async (data) => ({
		...data,
		id: cobrancaId++,
	}));
	const createNFComMock: jest.MockedFunction<AtacadoRepository["createNFCom"]> =
		jest.fn(async (chargeId, data) => ({
			...data,
			id: nfComId++,
			f_fk_cobranca: Number(chargeId),
		}));
	const createItemNFComMock: jest.MockedFunction<
		AtacadoRepository["createItemNFCom"]
	> = jest.fn(async (_, data) => ({
		...data,
		id: itemId++,
	}));
	const deleteFaturaMock: jest.MockedFunction<
		AtacadoRepository["deleteFatura"]
	> = jest.fn(async (_id) => undefined);
	const deleteCobrancaMock: jest.MockedFunction<
		AtacadoRepository["deleteCobranca"]
	> = jest.fn(async (_id) => undefined);
	const deleteNFComMock: jest.MockedFunction<AtacadoRepository["deleteNFCom"]> =
		jest.fn(async (_id) => undefined);
	const deleteItemNFComMock: jest.MockedFunction<
		AtacadoRepository["deleteItemNFCom"]
	> = jest.fn(async (_id) => undefined);

	return {
		repository: {
			findParceiroById: jest.fn().mockResolvedValue(partner),
			findClientesAtivosByParceiroId: jest.fn().mockResolvedValue(clients),
			findAllPlanosDeServico: jest.fn().mockResolvedValue(plans),
			createFatura: createFaturaMock,
			createCobranca: createCobrancaMock,
			createNFCom: createNFComMock,
			createItemNFCom: createItemNFComMock,
			deleteFatura: deleteFaturaMock,
			deleteCobranca: deleteCobrancaMock,
			deleteNFCom: deleteNFComMock,
			deleteItemNFCom: deleteItemNFComMock,
		},
		createFaturaMock,
		createCobrancaMock,
		createNFComMock,
		createItemNFComMock,
		deleteFaturaMock,
		deleteCobrancaMock,
		deleteNFComMock,
		deleteItemNFComMock,
	};
};

describe("InvoiceService.calculateAndPersist - fluxo de persistência por tipo", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2025, 0, 1));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("parceiro: cria 1 fatura, 1 cobrança, 1 NFCom e itens agrupados globais", async () => {
		const partner = createParceiro({
			f_email_faturamento: "financeiro@parceiro.com",
		});
		const clients = [
			createCliente({
				id: 10,
				f_linhas_fixas: [
					createServico({ id: 1, f_coghzwfvcnx: 4 }),
					createServico({ id: 2, f_coghzwfvcnx: 4 }),
					createServico({ id: 3, f_coghzwfvcnx: 5 }),
				],
			}),
		];
		const ctx = createPersistenceRepository(partner, clients);
		const service = new InvoiceService(ctx.repository);

		const result = await service.calculateAndPersist({
			partnerId: 1,
			referenceDate: "2025-01-01",
			billingType: "parceiro",
		});

		expect(ctx.createFaturaMock).toHaveBeenCalledTimes(1);
		expect(ctx.createCobrancaMock).toHaveBeenCalledTimes(1);
		expect(ctx.createNFComMock).toHaveBeenCalledTimes(1);
		expect(ctx.createItemNFComMock).toHaveBeenCalledTimes(2);
		expect(result.billingType).toBe("parceiro");
		expect(result.data.cobrancas).toHaveLength(1);
		expect(result.data.notasFiscais).toHaveLength(1);
		expect(result.data.notasFiscais[0]?.f_fk_cobranca).toBe(
			result.data.cobrancas[0]?.id,
		);
	});

	it("via-parceiro: cria 1 cobrança do parceiro e NFCom por cliente", async () => {
		const clients = [
			createCliente({
				id: 10,
				f_linhas_fixas: [createServico({ id: 1, f_coghzwfvcnx: 4 })],
			}),
			createCliente({
				id: 20,
				f_linhas_fixas: [
					createServico({ id: 2, f_coghzwfvcnx: 4 }),
					createServico({ id: 3, f_coghzwfvcnx: 5 }),
				],
			}),
		];
		const ctx = createPersistenceRepository(createParceiro(), clients);
		const service = new InvoiceService(ctx.repository);

		const result = await service.calculateAndPersist({
			partnerId: 1,
			referenceDate: "2025-01-01",
			billingType: "via-parceiro",
		});

		expect(ctx.createCobrancaMock).toHaveBeenCalledTimes(1);
		expect(ctx.createNFComMock).toHaveBeenCalledTimes(2);
		expect(ctx.createItemNFComMock).toHaveBeenCalledTimes(3);
		expect(result.data.cobrancas).toHaveLength(1);
		expect(result.data.notasFiscais).toHaveLength(2);
		expect(
			result.data.notasFiscais.every((note) => note.f_fk_cobranca === 200),
		).toBe(true);
	});

	it("cofaturamento: mantém mesma estrutura de persistência do via-parceiro", async () => {
		const clients = [
			createCliente({
				id: 30,
				f_linhas_fixas: [createServico({ id: 4, f_coghzwfvcnx: 4 })],
			}),
			createCliente({
				id: 40,
				f_linhas_fixas: [createServico({ id: 5, f_coghzwfvcnx: 5 })],
			}),
		];
		const ctx = createPersistenceRepository(createParceiro(), clients);
		const service = new InvoiceService(ctx.repository);

		const result = await service.calculateAndPersist({
			partnerId: 1,
			referenceDate: "2025-01-01",
			billingType: "cofaturamento",
		});

		expect(ctx.createCobrancaMock).toHaveBeenCalledTimes(1);
		expect(ctx.createNFComMock).toHaveBeenCalledTimes(2);
		expect(result.billingType).toBe("cofaturamento");
		expect(result.data.notasFiscais).toHaveLength(2);
	});

	it("cliente-final: cria cobrança e NFCom individual por cliente", async () => {
		const clients = [
			createCliente({
				id: 50,
				f_email: "financeiro@cliente-1.com",
				f_linhas_fixas: [createServico({ id: 6, f_coghzwfvcnx: 4 })],
			}),
			createCliente({
				id: 60,
				f_email: "financeiro@cliente-2.com",
				f_linhas_fixas: [createServico({ id: 7, f_coghzwfvcnx: 5 })],
			}),
		];
		const ctx = createPersistenceRepository(createParceiro(), clients);
		const service = new InvoiceService(ctx.repository);

		const result = await service.calculateAndPersist({
			partnerId: 1,
			referenceDate: "2025-01-01",
			billingType: "cliente-final",
		});

		expect(ctx.createCobrancaMock).toHaveBeenCalledTimes(2);
		expect(ctx.createNFComMock).toHaveBeenCalledTimes(2);
		expect(result.data.cobrancas).toHaveLength(2);
		expect(result.data.notasFiscais).toHaveLength(2);
		expect(result.data.notasFiscais[0]?.f_fk_cobranca).toBe(200);
		expect(result.data.notasFiscais[1]?.f_fk_cobranca).toBe(201);
	});

	it("falha ao criar fatura: retorna erro com etapa e rollback vazio", async () => {
		const ctx = createPersistenceRepository(createParceiro(), [
			createCliente(),
		]);
		ctx.createFaturaMock.mockRejectedValueOnce(new Error("falha createFatura"));
		const service = new InvoiceService(ctx.repository);

		const execution = service.calculateAndPersist({
			partnerId: 1,
			referenceDate: "2025-01-01",
			billingType: "parceiro",
		});

		await expect(execution).rejects.toThrow(ExternalApiError);
		await expect(execution).rejects.toThrow(
			/Falha na etapa createFatura: falha createFatura; rollback=itens=0 \[\]; notas=0 \[\]; cobrancas=0 \[\]; faturas=0 \[\]/,
		);
		expect(ctx.deleteItemNFComMock).not.toHaveBeenCalled();
		expect(ctx.deleteNFComMock).not.toHaveBeenCalled();
		expect(ctx.deleteCobrancaMock).not.toHaveBeenCalled();
		expect(ctx.deleteFaturaMock).not.toHaveBeenCalled();
	});

	it("falha ao criar cobrança: executa rollback de fatura", async () => {
		const ctx = createPersistenceRepository(createParceiro(), [
			createCliente(),
		]);
		ctx.createCobrancaMock.mockRejectedValueOnce(
			new Error("falha createCobranca"),
		);
		const service = new InvoiceService(ctx.repository);

		await expect(
			service.calculateAndPersist({
				partnerId: 1,
				referenceDate: "2025-01-01",
				billingType: "parceiro",
			}),
		).rejects.toThrow(/Falha na etapa createCobranca: falha createCobranca/);

		expect(ctx.deleteFaturaMock).toHaveBeenCalledWith(100);
		expect(ctx.deleteCobrancaMock).not.toHaveBeenCalled();
		expect(ctx.deleteNFComMock).not.toHaveBeenCalled();
		expect(ctx.deleteItemNFComMock).not.toHaveBeenCalled();
	});

	it("falha ao criar NFCom: executa rollback de cobrança e fatura", async () => {
		const ctx = createPersistenceRepository(createParceiro(), [
			createCliente(),
		]);
		ctx.createNFComMock.mockRejectedValueOnce(new Error("falha createNFCom"));
		const service = new InvoiceService(ctx.repository);

		await expect(
			service.calculateAndPersist({
				partnerId: 1,
				referenceDate: "2025-01-01",
				billingType: "parceiro",
			}),
		).rejects.toThrow(/Falha na etapa createNFCom: falha createNFCom/);

		expect(ctx.deleteCobrancaMock).toHaveBeenCalledWith(200);
		expect(ctx.deleteFaturaMock).toHaveBeenCalledWith(100);
		expect(ctx.deleteNFComMock).not.toHaveBeenCalled();
		expect(ctx.deleteItemNFComMock).not.toHaveBeenCalled();
	});

	it("falha ao criar ItemNFCom: executa rollback reverso completo", async () => {
		const partner = createParceiro();
		const clients = [
			createCliente({
				id: 10,
				f_linhas_fixas: [
					createServico({ id: 1, f_coghzwfvcnx: 4 }),
					createServico({ id: 2, f_coghzwfvcnx: 5 }),
				],
			}),
		];
		const ctx = createPersistenceRepository(partner, clients);
		let createdItems = 0;
		ctx.createItemNFComMock.mockImplementation(async (_, data) => {
			createdItems += 1;

			if (createdItems === 2) {
				throw new Error("falha createItemNFCom");
			}

			return {
				...data,
				id: 400,
			};
		});
		const service = new InvoiceService(ctx.repository);

		await expect(
			service.calculateAndPersist({
				partnerId: 1,
				referenceDate: "2025-01-01",
				billingType: "parceiro",
			}),
		).rejects.toThrow(/Falha na etapa createItemNFCom: falha createItemNFCom/);

		expect(ctx.deleteItemNFComMock).toHaveBeenCalledWith(400);
		expect(ctx.deleteNFComMock).toHaveBeenCalledWith(300);
		expect(ctx.deleteCobrancaMock).toHaveBeenCalledWith(200);
		expect(ctx.deleteFaturaMock).toHaveBeenCalledWith(100);
		expect(ctx.deleteItemNFComMock.mock.invocationCallOrder[0]).toBeLessThan(
			ctx.deleteNFComMock.mock.invocationCallOrder[0] ?? 0,
		);
		expect(ctx.deleteNFComMock.mock.invocationCallOrder[0]).toBeLessThan(
			ctx.deleteCobrancaMock.mock.invocationCallOrder[0] ?? 0,
		);
		expect(ctx.deleteCobrancaMock.mock.invocationCallOrder[0]).toBeLessThan(
			ctx.deleteFaturaMock.mock.invocationCallOrder[0] ?? 0,
		);
	});
});
