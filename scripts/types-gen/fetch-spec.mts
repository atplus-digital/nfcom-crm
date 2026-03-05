import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { swaggerApi } from "./swagger-api-instance.mts";
import { API_TIMEOUT, TEMP_DIR } from "./constants.mts";

export async function fetchSpec(
	name: string,
	collection: string
): Promise<string | null> {
	const params = new URLSearchParams({ ns: `collections/${collection}` });
	const url = `/swagger:get?${params.toString()}`;
	try {
		const { data } = await swaggerApi.get(url, { timeout: API_TIMEOUT });
		const dest = join(TEMP_DIR, `${name}.json`);
		await writeFile(dest, JSON.stringify(data));
		return dest;
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Erro desconhecido";
		console.warn(`⚠️  [${name}] ${msg}`);
		return null;
	}
}
