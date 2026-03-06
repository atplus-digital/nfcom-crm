import type { Cliente } from "@/@types/atacado/Cliente";
import type { ClientDetail, ProcessedLine } from "../schemas";
import { LineProcessor } from "./linha-processor";

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
