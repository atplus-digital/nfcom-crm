export interface InvalidField {
	campo: string;
	label: string;
}

export interface EntityValidationResult {
	id: string | number;
	name: string;
	valid: boolean;
	invalidFields: InvalidField[];
}

export interface ValidationResult {
	success: boolean;
}
