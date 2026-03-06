import { COLLECTIONS } from "../config/collections.js";
import { fetchSwaggerSpec } from "../services/spec-fetcher.js";
import { buildOrvalConfig } from "../services/orval-builder.js";
import type { GenerationConfig } from "../config/generation.js";
import type { OrvalEntry } from "../config/types.js";

export async function loadCollectionEntries(
	config: GenerationConfig
): Promise<OrvalEntry[]> {
	const results = await Promise.all(
		COLLECTIONS.map(async (col) => {
			console.log(`⏳ ${col.name}`);
			const specPath = await fetchSwaggerSpec(col.name, col.collection, config);

			if (!specPath) return null;

			return {
				name: col.name,
				config: buildOrvalConfig(specPath, col.name, config),
			} satisfies OrvalEntry;
		})
	);

	return results.filter((e): e is OrvalEntry => e !== null);
}
