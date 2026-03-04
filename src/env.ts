import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

config();

export const env = createEnv({
	server: {
		SERVER_URL: z.string().default("0.0.0.0"),
		SERVER_PORT: z.number().default(3333),

		ATACADO_API_KEY: z.string(),
		ATACADO_API_URL: z.url(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
