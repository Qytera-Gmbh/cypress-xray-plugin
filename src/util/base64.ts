import { readFileSync } from "node:fs";

/**
 * Encodes and returns some file's content in base64.
 * @param file - path to the file to encode
 * @returns the base64 string
 */
export function encodeFile(file: string): string {
    return readFileSync(file, { encoding: "base64" });
}

/**
 * Encodes and returns some string in base64.
 * @param value - the string to encode
 * @returns the base64 encoded value
 */
export function encode(value: string): string {
    return Buffer.from(value).toString("base64");
}
