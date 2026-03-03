import fastify from "fastify";

const server = fastify();

server.get("/", async (request, reply) => {
	return "pong\n";
});

server.listen({ port: 3000, host: "127.0.0.1" }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Server listening at ${address}`);
});
