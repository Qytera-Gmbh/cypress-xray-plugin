// https://stackoverflow.com/a/53229567
type UnionKeys<T> = T extends T ? keyof T : never;
type Expand<T> = T extends T ? { [K in keyof T]: T[K] } : never;
export type OneOf<T extends NonNullable<unknown>[]> = {
    [K in keyof T]: Expand<
        T[K] & Partial<Record<Exclude<UnionKeys<T[number]>, keyof T[K]>, never>>
    >;
}[number];

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
