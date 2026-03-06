export const HEADERS = {
	AUTHORIZATION: "Authorization",
	CONTENT_TYPE: "Content-Type",
	ACCEPT: "Accept",
	X_APP: "X-App",
} as const;

export const API_HEADERS = {
	[HEADERS.CONTENT_TYPE]: "application/json",
	[HEADERS.ACCEPT]: "application/json",
	[HEADERS.X_APP]: "a_atacado",
} as const;

export const PAGINATION = {
	DEFAULT_PAGE_SIZE: 9999,
	MAX_PAGE_SIZE: 9999,
} as const;
