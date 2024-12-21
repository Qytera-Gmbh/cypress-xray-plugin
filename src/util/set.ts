/**
 * Models the overlap of two iterables (called _left_ and _right_).
 */
interface Overlap<T> {
    /**
     * Elements which are present in both iterables.
     */
    intersection: T[];
    /**
     * Elements which are present in the left iterable only.
     */
    leftOnly: T[];
    /**
     * Elements which are present in the right iterable only.
     */
    rightOnly: T[];
}

/**
 * Computes the overlap of two iterables, i.e. their intersection and differences at the same time.
 *
 * @example
 *
 * ```ts
 * console.log(computeOverlap([1, 2, 3], [2, 5, 9, 1]));
 * // {
 * //   intersection: [1, 2],
 * //   leftOnly: [3],
 * //   rightOnly: [5, 9]
 * // }
 * ```
 *
 * @param left - the first iterable
 * @param right - the second iterable
 * @returns the overlap
 */
export function computeOverlap<T>(left: Iterable<T>, right: Iterable<T>): Overlap<T> {
    const sets: Overlap<T> = {
        intersection: [],
        leftOnly: [],
        rightOnly: [],
    };
    const leftSet = new Set<T>(left);
    const rightSet = new Set<T>(right);
    for (const element of leftSet) {
        if (rightSet.has(element)) {
            sets.intersection.push(element);
        } else {
            sets.leftOnly.push(element);
        }
    }
    for (const element of rightSet) {
        if (!leftSet.has(element)) {
            sets.rightOnly.push(element);
        }
    }
    return sets;
}
