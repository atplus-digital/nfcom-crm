import { mkdir, writeFile } from "node:fs/promises";
import type { GenerationConfig } from "../config/generation.mts";
import { createSwaggerClient } from "./swagger-client.mts";

export async function fetchSwaggerSpec(
	name: string,
	collection: string,
	config: GenerationConfig,
): Promise<string | null> {
	const client = createSwaggerClient();
	const params = new URLSearchParams({ ns: `collections/${collection}` });
	const url = `/swagger:get?${params.toString()}`;

	try {
		const { data } = await client.get(url, { timeout: config.apiTimeout });
		const dest = config.tempDir
			? `${config.tempDir}/${name}.json`
			: `${name}.json`;
		await mkdir(config.tempDir, { recursive: true });
		await writeFile(dest, JSON.stringify(data));
		return dest;
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Unknown error";
		console.warn(`⚠️  [${name}] ${msg}`);
		return null;
	}
}
