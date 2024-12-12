import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { computeOverlap } from "./set";

describe(relative(cwd(), __filename), async () => {
    await describe("computeOverlap", async () => {
        await it("computes the overlap of arrays", () => {
            assert.deepStrictEqual(computeOverlap([1, 2, 3], [2, 5, 9, 1]), {
                intersection: [1, 2],
                leftOnly: [3],
                rightOnly: [5, 9],
            });
        });

        await it("computes the overlap of identical iterables", () => {
            assert.deepStrictEqual(computeOverlap([4, 1, 3, 2], new Set([1, 4, 2, 3])), {
                intersection: [4, 1, 3, 2],
                leftOnly: [],
                rightOnly: [],
            });
        });

        await it("computes the overlap of partly empty iterables", () => {
            assert.deepStrictEqual(computeOverlap(new Set([3, 2, 1]), []), {
                intersection: [],
                leftOnly: [3, 2, 1],
                rightOnly: [],
            });
        });

        await it("computes the overlap of empty iterables", () => {
            assert.deepStrictEqual(computeOverlap(new Set(), []), {
                intersection: [],
                leftOnly: [],
                rightOnly: [],
            });
        });
    });
});
