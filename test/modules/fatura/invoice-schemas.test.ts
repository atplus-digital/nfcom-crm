import {
	GroupedLineSchema,
	GroupedServiceSchema,
	InvoicePartnerSchema,
	ProcessedLineSchema,
	TipoFaturamentoEnum,
} from "@/modules/invoice-service/invoice.schemas";

describe("fatura.schemas", () => {
	describe("TipoFaturamentoEnum", () => {
		it("deve aceitar valores válidos", () => {
			expect(TipoFaturamentoEnum.safeParse("parceiro").success).toBe(true);
			expect(TipoFaturamentoEnum.safeParse("via-parceiro").success).toBe(true);
			expect(TipoFaturamentoEnum.safeParse("cofaturamento").success).toBe(true);
			expect(TipoFaturamentoEnum.safeParse("cliente-final").success).toBe(true);
		});

		it("deve rejeitar valores inválidos", () => {
			expect(TipoFaturamentoEnum.safeParse("invalido").success).toBe(false);
			expect(TipoFaturamentoEnum.safeParse("").success).toBe(false);
			expect(TipoFaturamentoEnum.safeParse(123).success).toBe(false);
		});
	});

	describe("ProcessedLineSchema", () => {
		it("deve validar linha processada válida", () => {
			const line = {
				id: 1,
				planId: 4,
				unitPrice: 3,
				description: "Plano A",
			};

			expect(ProcessedLineSchema.safeParse(line).success).toBe(true);
		});

		it("deve aceitar id como string", () => {
			const line = {
				id: "abc",
				planId: "xyz",
				unitPrice: 3,
				description: "Plano A",
			};

			expect(ProcessedLineSchema.safeParse(line).success).toBe(true);
		});

		it("deve rejeitar quando falta campo obrigatório", () => {
			const line = { id: 1, planId: 4 };

			expect(ProcessedLineSchema.safeParse(line).success).toBe(false);
		});
	});

	describe("GroupedLineSchema", () => {
		it("deve validar linha agrupada válida", () => {
			const line = {
				id: 1,
				planId: 4,
				unitPrice: 3,
				description: "Plano A",
				quantity: 2,
				total: 6,
			};

			expect(GroupedLineSchema.safeParse(line).success).toBe(true);
		});

		it("deve rejeitar sem quantity", () => {
			const line = {
				id: 1,
				planId: 4,
				unitPrice: 3,
				description: "Plano A",
				total: 6,
			};

			expect(GroupedLineSchema.safeParse(line).success).toBe(false);
		});
	});

	describe("GroupedServiceSchema", () => {
		it("deve validar serviço agrupado válido", () => {
			const service = {
				planId: 4,
				description: "Plano A",
				unitPrice: 3,
				quantity: 5,
				total: 15,
			};

			expect(GroupedServiceSchema.safeParse(service).success).toBe(true);
		});
	});

	describe("InvoicePartnerSchema", () => {
		it("deve validar billingPlan com estrutura de parceiro", () => {
			const parsed = InvoicePartnerSchema.safeParse({
				dueDate: "2025-02-10",
				invoiceTotal: 30,
				totalLines: 5,
				partner: {
					partner: {
						id: 1,
						f_razao_social: "Empresa",
						f_cnpj: "11222333000181",
					},
					invoiceTotal: 30,
					totalClients: 1,
					totalLines: 5,
				},
				clients: [
					{
						client: {
							id: 10,
							f_nome_razao: "Cliente 1",
							f_cpf_cnpj: "52998224725",
						},
						total: 30,
						totalLines: 5,
						lines: [{ id: 1, planId: 4, unitPrice: 6, description: "Plano" }],
						groupedLines: [
							{
								id: 1,
								planId: 4,
								unitPrice: 6,
								description: "Plano",
								quantity: 5,
								total: 30,
							},
						],
					},
				],
				groupedServices: [
					{
						planId: 4,
						description: "Plano",
						unitPrice: 6,
						quantity: 5,
						total: 30,
					},
				],
				billingPlan: {
					billingType: "parceiro",
					charges: [
						{
							chargeKey: "partner-charge",
							total: 30,
							debtor: {
								type: "partner",
								id: 1,
								name: "Empresa",
								document: "11222333000181",
								email: "",
							},
							noteRecipients: [
								{
									recipient: {
										type: "partner",
										id: 1,
										name: "Empresa",
										document: "11222333000181",
										email: "",
									},
									total: 30,
									totalLines: 5,
									items: [
										{
											planId: 4,
											description: "Plano",
											unitPrice: 6,
											quantity: 5,
											total: 30,
										},
									],
								},
							],
						},
					],
				},
			});

			expect(parsed.success).toBe(true);
		});
	});
});
