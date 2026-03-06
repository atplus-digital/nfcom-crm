import { main } from "./main.mts";

main().catch((error) => {
	console.error("Erro ao gerar schemas:", error);
	process.exit(1);
});
