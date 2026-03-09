import { ERROR_CODES, HTTP_STATUS } from "@/shared/constants";

describe("constants", () => {
	describe("HTTP_STATUS", () => {
		it("deve ter os status codes corretos", () => {
			expect(HTTP_STATUS.OK).toBe(200);
			expect(HTTP_STATUS.CREATED).toBe(201);
			expect(HTTP_STATUS.NO_CONTENT).toBe(204);
			expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
			expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
			expect(HTTP_STATUS.FORBIDDEN).toBe(403);
			expect(HTTP_STATUS.NOT_FOUND).toBe(404);
			expect(HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(422);
			expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
			expect(HTTP_STATUS.BAD_GATEWAY).toBe(502);
		});
	});

	describe("ERROR_CODES", () => {
		it("deve ter os códigos de erro corretos", () => {
			expect(ERROR_CODES.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
			expect(ERROR_CODES.NOT_FOUND).toBe("NOT_FOUND");
			expect(ERROR_CODES.ENTITY_VALIDATION_ERROR).toBe(
				"ENTITY_VALIDATION_ERROR",
			);
			expect(ERROR_CODES.DOCUMENT_VALIDATION_ERROR).toBe(
				"DOCUMENT_VALIDATION_ERROR",
			);
			expect(ERROR_CODES.BUSINESS_RULE_ERROR).toBe("BUSINESS_RULE_ERROR");
			expect(ERROR_CODES.EXTERNAL_API_ERROR).toBe("EXTERNAL_API_ERROR");
			expect(ERROR_CODES.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
			expect(ERROR_CODES.FASTIFY_ERROR).toBe("FASTIFY_ERROR");
		});
	});
});
