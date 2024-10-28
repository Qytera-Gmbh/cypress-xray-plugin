import { errorMessage, LoggedError } from "../util/errors";
import { Level, LOG } from "../util/logging";

/**
 * Decorates the method with an error handler which automatically logs errors and rethrows
 * afterwards.
 *
 * @param parameters - decorator parameters
 * @returns the decorated method
 *
 * @see https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#writing-well-typed-decorators
 * @see https://www.typescriptlang.org/docs/handbook/decorators.html#decorator-factories
 */
export function loggedRequest(parameters: {
    /**
     * The human-readable purpose of this method. Will be used for error messages.
     *
     * @example "get users"
     */
    purpose: string;
}) {
    return function decoratorFunction<This, P extends unknown[], R>(
        target: (this: This, ...args: P) => Promise<R> | R,
        context: ClassMethodDecoratorContext<This, (this: This, ...args: P) => Promise<R> | R>
    ) {
        const methodName = String(context.name);
        const decorated = async function (this: This, ...args: P): Promise<R> {
            try {
                return await target.call(this, ...args);
            } catch (error: unknown) {
                LOG.message(Level.ERROR, `Failed to ${parameters.purpose}: ${errorMessage(error)}`);
                LOG.logErrorToFile(error, `${methodName}Error`);
                throw new LoggedError(`Failed to ${parameters.purpose}`);
            }
        };
        return decorated;
    };
}
