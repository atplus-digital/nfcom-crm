import * as cpfCnpjValidator from "cpf-cnpj-validator";

export const validateCPF = (cpf: string): boolean => {
	return cpfCnpjValidator.cpf.isValid(cpf);
};

export const validateCNPJ = (cnpj: string): boolean => {
	return cpfCnpjValidator.cnpj.isValid(cnpj);
};
