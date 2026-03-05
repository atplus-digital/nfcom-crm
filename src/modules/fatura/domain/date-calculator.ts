import {
	addDays,
	addMonths,
	isBefore,
	parseISO,
	setDate,
	format,
} from "date-fns";
import { DATES } from "../constants";

class DateCalculator {
	static formatToISODate(date: Date): string {
		return format(date, "yyyy-MM-dd");
	}

	static parseLocalDate(dateString: string): Date {
		return parseISO(dateString);
	}

	static addMonths(date: Date, months: number): Date {
		return addMonths(date, months);
	}

	static addDays(date: Date, days: number): Date {
		return addDays(date, days);
	}

	static calcularVencimento(
		dataReferencia: string,
		diaVencimento: number,
	): string {
		const hoje = new Date();
		const limiteMinimo = addDays(hoje, DATES.MIN_DAYS_TO_DUE_DATE);

		const dataRef = this.parseLocalDate(dataReferencia);
		let vencimento = setDate(addMonths(dataRef, 1), diaVencimento);

		if (isBefore(vencimento, limiteMinimo)) {
			vencimento = limiteMinimo;
		}

		return this.formatToISODate(vencimento);
	}
}

export { DateCalculator };
