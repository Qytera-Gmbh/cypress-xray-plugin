/**
 * Converts the values of all given objects into strings and pads them such that values belonging to
 * the same property are strings of equal length. For stringification,
 * {@link JSON.stringify | `JSON.stringify`} is used.
 *
 * @example
 * ```ts
 * const a = {
 *   x: "hello",
 *   y: "bonjour"
 * };
 * const b = {
 *   x: "goodbye",
 *   b: 123456789
 * };
 * console.log(JSON.stringify(prettyPadObjects([a, b])));
 * // [
 * //   '{"x":"hello  ","y":"bonjour"}'
 * //   '{"x":"goodbye","b":"123456789"}'
 * // ]
 * ```
 *
 * @param objects - the objects to pretty pad
 * @returns the pretty padded objects
 */
export function prettyPadObjects(objects: object[]): Record<string, string>[] {
    const maxPropertyLengths: Record<string, number> = {};
    for (const obj of objects) {
        Object.entries(obj).forEach((entry) => {
            const valueLength = JSON.stringify(entry[1]).length;
            if (!(entry[0] in maxPropertyLengths) || valueLength > maxPropertyLengths[entry[0]]) {
                maxPropertyLengths[entry[0]] = valueLength;
            }
        });
    }
    const paddedObjects: Record<string, string>[] = objects.map((element: object) => {
        const prettiedEntries: [string, string][] = Object.entries(element).map(
            (entry: [string, unknown]) => {
                return [
                    entry[0],
                    JSON.stringify(entry[1]).padEnd(maxPropertyLengths[entry[0]], " "),
                ];
            }
        );
        return Object.fromEntries(prettiedEntries);
    });
    return paddedObjects;
}

/**
 * Pads the values of an object such that all values are mapped to strings of equal length. For
 * stringification, {@link JSON.stringify | `JSON.stringify`} is used.
 *
 * @example
 * ```ts
 * const a = {
 *   x: "hello",
 *   y: "bonjour"
 *   z: 123
 * };
 * console.log(JSON.stringify(prettyPadValues(a));
 * // '{"x":"hello  ","y":"bonjour","z":"123    "}'
 * ```
 *
 * @param value - the object
 * @returns the pretty padded object
 */
export function prettyPadValues(value: object): Record<string, string> {
    let maxPropertyLength = 0;
    Object.entries(value).forEach((entry) => {
        const valueLength = JSON.stringify(entry[1]).length;
        if (valueLength > maxPropertyLength) {
            maxPropertyLength = valueLength;
        }
    });
    const prettiedEntries: [string, string][] = Object.entries(value).map(
        (entry: [string, unknown]) => {
            return [entry[0], JSON.stringify(entry[1]).padEnd(maxPropertyLength, " ")];
        }
    );
    return Object.fromEntries(prettiedEntries);
}
