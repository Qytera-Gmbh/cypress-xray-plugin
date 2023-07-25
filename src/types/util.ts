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
 * Return an enum key based on its value, i.e. performs a reverse lookup of enum values to enum
 * keys.
 *
 * @param enumType the enum
 * @param enumValue the enum value
 * @returns the corresponding enum key or null if there are zero or more than one matching keys
 * @see https://stackoverflow.com/a/54297863
 */
export function getEnumKeyByEnumValue<K extends string, V extends string | number>(
    enumType: { [key in K]: V },
    enumValue: V
): string | null {
    const keys = Object.keys(enumType).filter((x: string) => enumType[x] === enumValue);
    return keys.length === 1 ? keys[0] : null;
}

/**
 * Type describing mappings of string keys to arbitrary values.
 */
export type StringMap<T> = {
    [key: string]: T;
};
