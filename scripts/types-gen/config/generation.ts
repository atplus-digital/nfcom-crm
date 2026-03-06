import { join } from "node:path";
import type { Options } from "orval";

export interface GenerationConfig {
	outputDir: string;
	tempDir: string;
	apiTimeout: number;
	orvalClient: Options["client"];
	orvalMode: Options["mode"];
	formatOutput: boolean;
}

export const defaultConfig: GenerationConfig = {
	outputDir: "./src/@types/atacado",
	tempDir: ".tmp",
	apiTimeout: 15000,
	orvalClient: "axios",
	orvalMode: "single",
	formatOutput: true,
};

export function resolveOutputPath(name: string, config: GenerationConfig): string {
	return join(config.outputDir, `${name}.ts`);
}

export function resolveTempPath(name: string, config: GenerationConfig): string {
	return join(config.tempDir, `${name}.json`);
}
