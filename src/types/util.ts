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

export type WithRequired<T extends object, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Type describing mappings of string keys to arbitrary values.
 */
export type StringMap<T> = {
    [key: string]: T;
};
