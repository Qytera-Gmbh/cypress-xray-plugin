import type { MaybeFunction } from "../models/util";

/**
 * If the value is a function, evaluates it and returns the result. Otherwise, the value will be
 * returned immediately.
 *
 * @param value - the value
 * @returns the value or the callback result
 */
export async function getOrCall<P extends unknown[], T>(
    value: MaybeFunction<P, T>,
    ...args: P
): Promise<T> {
    // See https://github.com/microsoft/TypeScript/issues/37663#issuecomment-1081610403
    if (isFunction(value)) {
        return await value(...args);
    }
    return value;
}

function isFunction<P extends unknown[], T>(
    value: MaybeFunction<P, T>
): value is (...args: P) => Promise<T> | T {
    return typeof value === "function";
}
