import { rm, rmdir } from "node:fs/promises";
import { generate } from "orval";
import {
	defaultConfig,
	GenerationConfig,
	resolveOutputPath,
} from "./config/generation.mts";
import { loadCollectionEntries, loadRelationMaps } from "./loaders/index.mts";
import { extractMainInterface } from "./services/extractor.mts";
import type { GenerationResult } from "./config/types.mts";

export interface GeneratorOptions {
	config?: Partial<GenerationConfig>;
	onProgress?: (name: string, status: "start" | "success" | "error") => void;
	onComplete?: (results: GenerationResult[]) => void;
}

export async function runGenerator(
	options: GeneratorOptions = {},
): Promise<GenerationResult[]> {
	const config: GenerationConfig = { ...defaultConfig, ...options.config };
	const results: GenerationResult[] = [];

	console.log(`🚀 Starting type generation`);
	console.log(`📁 Output: ${config.outputDir}`);
	console.log(`📁 Temp: ${config.tempDir}`);

	const entries = await loadCollectionEntries(config);

	if (entries.length === 0) {
		console.warn("⚠️  No collections were processed");
		return results;
	}

	console.log(`\n⚙️  Generating ${entries.length} schema(s)...`);
	const { fkMap, parentRelationsMap } = loadRelationMaps();

	for (const { name, config: orvalConfig } of entries) {
		options.onProgress?.(name, "start");

		try {
			await generate(orvalConfig);
			const outputPath = resolveOutputPath(name, config);

			await extractMainInterface(outputPath, name, fkMap, parentRelationsMap);

			results.push({ name, success: true, outputPath });
			options.onProgress?.(name, "success");
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : "Unknown error";
			results.push({ name, success: false, error: errorMsg });
			options.onProgress?.(name, "error");
		}
	}

	const successCount = results.filter(r => r.success).length;
	console.log(
		`\n✨ ${successCount}/${entries.length} schema(s) generated successfully`,
	);

	await rm(config.tempDir, { recursive: true, force: true });
	await rmdir(config.tempDir).catch(() => {});

	options.onComplete?.(results);

	return results;
}

export async function main(): Promise<void> {
	try {
		await runGenerator();
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}

	process.exit(0);
}
