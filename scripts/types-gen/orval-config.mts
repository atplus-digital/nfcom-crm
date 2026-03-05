import { join } from "node:path";
import type { Options } from "orval";
import { OUTPUT_DIR } from "./constants.mts";

export function buildOrvalConfig(input: string, name: string): Options {
	return {
		input: { target: input },
		output: {
			target: join(OUTPUT_DIR, `${name}.ts`),
			client: "axios",
			mode: "single",
			biome: true,
			mock: true,
		},
	};
}
