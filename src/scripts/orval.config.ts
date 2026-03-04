import type { Options } from "orval";

function getOrvalConfig(): Record<string, Options> {
	return {
		petstore: {
			input: "./petstore.yaml",
			output: {
				target: "./petstore.ts",
				client: "zod",
			},
			hooks: {
				afterAllFilesWrite: "prettier --write",
			},
		},
	};
}
export { getOrvalConfig };
