import { mkdir } from "node:fs/promises";
import { COLLECTIONS } from "./collections-config.mjs";
import { buildOrvalConfig } from "./orval-config.mts";
import { fetchSpec } from "./fetch-spec.mts";
import type { OrvalEntry } from "./types.mts";

export async function prepareEntries(): Promise<OrvalEntry[]> {
	await mkdir(".tmp", { recursive: true });

	const results = await Promise.all(
		COLLECTIONS.map(async (col) => {
			console.log(`⏳ ${col.name}`);
			const specPath = await fetchSpec(col.name, col.collection);

			if (!specPath) return null;

			return {
				name: col.name,
				config: buildOrvalConfig(specPath, col.name),
			} satisfies OrvalEntry;
		})
	);

	return results.filter((e): e is OrvalEntry => e !== null);
}
