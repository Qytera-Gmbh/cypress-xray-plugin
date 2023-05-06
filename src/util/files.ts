/**
 * Normalizes a filename by replacing invalid character sequences with `_`.
 *
 * @param filename any filename
 * @returns the normalized filename
 */
export function normalizedFilename(filename: string): string {
    return filename.replaceAll(/[^\.a-zA-Z0-9]+/g, "_");
}
