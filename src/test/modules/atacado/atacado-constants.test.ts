import {
	API_HEADERS,
	HEADERS,
	PAGINATION,
} from "@/modules/atacado/atacado.constants";

describe("atacado.constants", () => {
	describe("HEADERS", () => {
		it("deve ter os nomes de header corretos", () => {
			expect(HEADERS.AUTHORIZATION).toBe("Authorization");
			expect(HEADERS.CONTENT_TYPE).toBe("Content-Type");
			expect(HEADERS.ACCEPT).toBe("Accept");
			expect(HEADERS.X_APP).toBe("X-App");
		});
	});

	describe("API_HEADERS", () => {
		it("deve ter os valores de header padrão", () => {
			expect(API_HEADERS["Content-Type"]).toBe("application/json");
			expect(API_HEADERS.Accept).toBe("application/json");
			expect(API_HEADERS["X-App"]).toBe("a_atacado");
		});
	});

	describe("PAGINATION", () => {
		it("deve ter valores de paginação padrão", () => {
			expect(PAGINATION.DEFAULT_PAGE_SIZE).toBe(9999);
			expect(PAGINATION.MAX_PAGE_SIZE).toBe(9999);
		});
	});
});
