import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = {
	SERVER_URL: z.string().default("0.0.0.0"),
	SERVER_PORT: z.coerce.number().default(3333),

	ATACADO_API_KEY: z.string().min(1, "ATACADO_API_KEY é obrigatório"),
	ATACADO_API_URL: z.url("ATACADO_API_URL deve ser uma URL válida"),
};

const env = createEnv({
	server: envSchema,
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});

export { env };
