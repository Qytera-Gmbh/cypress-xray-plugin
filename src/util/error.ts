/**
 * Returns an error message of any error.
 *
 * @param error the error
 * @returns the error message
 */
export function errorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return `${error}`;
}
