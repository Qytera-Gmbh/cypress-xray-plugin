// small utility types to better express meaning of other types
export type DateTimeIso = string;

/**
 * Type describing mappings of string keys to arbitrary values.
 */
export type StringMap<T> = Record<string, T>;

/**
 * Represents a value that may be wrapped in a callback.
 */
export type MaybeFunction<P extends unknown[], T> = ((...args: P) => Promise<T> | T) | T;
