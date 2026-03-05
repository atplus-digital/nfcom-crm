import z from "zod";

const preparaFaturaSchema = z.object({
	f_parceiro: z.number().positive("ID do parceiro deve ser positivo"),
	f_data_referencia: z.coerce.date(),
	f_tipo_de_faturamento: z.enum([
		"parceiro",
		"via-parceiro",
		"cofaturamento",
		"cliente-final",
	]),
});

type PreparaFaturaBody = z.infer<typeof preparaFaturaSchema>;

const preparaFaturaResponseSchema = z.object({
	status: z.literal(200),
	success: z.literal(true),
	dateStr: z.string(),
	date: z.date(),
	data: z.any().optional(),
});

export {
	preparaFaturaSchema,
	preparaFaturaResponseSchema,
	type PreparaFaturaBody,
};
