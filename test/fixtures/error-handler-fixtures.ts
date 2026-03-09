import type { FastifyReply, FastifyRequest } from "fastify";

export const createMockRequest = (overrides?: Partial<FastifyRequest>) =>
	({
		method: "POST",
		url: "/test",
		body: {},
		log: {
			error: jest.fn(),
		},
		...overrides,
	}) as unknown as FastifyRequest;

export const createMockReply = () => {
	const reply = {
		status: jest.fn().mockReturnThis(),
		send: jest.fn().mockReturnThis(),
	} as unknown as FastifyReply;
	return reply;
};
