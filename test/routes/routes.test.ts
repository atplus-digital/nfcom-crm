jest.mock("@/env", () => ({
	env: {
		ATACADO_API_URL: "https://api.test.com",
		ATACADO_API_KEY: "test-api-key",
		SERVER_URL: "0.0.0.0",
		SERVER_PORT: 3333,
	},
}));

import fastify from "fastify";
import {
	serializerCompiler,
	validatorCompiler,
} from "fastify-type-provider-zod";
import { appRoutes } from "@/routes/routes";
import { errorHandler } from "@/shared/error-handler";
import { createLoggerConfig } from "@/shared/logging/logger.config";

describe("routes", () => {
	describe("GET /", () => {
		it("deve retornar { api: 'on' }", async () => {
			const server = fastify({
				logger: createLoggerConfig(),
			});

			server.setValidatorCompiler(validatorCompiler);
			server.setSerializerCompiler(serializerCompiler);
			server.setErrorHandler(errorHandler);
			await server.register(appRoutes);

			const response = await server.inject({
				method: "GET",
				url: "/",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual({ api: "on" });
		});

		it("deve retornar Content-Type application/json", async () => {
			const server = fastify({
				logger: createLoggerConfig(),
			});

			server.setValidatorCompiler(validatorCompiler);
			server.setSerializerCompiler(serializerCompiler);
			server.setErrorHandler(errorHandler);
			await server.register(appRoutes);

			const response = await server.inject({
				method: "GET",
				url: "/",
			});

			expect(response.headers["content-type"]).toContain("application/json");
		});
	});
});
