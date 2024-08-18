// small utility types to better express meaning of other types
export type DateTimeIso = string;

/**
 * Type describing mappings of string keys to arbitrary values.
 */
export type StringMap<T> = Record<string, T>;

/**
 * A type which recursively remaps _all_ properties of an object (including optional ones) to a new
 * type `V`.
 *
 * @example
 * ```ts
 * interface A {
 *   a: number;
 *   b: unknown[];
 *   c: {
 *     d: T;
 *     e: {
 *       f: number;
 *     }
 *   }
 * }
 *
 * const remapped: Remap<A, string> = {
 *   a: "these",
 *   b: "properties",
 *   c: {
 *     d: "have been",
 *     e: {
 *       f: "remapped"
 *     }
 *   }
 * }
 * ```
 */
export type Remap<T extends object, V, E extends number | string | symbol = never> = {
    [K in keyof Required<T>]: Required<T>[K] extends object // shortcuts simple types
        ? K extends E // shortcuts excluded properties
            ? V
            : Required<T>[K] extends unknown[] // shortcuts array types
            ? V
            : string extends keyof Required<T>[K] // shortcuts indexed types
            ? V
            : Remap<Required<T>[K], V, E>
        : V;
};

/**
 * Represents a value that may be wrapped in a callback.
 */
export type MaybeFunction<T> = (() => Promise<T> | T) | T;
