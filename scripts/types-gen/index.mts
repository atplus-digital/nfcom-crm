import { runGenerator } from "./main.mts";

runGenerator().catch((error) => {
	console.error("Error generating schemas:", error);
	process.exit(1);
});
