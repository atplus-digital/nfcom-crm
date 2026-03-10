import type { Cliente } from "@/@types/atacado/Cliente";
import type { ClientDetail, ProcessedLine } from "../../invoice.schemas";
import { LineProcessor } from "./line-processor";

function createClientDetail(
	client: Cliente,
	lines: ProcessedLine[],
	total: number,
): ClientDetail {
	const groupedLines = LineProcessor.groupLinesByPlan(lines);

	return {
		client,
		total,
		totalLines: lines.length,
		lines,
		groupedLines,
	};
}

export { createClientDetail };
