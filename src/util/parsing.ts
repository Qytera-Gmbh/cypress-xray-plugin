/**
 * Parses and returns a boolean value from a string.
 *
 * @param value - a string that can be interpreted as a boolean value
 * @returns the corresponding boolean value
 * @see https://www.npmjs.com/package/yn
 */
export function asBoolean(value: string): boolean {
    value = String(value).trim();

    if (/^(?:y|yes|true|1|on)$/i.test(value)) {
        return true;
    }

    if (/^(?:n|no|false|0|off)$/i.test(value)) {
        return false;
    }

    throw new Error(`Failed to parse boolean value from string: ${value}`);
}

/**
 * No-op function for consistency purposes.
 *
 * @param value - the string
 * @returns the string
 */
export function asString(value: string): string {
    return value;
}

/**
 * Parses and returns a float value from a string.
 *
 * @param value - a string that can be interpreted as a float value
 * @returns the corresponding float value
 */
export function asFloat(value: string): number {
    return Number.parseFloat(value);
}

/**
 * Parses and returns an integer value from a string.
 *
 * @param value - a string that can be interpreted as an integer value
 * @returns the corresponding integer value
 */
export function asInt(value: string): number {
    return Number.parseInt(value);
}

/**
 * Parses an environment variable to arbitrary data types.
 *
 * @param env - the object holding all environment variables as key-value pairs
 * @param variable - the variable name
 * @param parser - the parsing function
 * @returns the parsed data or undefined if the variable does not exist
 */
export function parse<T>(
    env: Cypress.ObjectLike,
    variable: string,
    parser: (parameter: string) => T
): T | undefined {
    return variable in env ? parser(env[variable]) : undefined;
}
