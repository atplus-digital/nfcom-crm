import {
	addDays as addDaysFns,
	addMonths as addMonthsFns,
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

function addMonths(date: Date, months: number): Date {
	return addMonthsFns(date, months);
}

function addDays(date: Date, days: number): Date {
	return addDaysFns(date, days);
}

function calculateDueDate(referenceDate: string, dueDay: number): string {
	const today = new Date();
	const minimumLimit = addDaysFns(today, DATES.MIN_DAYS_TO_DUE_DATE);

	const refDate = parseLocalDate(referenceDate);
	let dueDate = setDate(addMonthsFns(refDate, 1), dueDay);

	if (isBefore(dueDate, minimumLimit)) {
		dueDate = minimumLimit;
	}

	return formatToISODate(dueDate);
}

export {
	formatToISODate,
	parseLocalDate,
	addMonths,
	addDays,
	calculateDueDate,
};
