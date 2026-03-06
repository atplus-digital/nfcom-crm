import {
	addDays,
	addMonths,
	format,
	isBefore,
	parseISO,
	setDate,
} from "date-fns";
import { DATES } from "../fatura.constants";

function formatToISODate(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

function calculateDueDate(referenceDate: string, dueDay: number): string {
	const today = new Date();
	const minimumLimit = addDays(today, DATES.MIN_DAYS_TO_DUE_DATE);

	const refDate = parseISO(referenceDate);
	let dueDate = setDate(addMonths(refDate, 1), dueDay);

	if (isBefore(dueDate, minimumLimit)) {
		dueDate = minimumLimit;
	}

	return formatToISODate(dueDate);
}

export { formatToISODate, parseISO, addMonths, addDays, calculateDueDate };
