import type { ObjectLike } from "../models/cypress";
import { dedent } from "./dedent";
import { unknownToString } from "./string";

/**
 * Parses and returns a boolean value.
 *
 * @param value - a value that can be interpreted as a boolean value
 * @returns the corresponding boolean value
 * @see https://www.npmjs.com/package/yn
 */
export function asBoolean(value: unknown): boolean {
    const stringValue = asString(value).trim();
    if (/^(?:y|yes|true|1|on)$/i.test(stringValue)) {
        return true;
    }
    if (/^(?:n|no|false|0|off)$/i.test(stringValue)) {
        return false;
    }
    throw new Error(`Failed to parse boolean value from string: ${stringValue}`);
}

/**
 * No-op function for consistency purposes.
 *
 * @param value - the string
 * @returns the string
 */
export function asString(value: unknown): string {
    return String(value);
}

/**
 * Parses and returns a float value.
 *
 * @param value - a value that can be interpreted as a float
 * @returns the corresponding float value
 */
export function asFloat(value: unknown): number {
    return Number.parseFloat(asString(value));
}

/**
 * Parses and returns an integer value.
 *
 * @param value - a value that can be interpreted as an integer value
 * @returns the corresponding integer value
 */
export function asInt(value: unknown): number {
    return Number.parseInt(asString(value));
}

/**
 * Parses and returns an array of strings from an unknown value. If the value is not an array,
 * contains zero elements or non-primitive elements, corresponding errors will be thrown.
 *
 * @param value - a string that can be interpreted as a string array
 * @returns the corresponding string array
 */
export function asArrayOfStrings(value: unknown): [string, ...string[]] {
    if (!Array.isArray(value)) {
        throw new Error(
            dedent(`
                Failed to parse as array of strings: ${JSON.stringify(value)}
                Expected an array of primitives, but got: ${unknownToString(value)}
            `)
        );
    }
    const array = value.map((element: unknown, index: number) => {
        if (
            typeof element === "string" ||
            typeof element === "boolean" ||
            typeof element === "number" ||
            typeof element === "symbol" ||
            typeof element === "bigint"
        ) {
            return element.toString();
        }
        throw new Error(
            dedent(`
                Failed to parse as array of strings: ${JSON.stringify(value)}
                Expected a primitive element at index ${index.toString()}, but got: ${JSON.stringify(
                    element
                )}
            `)
        );
    });
    if (array.length === 0) {
        throw new Error(
            dedent(`
                Failed to parse as array of strings: ${JSON.stringify(value)}
                Expected an array of primitives with at least one element
            `)
        );
    }
    return [array[0], ...array.slice(1)];
}

/**
 * Parses and returns an object from an unknown value. If the value is not an object, corresponding
 * errors will be thrown.
 *
 * @param value - a string that can be interpreted as an object
 * @returns the corresponding object
 */
export function asObject(value: unknown): object {
    if (Array.isArray(value)) {
        throw new Error(`Failed to parse as object: ${JSON.stringify(value)}`);
    }
    if (value === null) {
        throw new Error("Failed to parse as object: null");
    }
    if (value === undefined) {
        throw new Error("Failed to parse as object: undefined");
    }
    if (
        typeof value === "string" ||
        typeof value === "boolean" ||
        typeof value === "number" ||
        typeof value === "symbol" ||
        typeof value === "bigint"
    ) {
        throw new Error(`Failed to parse as object: ${value.toString()}`);
    }
    return value;
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
    env: ObjectLike,
    variable: string,
    parser: (parameter: unknown) => T
): T | undefined {
    if (variable in env) {
        return parser(env[variable]);
    }
    return undefined;
}
