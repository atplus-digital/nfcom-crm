import { main } from "./atacado/generate-schemas";

main().catch((error) => {
	console.error("Erro ao gerar schemas:", error);
	process.exit(1);
});
