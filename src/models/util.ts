// small utility types to better express meaning of other types
export type DateTimeIso = string;

/**
 * Represents a value that may be wrapped in a callback.
 */
export type MaybeFunction<P extends unknown[], T> = ((...args: P) => Promise<T> | T) | T;
