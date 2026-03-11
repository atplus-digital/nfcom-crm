import z from "zod";
import { TipoFaturamentoEnum } from "@/modules/invoice-service/invoice.schemas";

export const preparaFaturaSchema = z.object({
	f_parceiro: z
		.number({ message: "ID do parceiro deve ser um número" })
		.positive("ID do parceiro deve ser positivo"),
	f_data_referencia: z.coerce.date({ message: "Data de referência inválida" }),
	f_tipo_de_faturamento: TipoFaturamentoEnum,
});

export const preparaFaturaResponseSchema = z.object({
	status: z.literal(201),
	success: z.literal(true),
	dateStr: z.string(),
	billingType: TipoFaturamentoEnum,
	resumo: z.object({
		totalClientes: z.number(),
		totalLinhas: z.number(),
		valorTotal: z.number(),
	}),
	data: z.object({
		fatura: z.object({
			id: z.number(),
			f_status: z.literal("criada"),
			f_data_referencia: z.string(),
			f_data_vencimento: z.string(),
			f_valor_total: z.string(),
			f_tipo_de_faturamento: z.string(),
		}),
		cobrancas: z.array(
			z.object({
				id: z.number(),
				f_valor_total: z.string(),
				f_nome_devedor: z.string(),
				f_status: z.literal("a-emitir"),
			}),
		),
		notasFiscais: z.array(
			z.object({
				id: z.number(),
				f_nome: z.string(),
				f_cpfcnpj: z.string(),
				f_status_interno: z.literal("a-emitir"),
				f_fk_cobranca: z.number(),
			}),
		),
	}),
});

export type PreparaFaturaBody = z.infer<typeof preparaFaturaSchema>;

export type PrepareInvoiceResponse = z.infer<
	typeof preparaFaturaResponseSchema
>;
