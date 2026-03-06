import type { Cliente } from "@/@types/atacado/Cliente";
import { LineProcessor } from "./linha-processor";
import type { ClientDetail, ProcessedLine } from "./types";

function createClientDetail(
	client: Cliente,
	lines: readonly ProcessedLine[],
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
