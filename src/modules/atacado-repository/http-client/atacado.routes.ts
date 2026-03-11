export const ATACADO_ROUTES = {
	parceiros: "/t_parceiros",
	clientes: "/t_clientes",
	planosDeServico: "/t_planos_de_servico",
	faturas: "/t_nfcom_faturas",
	cobrancas: "/t_nfcom_cobrancas",
	notasFiscais: "/t_nfcom_notas",
	itensNFCom: "/t_nfcom_itens",
} as const;

type AtacadoRoute = (typeof ATACADO_ROUTES)[keyof typeof ATACADO_ROUTES];

type RouteSuffix = ":get" | ":list" | ":create" | ":destroy";

export type AtacadoRouteWithSuffix =
	| AtacadoRoute
	| `${AtacadoRoute}${RouteSuffix}`
	| `${AtacadoRoute}/${string}`
	| `${AtacadoRoute}/${string}${RouteSuffix}`;
