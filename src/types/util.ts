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
export type Remap<T extends object, V> = {
    [K in keyof Required<T>]: Required<T>[K] extends object
        ? Required<T>[K] extends unknown[]
            ? V
            : Remap<Required<T>[K], V>
        : V;
};
