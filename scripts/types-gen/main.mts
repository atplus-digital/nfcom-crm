import { rm, rmdir } from "node:fs/promises";
import { generate } from "orval";
import { prepareEntries } from "./prepare-entries.mts";
import { buildFkMap, buildParentRelationsMap } from "./maps.mts";
import { extractMainInterface } from "./extractor.mts";
import { TEMP_DIR } from "./constants.mts";

export async function main(): Promise<void> {
	try {
		// eslint-disable-next-line no-console
		console.log(`🚀 Iniciando geração de schemas`);

		const entries = await prepareEntries();

		if (entries.length === 0) {
			console.warn("⚠️  Nenhuma collection foi processada");
			return;
		}

		console.log(`\n⚙️  Gerando ${entries.length} schema(s)...`);
		const fkMap = buildFkMap();
		const parentRelationsMap = buildParentRelationsMap();

		await Promise.all(
			entries.map(async ({ name, config }) => {
				await generate(config);
				const outputPath =
					typeof config.output === "object" ? config.output?.target : undefined;
				if (outputPath) {
					await extractMainInterface(
						outputPath,
						name,
						fkMap,
						parentRelationsMap
					);
				}
			})
		);

		console.log(`\n✨ ${entries.length} schema(s) gerado(s) com sucesso`);
	} catch (error) {
		console.error("❌ Erro:", error);
		process.exit(1);
	} finally {
		await rm(TEMP_DIR, { recursive: true, force: true });
		await rmdir(TEMP_DIR).catch(() => {});
	}

	process.exit(0);
}
