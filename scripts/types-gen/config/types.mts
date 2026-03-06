import type { Options } from "orval";

export interface OrvalEntry {
	name: string;
	config: Options;
}

export interface ParentVirtualField {
	fieldName: string;
	typeName: string;
	isArray: boolean;
}

export interface HasRelation {
	collection: string;
	fkAlias?: string;
}

export interface CollectionInput {
	collection: string;
	name: string;
	hasMany?: HasRelation[];
	hasOne?: HasRelation[];
}

export interface GenerationResult {
	name: string;
	success: boolean;
	outputPath?: string;
	error?: string;
}
