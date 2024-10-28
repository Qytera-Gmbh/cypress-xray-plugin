import ansiColors from "ansi-colors";

/**
 * Converts an unknown value to a string.
 *
 * @param value - the value
 * @param pretty - `true` to pretty print the string (if possible), `false` otherwse
 * @returns the string
 */
export function unknownToString(value: unknown, pretty?: boolean): string {
    switch (typeof value) {
        case "string":
            return value;
        case "number":
        case "boolean":
        case "symbol":
        case "function":
            return value.toString();
        case "undefined":
            return "undefined";
        case "object":
            if (pretty) {
                return JSON.stringify(value, null, 2);
            }
            return JSON.stringify(value);
        default:
            throw new Error(`Unknown value type: ${ansiColors.red(String(value))}`);
    }
}
