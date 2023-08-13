/**
 * Checks whether two arrays contain exactly the same elements, regardless of order.
 *
 * @param a the first array
 * @param b the second array
 * @returns if `a` and `b` contain the same elements
 */
export function equalsIgnoreOrder<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    return a.every((element: T) => b.includes(element));
}
