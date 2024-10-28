import { errorMessage, LoggedError } from "../util/errors";
import { Level, LOG } from "../util/logging";

/**
 * Decorates the method with an error handler which automatically logs errors and rethrows
 * afterwards.
 *
 * @param purpose - the purpose of the method
 * @returns the decorated method
 */
export function loggedRequest(purpose: string) {
    return function decoratorFunction<This, P extends unknown[], R>(
        target: (this: This, ...args: P) => Promise<R> | R,
        context: ClassMethodDecoratorContext<This, (this: This, ...args: P) => Promise<R> | R>
    ) {
        const methodName = String(context.name);
        const decorated = async function (this: This, ...args: P): Promise<R> {
            try {
                return await target.call(this, ...args);
            } catch (error: unknown) {
                LOG.message(Level.ERROR, `Failed to ${purpose}: ${errorMessage(error)}`);
                LOG.logErrorToFile(error, `${methodName}Error`);
                throw new LoggedError(`Failed to ${purpose}`);
            }
        };
        return decorated;
    };
}
