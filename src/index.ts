import { buildServer } from "./server";

const bootstrap = async (): Promise<void> => {
	try {
		await buildServer();
	} catch (error) {
		console.error("[FATAL] Failed to start server:", error);
		process.exit(1);
	}
	console.log("done");
};

bootstrap();
