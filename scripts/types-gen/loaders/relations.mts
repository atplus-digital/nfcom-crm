import { COLLECTIONS } from "../config/collections.mts";
import type { ParentVirtualField } from "../config/types.mts";

export interface RelationMaps {
	fkMap: Map<string, string>;
	parentRelationsMap: Map<string, ParentVirtualField[]>;
}

export function loadRelationMaps(): RelationMaps {
	const fkMap = new Map<string, string>();
	const parentRelationsMap = new Map<string, ParentVirtualField[]>();
	const collectionToName = new Map(
		COLLECTIONS.map(c => [c.collection, c.name]),
	);

	for (const col of COLLECTIONS) {
		fkMap.set(col.name.toLowerCase(), col.name);
		for (const rel of [...(col.hasMany ?? []), ...(col.hasOne ?? [])]) {
			if (rel.fkAlias) {
				fkMap.set(rel.fkAlias, col.name);
			}
		}
	}

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
			parentRelationsMap.set(col.name, fields);
		}
	}

	return { fkMap, parentRelationsMap };
}
