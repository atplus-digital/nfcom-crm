import axios from "axios";
import { env } from "@/env";

export const atacadoRoutes = {
	parceiros: "/t_parceiros",
	clientes: "/t_clientes",
	planosDeServico: "/t_planos_de_servico",
};

export const atacadoApi = axios.create({
	baseURL: env.ATACADO_API_URL,
	headers: {
		Authorization: `Bearer ${env.ATACADO_API_KEY}`,
		"Content-Type": "application/json",
		"X-App": " a_atacado",
		Accept: "application/json",
	},
});
