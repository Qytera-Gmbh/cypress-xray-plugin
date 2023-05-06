// https://stackoverflow.com/a/53229567
type UnionKeys<T> = T extends T ? keyof T : never;
type Expand<T> = T extends T ? { [K in keyof T]: T[K] } : never;
export type OneOf<T extends {}[]> = {
    [K in keyof T]: Expand<
        T[K] & Partial<Record<Exclude<UnionKeys<T[number]>, keyof T[K]>, never>>
    >;
}[number];

// small utility types to better express meaning of other types
export type DateTimeISO = string;
