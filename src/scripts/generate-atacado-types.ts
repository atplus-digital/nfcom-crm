import { generate } from "orval";
import { atacadoApi } from "@/services/atacado/atacado-api.js";
import { getOrvalConfig } from "./orval.config.js";

async function generateAtacadoTypes() {
	const config = getOrvalConfig();
	await generate(config);
}

generateAtacadoTypes();
