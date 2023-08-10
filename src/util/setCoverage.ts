import { dedent } from "./dedent";

/**
 * A very basic, greedy implementation of the
 * [set coverage problem](https://en.wikipedia.org/wiki/Set_cover_problem). It combines subsets
 * until all elements in the source set have been covered in a greatest-subsets-first-fashion. All
 * sets included in the result will be disjoint, meaning that each element will be covered exactly
 * once.
 *
 * Note: This method requires singleton subsets (sets containing just on element) to exist for each
 * element in the source set.
 *
 * @param set the source set
 * @param subsets the subsets to combine into the source set
 * @returns the subset combinations
 */
export function setCoverage<T>(set: T[], ...subsets: T[][]): T[][] {
    assertAllSingletonSubsetsExist(set, ...subsets);
    const sortedSubsets: Set<T>[] = subsets
        .sort((a, b) => b.length - a.length)
        .map((subset) => {
            const set: Set<T> = new Set<T>();
            subset.forEach((element) => set.add(element));
            return set;
        });
    const remainingElements: Set<T> = new Set<T>();
    set.forEach((element) => remainingElements.add(element));
    const bestSubsets: Set<T>[] = [];
    while (remainingElements.size > 0) {
        sortedSubsets.forEach((subset: Set<T>) => {
            // Don't cover (possibly already covered) elements unnecessarily.
            if (subset.size > remainingElements.size) {
                return;
            }
            if (containsAll(remainingElements, subset)) {
                bestSubsets.push(subset);
                subset.forEach((element: T) => remainingElements.delete(element));
            }
        });
    }
    return bestSubsets.map((set) => [...set]);
}

function assertAllSingletonSubsetsExist<T>(set: T[], ...sets: T[][]) {
    const problematicElements = elementsWithoutSingletonSets(set, ...sets);
    if (problematicElements.length > 0) {
        throw new Error(
            dedent(`
                Cannot build set coverage for: ${`[${set.join(", ")}]`}
                There are elements without singleton subsets: ${`[${problematicElements.join(
                    ", "
                )}]`}

                Subsets:
                  ${sets.map((array) => `[${array.join(", ")}]`).join("\n")}
            `)
        );
    }
}

function elementsWithoutSingletonSets<T>(set: T[], ...sets: T[][]): T[] {
    return set.filter((value) => !containsSingletonSet(value, ...sets));
}

function containsSingletonSet<T>(value: T, ...sets: T[][]) {
    return sets.some((subset) => {
        return subset.length === 1 && subset.includes(value);
    });
}

function containsAll<T>(set: Set<T>, subset: Set<T>) {
    for (const value of subset.values()) {
        if (!set.has(value)) {
            return false;
        }
    }
    return true;
}
