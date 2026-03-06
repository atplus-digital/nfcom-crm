import { COLLECTIONS } from "../config/collections.mts";
import { fetchSwaggerSpec } from "../services/spec-fetcher.mts";
import { buildOrvalConfig } from "../services/orval-builder.mts";
import type { GenerationConfig } from "../config/generation.mts";
import type { OrvalEntry } from "../config/types.mts";

export async function loadCollectionEntries(
	config: GenerationConfig,
): Promise<OrvalEntry[]> {
	const results = await Promise.all(
		COLLECTIONS.map(async col => {
			console.log(`⏳ ${col.name}`);
			const specPath = await fetchSwaggerSpec(col.name, col.collection, config);

			if (!specPath) return null;

			return {
				name: col.name,
				config: buildOrvalConfig(specPath, col.name, config),
			} satisfies OrvalEntry;
		}),
	);

	return results.filter((e): e is OrvalEntry => e !== null);
}
