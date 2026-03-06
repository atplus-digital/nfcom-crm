import {
	addDays,
	addMonths,
	format,
	isBefore,
	parseISO,
	setDate,
} from "date-fns";
import { DATES } from "../constants";

function formatToISODate(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

function parseLocalDate(dateString: string): Date {
	return parseISO(dateString);
}

function addMeses(date: Date, months: number): Date {
	return addMonths(date, months);
}

function addDias(date: Date, days: number): Date {
	return addDays(date, days);
}

function calcularVencimento(
	dataReferencia: string,
	diaVencimento: number,
): string {
	const hoje = new Date();
	const limiteMinimo = addDays(hoje, DATES.MIN_DAYS_TO_DUE_DATE);

	const dataRef = parseLocalDate(dataReferencia);
	let vencimento = setDate(addMonths(dataRef, 1), diaVencimento);

	if (isBefore(vencimento, limiteMinimo)) {
		vencimento = limiteMinimo;
	}

	return formatToISODate(vencimento);
}

export {
	formatToISODate,
	parseLocalDate,
	addMeses,
	addDias,
	calcularVencimento,
};
