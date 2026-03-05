import z from "zod";

export const preparaFaturaSchema = z.object({
	f_parceiro: z.number(),
	f_data_referencia: z.coerce.date(),
	f_tipo_de_faturamento: z.enum([
		"parceiro",
		"via-parceiro",
		"cofaturamento",
		"cliente-final",
	]),
});

export type PreparaFaturaBody = z.infer<typeof preparaFaturaSchema>;

export const preparaFaturaResponseSchema = {
	201: z.object({
		status: z.literal(201),
		success: z.literal(true),
	}),
};
