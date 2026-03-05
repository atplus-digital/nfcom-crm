import { COLLECTIONS } from "./collections-config.mjs";
import type { ParentVirtualField } from "./types.mts";

export function buildFkMap(): Map<string, string> {
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

export function buildParentRelationsMap(): Map<string, ParentVirtualField[]> {
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
