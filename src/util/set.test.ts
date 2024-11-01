import { expect } from "chai";
import { describe, it } from "node:test";
import path from "path";
import { computeOverlap } from "./set.js";

await describe(path.relative(process.cwd(), import.meta.filename), async () => {
    await describe("computeOverlap", async () => {
        await it("computes the overlap of arrays", () => {
            expect(computeOverlap([1, 2, 3], [2, 5, 9, 1])).to.deep.eq({
                intersection: [1, 2],
                leftOnly: [3],
                rightOnly: [5, 9],
            });
        });

        await it("computes the overlap of identical iterables", () => {
            expect(computeOverlap([4, 1, 3, 2], new Set([1, 4, 2, 3]))).to.deep.eq({
                intersection: [4, 1, 3, 2],
                leftOnly: [],
                rightOnly: [],
            });
        });

        await it("computes the overlap of partly empty iterables", () => {
            expect(computeOverlap(new Set([3, 2, 1]), [])).to.deep.eq({
                intersection: [],
                leftOnly: [3, 2, 1],
                rightOnly: [],
            });
        });

        await it("computes the overlap of empty iterables", () => {
            expect(computeOverlap(new Set(), [])).to.deep.eq({
                intersection: [],
                leftOnly: [],
                rightOnly: [],
            });
        });
    });
});
