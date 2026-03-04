import axios from "axios";
import { env } from "@/env.js";

const atacadoApi = axios.create({
	baseURL: env.ATACADO_API_URL,
	headers: {
		Authorization: `Bearer ${env.ATACADO_API_KEY}`,
		"Content-Type": "application/json",
		"X-App": " a_atacado",
		Accept: "application/json",
	},
});

export { atacadoApi };

export const atacadoRoutes = {
	parceiros: "/t_parceiros",
};
