import fastify from "fastify";
import { env } from "./env.js";
import { atacadoApi } from "./services/atacado/atacado-api.js";

const server = fastify();

server.get("/", async () => {
	const response = await atacadoApi.get(
		"/swagger:get?ns=collections/t_nfcom_cobrancas"
	);

	return response.data;
});

server.listen(
	{ port: env.SERVER_PORT, host: env.SERVER_URL },
	(err, address) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.log(`Server listening at ${address}`);
	}
);
