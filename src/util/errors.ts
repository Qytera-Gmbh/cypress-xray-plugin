import { unknownToString } from "./string";

/**
 * Returns an error message of any error.
 *
 * @param error - the error
 * @returns the error message
 */
export function errorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return unknownToString(error);
}

/**
 * An error which has been logged to a file or other log locations already.
 */
export class LoggedError extends Error {}

/**
 * Assesses whether the given error is an instance of a {@link LoggedError | `LoggedError`}.
 *
 * @param error - the error
 * @returns `true` if the error is a {@link LoggedError | `LoggedError`}, otherwise `false`
 */
export function isLoggedError(error: unknown): boolean {
    return error instanceof LoggedError;
}
