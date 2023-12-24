/**
 * Converts an unknown value to a string.
 *
 * @param value - the value
 * @returns the string
 */
export function unknownToString(value: unknown): string {
    switch (typeof value) {
        case "string":
            return value;
        case "number":
        case "bigint":
        case "boolean":
        case "symbol":
        case "function":
            return value.toString();
        case "undefined":
            return "undefined";
        case "object":
            return JSON.stringify(value);
    }
}
