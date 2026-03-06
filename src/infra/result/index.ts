type Success<T> = {
	readonly success: true;
	readonly data: T;
};

type Failure<E> = {
	readonly success: false;
	readonly error: E;
};

export type Result<T, E = Error> = Success<T> | Failure<E>;

export const Success = <T>(data: T): Success<T> => ({
	success: true,
	data,
});

export const Failure = <E>(error: E): Failure<E> => ({
	success: false,
	error,
});
