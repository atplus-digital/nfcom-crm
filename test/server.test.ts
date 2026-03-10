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

describe("server", () => {
	describe("buildServer configuration", () => {
		it("deve criar server com logger configurado", () => {
			const server = fastify({
				logger: createLoggerConfig(),
			});

			expect(server).toBeDefined();
			expect(server.log).toBeDefined();
		});

		it("deve registrar validator e serializer compilers", () => {
			const server = fastify({
				logger: createLoggerConfig(),
			});

			server.setValidatorCompiler(validatorCompiler);
			server.setSerializerCompiler(serializerCompiler);

			expect(server).toBeDefined();
		});

		it("deve registrar error handler", () => {
			const server = fastify({
				logger: createLoggerConfig(),
			});

			server.setErrorHandler(errorHandler);

			expect(server).toBeDefined();
		});

		it("deve registrar rotas da aplicação", async () => {
			const server = fastify({
				logger: createLoggerConfig(),
			});

			server.setValidatorCompiler(validatorCompiler);
			server.setSerializerCompiler(serializerCompiler);
			server.setErrorHandler(errorHandler);

			await server.register(appRoutes);

			const routes = server.printRoutes();
			expect(routes).toContain("GET");
		});
	});

	describe("routes availability", () => {
		it("deve ter rota GET / disponível", async () => {
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
	});
});
