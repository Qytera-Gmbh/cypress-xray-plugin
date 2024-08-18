import { MaybeFunction } from "../types/util";

/**
 * If the value is a function, evaluates it and returns the result. Otherwise, the value will be
 * returned immediately.
 *
 * @param value - the value
 * @returns the value or the callback result
 */
export async function getOrCall<T>(value: MaybeFunction<T>): Promise<T> {
    // See https://github.com/microsoft/TypeScript/issues/37663#issuecomment-1081610403
    if (isFunction(value)) {
        return await value();
    }
    return value;
}

function isFunction<T extends (...args: unknown[]) => unknown>(value: unknown): value is T {
    return typeof value === "function";
}
