import { readFileSync } from "fs";

/**
 * Encodes and returns some file's content in base64.
 * @param file path to the file to encode
 * @returns the base64 string
 */
export function encodeBase64(file: string): string {
    return readFileSync(file, { encoding: "base64" });
}
