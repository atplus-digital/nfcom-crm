import type { Options } from "orval";
import type { GenerationConfig } from "../config/generation.js";

export function buildOrvalConfig(
	inputPath: string,
	name: string,
	config: GenerationConfig
): Options {
	return {
		input: { target: inputPath },
		output: {
			target: `${config.outputDir}/${name}.ts`,
			client: config.orvalClient,
			mode: config.orvalMode,
			biome: config.formatOutput,
		},
	};
}
