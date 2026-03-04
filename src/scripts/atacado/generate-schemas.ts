import { mkdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generate, type Options } from "orval";
import { atacadoApi } from "@/services/atacado/atacado-api";
import { COLLECTIONS } from "./collections";

const OUTPUT_DIR = "./src/@types/atacado";
const TEMP_DIR = ".tmp";
const API_TIMEOUT = 15000;

interface OrvalEntry {
	name: string;
	config: Options;
}

function buildOrvalConfig(input: string, name: string): Options {
	return {
		input: { target: input },
		output: {
			target: join(OUTPUT_DIR, `${name}.ts`),
			client: "axios",
			mode: "single",
			biome: true,
		},
	};
}

async function fetchSpec(
	name: string,
	collection: string
): Promise<string | null> {
	const params = new URLSearchParams({ ns: `collections/${collection}` });
	const url = `/swagger:get?${params.toString()}`;

	try {
		const { data } = await atacadoApi.get(url, { timeout: API_TIMEOUT });
		const dest = join(TEMP_DIR, `${name}.json`);
		await writeFile(dest, JSON.stringify(data));
		return dest;
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Erro desconhecido";
		console.warn(`⚠️  [${name}] ${msg}`);
		return null;
	}
}

async function prepareEntries(): Promise<OrvalEntry[]> {
	await mkdir(TEMP_DIR, { recursive: true });

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

/** child FK alias → nome do tipo pai */
function buildFkMap(): Map<string, string> {
	const map = new Map<string, string>();
	for (const col of COLLECTIONS) {
		map.set(col.name.toLowerCase(), col.name);
		for (const rel of [...(col.hasMany ?? []), ...(col.hasOne ?? [])]) {
			if (rel.fkAlias) {
				map.set(rel.fkAlias, col.name);
			}
		}
	}
	return map;
}

interface ParentVirtualField {
	fieldName: string;
	typeName: string;
	isArray: boolean;
}

/** nome do tipo pai → campos virtuais a injetar na interface */
function buildParentRelationsMap(): Map<string, ParentVirtualField[]> {
	const collectionToName = new Map(
		COLLECTIONS.map((c) => [c.collection, c.name])
	);
	const map = new Map<string, ParentVirtualField[]>();

	for (const col of COLLECTIONS) {
		const fields: ParentVirtualField[] = [];

		for (const rel of col.hasMany ?? []) {
			const childName = collectionToName.get(rel.collection);
			if (childName) {
				fields.push({
					fieldName: rel.fkAlias ?? rel.collection,
					typeName: childName,
					isArray: true,
				});
			}
		}

		for (const rel of col.hasOne ?? []) {
			const childName = collectionToName.get(rel.collection);
			if (childName) {
				fields.push({
					fieldName: rel.fkAlias ?? rel.collection,
					typeName: childName,
					isArray: false,
				});
			}
		}

		if (fields.length > 0) {
			map.set(col.name, fields);
		}
	}

	return map;
}

async function runGeneration(entries: OrvalEntry[]): Promise<void> {
	console.log(`\n⚙️  Gerando ${entries.length} schema(s)...`);
	const fkMap = buildFkMap();
	const parentRelationsMap = buildParentRelationsMap();

	await Promise.all(
		entries.map(async ({ name, config }) => {
			await generate(config);
			const outputPath =
				typeof config.output === "object" ? config.output?.target : undefined;
			if (outputPath) {
				await extractMainInterface(outputPath, name, fkMap, parentRelationsMap);
			}
		})
	);
}

async function extractMainInterface(
	filePath: string,
	interfaceName: string,
	fkMap: Map<string, string>,
	parentRelationsMap: Map<string, ParentVirtualField[]>
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
						`$1${interfaceName}$2`
					)
				);
				if (braceDepth <= 0) break;
			}
		} else {
			// Injecta campos virtuais de relação filho→pai antes do fechamento
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

	const bodyStr = body.join("\n").trimEnd() + "\n";
	await writeFile(
		filePath,
		importLines ? `${importLines}\n\n${bodyStr}` : bodyStr,
		"utf-8"
	);
}

async function main(): Promise<void> {
	try {
		console.log(
			`🚀 Iniciando geração de schemas (${COLLECTIONS.length} collections)\n`
		);

		const entries = await prepareEntries();

		if (entries.length === 0) {
			console.warn("⚠️  Nenhuma collection foi processada");
			return;
		}

		await runGeneration(entries);
		console.log(`\n✨ ${entries.length} schema(s) gerado(s) com sucesso`);
	} catch (error) {
		console.error("❌ Erro:", error);
		process.exit(1);
	} finally {
		await rm(TEMP_DIR, { recursive: true, force: true });
		await rmdir(TEMP_DIR).catch(() => {});
	}

	process.exit(0);
}

export { main };
