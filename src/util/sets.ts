import { dedent } from "./dedent";

/**
 * A very basic, greedy implementation of the
 * [set coverage problem](https://en.wikipedia.org/wiki/Set_cover_problem). It combines subsets
 * until all elements in the source set have been covered in a greatest-subsets-first-fashion. All
 * sets included in the result will be disjoint, meaning that each element will be covered exactly
 * once.
 *
 * Note: This method assumes that the given subsets can freely be subdivided further as required.
 *
 * @param set the source set
 * @param subsets the subsets to combine into the source set
 * @returns the subset combinations
 */
export function setCoverage<T>(set: T[], ...subsets: T[][]): T[][] {
    if (set.length === 0) {
        throw new Error("Cannot cover empty set");
    }
    if (subsets.length === 0) {
        throw new Error(
            dedent(`
                Cannot cover set: [${set.join(", ")}]
                No subsets were provided
            `)
        );
    }
    const sortedSubsets: Set<T>[] = subsets
        .sort((a: T[], b: T[]) => b.length - a.length)
        .map(toSet);
    const remainingElements: Set<T> = toSet(set);
    const covers: Set<T>[] = [];
    while (remainingElements.size > 0) {
        let bestSubsetIndex = 0;
        let bestIntersection: Set<T> = null;
        for (let i = 0; i < sortedSubsets.length; i++) {
            const intersection = intersect(remainingElements, sortedSubsets[i]);
            if (!bestIntersection || bestIntersection.size < intersection.size) {
                bestIntersection = intersection;
                bestSubsetIndex = i;
            }
        }
        if (!bestIntersection) {
            throw new Error(
                dedent(`
                    Cannot cover set: [${set.join(", ")}]
                    Some elements are missing from all subsets

                    Subsets:
                      ${subsets.map((subset) => `[${subset.join(", ")}]`).join("\n")}

                    Uncoverable elements:
                      [${[...remainingElements].join(", ")}]
                `)
            );
        }
        sortedSubsets.splice(bestSubsetIndex, 1);
        covers.push(bestIntersection);
        bestIntersection.forEach((element: T) => remainingElements.delete(element));
    }
    return covers.map(toArray);
}

function toSet<T>(array: T[]): Set<T> {
    const set: Set<T> = new Set<T>();
    array.forEach((element: T) => set.add(element));
    return set;
}

function toArray<T>(set: Set<T>): T[] {
    return [...set];
}

/**
 * Computes the intersection of two sets.
 *
 * @param a the first set
 * @param b the second set
 * @returns the intersection of `a` and `b`
 */
export function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
    const intersection: Set<T> = new Set<T>();
    for (const value of a.values()) {
        if (b.has(value)) {
            intersection.add(value);
        }
    }
    return intersection;
}
