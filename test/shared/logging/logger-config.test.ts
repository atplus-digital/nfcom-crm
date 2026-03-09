import {
	createLoggerConfig,
	isProduction,
} from "@/shared/logging/logger.config";

describe("logger.config", () => {
	const originalEnv = process.env.NODE_ENV;

	afterEach(() => {
		process.env.NODE_ENV = originalEnv;
	});

	describe("isProduction", () => {
		it("deve retornar true quando NODE_ENV é production", () => {
			process.env.NODE_ENV = "production";
			expect(isProduction()).toBe(true);
		});

		it("deve retornar false quando NODE_ENV é development", () => {
			process.env.NODE_ENV = "development";
			expect(isProduction()).toBe(false);
		});

		it("deve retornar false quando NODE_ENV é test", () => {
			process.env.NODE_ENV = "test";
			expect(isProduction()).toBe(false);
		});

		it("deve retornar false quando NODE_ENV não está definido", () => {
			delete process.env.NODE_ENV;
			expect(isProduction()).toBe(false);
		});
	});

	describe("createLoggerConfig", () => {
		it("deve retornar config com level debug em development", () => {
			process.env.NODE_ENV = "development";
			const config = createLoggerConfig();

			expect(config.level).toBe("debug");
			expect(config.transport).toBeDefined();
		});

		it("deve retornar config com level info em production", () => {
			process.env.NODE_ENV = "production";
			const config = createLoggerConfig();

			expect(config.level).toBe("info");
		});

		it("deve retornar config com level silent em test", () => {
			process.env.NODE_ENV = "test";
			const config = createLoggerConfig();

			expect(config.level).toBe("silent");
		});

		it("deve usar development como fallback", () => {
			delete process.env.NODE_ENV;
			const config = createLoggerConfig();

			expect(config.level).toBe("debug");
		});

		it("deve ter 3 transports configurados", () => {
			process.env.NODE_ENV = "development";
			const config = createLoggerConfig();

			const transport = config.transport as { targets: unknown[] };
			expect(transport.targets).toHaveLength(3);
		});

		it("deve incluir transport pino-roll para errors", () => {
			process.env.NODE_ENV = "development";
			const config = createLoggerConfig();

			const transport = config.transport as {
				targets: { target: string; level: string }[];
			};
			const errorTransport = transport.targets.find(
				(t) => t.target === "pino-roll" && t.level === "error",
			);
			expect(errorTransport).toBeDefined();
		});

		it("deve incluir transport pino-pretty", () => {
			process.env.NODE_ENV = "development";
			const config = createLoggerConfig();

			const transport = config.transport as {
				targets: { target: string }[];
			};
			const prettyTransport = transport.targets.find(
				(t) => t.target === "pino-pretty",
			);
			expect(prettyTransport).toBeDefined();
		});

		it("deve usar nível warn em production para transports não-error", () => {
			process.env.NODE_ENV = "production";
			const config = createLoggerConfig();

			const transport = config.transport as {
				targets: { target: string; level: string }[];
			};
			const prettyTransport = transport.targets.find(
				(t) => t.target === "pino-pretty",
			);
			expect(prettyTransport?.level).toBe("warn");
		});

		it("deve usar nível trace em development para transports não-error", () => {
			process.env.NODE_ENV = "development";
			const config = createLoggerConfig();

			const transport = config.transport as {
				targets: { target: string; level: string }[];
			};
			const prettyTransport = transport.targets.find(
				(t) => t.target === "pino-pretty",
			);
			expect(prettyTransport?.level).toBe("trace");
		});
	});
});
