import { readFile, writeFile } from "node:fs/promises";
import type { ParentVirtualField } from "../config/types.mts";

export async function extractMainInterface(
	filePath: string,
	interfaceName: string,
	fkMap: Map<string, string>,
	parentRelationsMap: Map<string, ParentVirtualField[]>,
): Promise<void> {
	const lines = (await readFile(filePath, "utf-8")).split("\n");

	const body: string[] = [];
	const imports = new Set<string>();
	let insideInterface = false;
	let braceDepth = 0;

	for (const line of lines) {
		if (!insideInterface) {
			if (/^export interface T\w+\s*\{/.test(line)) {
				insideInterface = true;
				braceDepth =
					(line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
				body.push(
					line.replace(
						/^(export interface )T\w+(\s*\{)/,
						`$1${interfaceName}$2`,
					),
				);
				if (braceDepth <= 0) break;
			}
		} else {
			const isClosingBrace =
				braceDepth === 1 && line.trimStart().startsWith("}");
			if (isClosingBrace) {
				const parentFields = parentRelationsMap.get(interfaceName) ?? [];
				for (const { fieldName, typeName, isArray } of parentFields) {
					body.push(`\t${fieldName}?: ${typeName}${isArray ? "[]" : ""};`);
					imports.add(typeName);
				}
			}

			body.push(line);

			const fkMatch = line.match(/^(\t| {2})f_fk_(\w+)\??:\s*number;/);
			if (fkMatch) {
				const [, indent, fkSuffix] = fkMatch;
				const relatedType = fkMap.get(fkSuffix ?? "");
				if (relatedType && relatedType !== interfaceName) {
					body.push(`${indent}f_${fkSuffix}?: ${relatedType};`);
					imports.add(relatedType);
				}
			}

			braceDepth += (line.match(/\{/g) ?? []).length;
			braceDepth -= (line.match(/\}/g) ?? []).length;
			if (braceDepth <= 0) break;
		}
	}

	const importLines = Array.from(imports)
		.sort()
		.map((type) => `import type { ${type} } from "./${type}";`)
		.join("\n");

	const bodyStr = `${body.join("\n").trimEnd()}\n`;
	await writeFile(
		filePath,
		importLines ? `${importLines}\n\n${bodyStr}` : bodyStr,
		"utf-8",
	);
}
