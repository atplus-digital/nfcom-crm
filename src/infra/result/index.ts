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

export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> =>
	result.success === true;

export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> =>
	result.success === false;

export const unwrap = <T, E>(result: Result<T, E>): T => {
	if (isSuccess(result)) return result.data;
	throw result.error;
};

export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
	if (isSuccess(result)) return result.data;
	return defaultValue;
};

export const map = <T, E, U>(
	result: Result<T, E>,
	fn: (data: T) => U,
): Result<U, E> => {
	if (isSuccess(result)) return Success(fn(result.data));
	return result;
};

export const mapError = <T, E, F>(
	result: Result<T, E>,
	fn: (error: E) => F,
): Result<T, F> => {
	if (isFailure(result)) return Failure(fn(result.error));
	return result as Result<T, F>;
};

export const flatMap = <T, E, U>(
	result: Result<T, E>,
	fn: (data: T) => Result<U, E>,
): Result<U, E> => {
	if (isSuccess(result)) return fn(result.data);
	return result;
};

export const combine = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
	const values: T[] = [];
	for (const result of results) {
		if (isFailure(result)) return result;
		values.push(result.data);
	}
	return Success(values);
};
