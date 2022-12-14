/**
 * Parses and returns a boolean value from a string.
 *
 * @param value a string that can be interpreted as a boolean value
 * @returns the corresponding boolean value
 * @see https://www.npmjs.com/package/yn
 */
export function parseBoolean(value: string): boolean {
    value = String(value).trim();

    if (/^(?:y|yes|true|1|on)$/i.test(value)) {
        return true;
    }

    if (/^(?:n|no|false|0|off)$/i.test(value)) {
        return false;
    }

    throw new Error(`Failed to parse boolean value from string: ${value}`);
}
