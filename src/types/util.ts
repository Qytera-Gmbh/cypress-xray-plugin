// small utility types to better express meaning of other types
export type DateTimeISO = string;

/**
 * Utility function which asserts that a value is neither `null` nor `undefined`.
 *
 * @param value - the value
 * @returns `true` if it is neither `null` nor `undefined`, otherwise `false`
 */
export function nonNull<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

/**
 * Type describing mappings of string keys to arbitrary values.
 */
export type StringMap<T> = {
    [key: string]: T;
};

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
 * const remapped: Remapping<A, string> = {
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
export type Remapping<T extends object, V> = {
    [K in keyof Required<T>]: Required<T>[K] extends object
        ? Required<T>[K] extends Array<unknown>
            ? V
            : Remapping<Required<T>[K], V>
        : V;
};
