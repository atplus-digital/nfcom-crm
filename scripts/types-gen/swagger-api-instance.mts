import axios from "axios";
import { configDotenv } from "dotenv";

configDotenv({ path: ".env" });

export const swaggerApi = axios.create({
	baseURL: process.env.ATACADO_API_URL || "",
	headers: {
		Authorization: `Bearer ${process.env.ATACADO_API_KEY}`,
		"Content-Type": "application/json",
		"X-App": " a_atacado",
		Accept: "application/json",
	},
});
