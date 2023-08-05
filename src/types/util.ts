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

/**
 * Dedents strings based on the first non-empty line contained within. Lines with less indentation
 * than the first non-empty line are indented at least as much as that line (which is different to
 * what other libraries like [dedent](https://www.npmjs.com/package/dedent) do).
 *
 * This also applies to expression whitespace.
 *
 * @param string the string
 * @returns the dedented string
 */
export function dedent(string: string): string {
    // Trim newline whitespace in the front and all whitespace in the back.
    const lines = string
        .replace(/^(\s*\n)*/, "")
        .trimEnd()
        .split("\n");
    const indents = lines.map((line) => line.length - line.trimStart().length);
    const baseIndent = indents[0];
    const dedentedLines: string[] = [];
    let lastTrueIndent = 0;
    lines.forEach((line, i) => {
        let indentLength = 0;
        let indent = "";
        if (i > 0) {
            if (indents[i] < baseIndent) {
                indentLength = indents[lastTrueIndent] + indents[i] - baseIndent;
            } else {
                lastTrueIndent = i;
                indentLength = indents[i] - baseIndent;
            }
            indent = " ".repeat(indentLength);
        }
        // Replace whitespace in the front with calculated indent, then trim all trailing
        // whitespace. Trimming after concatenation replaces blank lines with the empty string.
        dedentedLines.push(`${indent}${line.trimStart()}`.trimEnd());
    });
    return dedentedLines.join("\n").trim();
}
