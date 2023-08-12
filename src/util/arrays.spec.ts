import { expect } from "chai";
import { equalsIgnoreOrder } from "./arrays";

describe("arrays", () => {
    describe("equalsIgnoreOrder", () => {
        it("compares empty arrays", () => {
            expect(equalsIgnoreOrder([], [])).to.be.true;
        });

        it("returns true for ordered arrays of numbers", () => {
            expect(equalsIgnoreOrder([1, 2, 3], [1, 2, 3])).to.be.true;
        });

        it("returns true for unordered arrays of numbers", () => {
            expect(equalsIgnoreOrder([1, 2, 3], [3, 1, 2])).to.be.true;
        });

        it("returns true for ordered arrays of strings", () => {
            expect(equalsIgnoreOrder(["1", "2"], ["1", "2"])).to.be.true;
        });

        it("returns true for unordered arrays of strings", () => {
            expect(equalsIgnoreOrder(["2", "1"], ["1", "2"])).to.be.true;
        });

        it("returns false for arrays with different element counts", () => {
            expect(equalsIgnoreOrder([1, 2, 3], [1])).to.be.false;
        });
    });
});
