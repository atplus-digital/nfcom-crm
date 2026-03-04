import { buildServer } from "./server/server";

async function main() {
	try {
		await buildServer();
	} catch (error) {
		console.error("❌ Erro:", error);
		process.exit(1);
	}
}

main();
