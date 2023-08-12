import { expect } from "chai";
import { dedent } from "./dedent";
import { setCoverage } from "./setCoverage";

describe("the set coverage", () => {
    it("throws when no subsets are provided", () => {
        expect(() => setCoverage([2])).to.throw(
            dedent(`
                Cannot cover set: [2]
                No subsets were provided
            `)
        );
    });

    it("throws when an empty set is provided", () => {
        expect(() => setCoverage([])).to.throw("Cannot cover empty set");
    });

    it("throws when a set is uncoverable", () => {
        expect(() => setCoverage([0, 1, 2, 3], [2, 3], [4])).to.throw(
            dedent(`
                Cannot cover set: [0, 1, 2, 3]
                Some elements are missing from all subsets

                Subsets:
                  [2, 3]
                  [4]

                Uncoverable elements:
                  [0, 1]
            `)
        );
    });

    it("covers single subsets", () => {
        expect(setCoverage([1], [1])).to.deep.eq([[1]]);
    });

    it("prefers greater subsets", () => {
        expect(setCoverage([1, 2, 3, 4], [4, 2, 3], [4, 2], [3, 1])).to.deep.eq([[2, 3, 4], [1]]);
    });

    it("covers complex subsets", () => {
        expect(setCoverage([1, 2, 3, 4, 5, 6], [6, 2], [4, 2, 3], [1, 5])).to.deep.eq([
            [2, 3, 4],
            [1, 5],
            [6],
        ]);
    });

    it("does not include unnecessary elements", () => {
        expect(setCoverage([1, 2, 3, 4], [4, 2, 3, 1, 0], [4, 3, 1, 2])).to.deep.eq([[1, 2, 3, 4]]);
    });

    it("works for strings", () => {
        expect(setCoverage(["1", "2", "3"], ["1", "3"], ["2"])).to.deep.eq([["1", "3"], ["2"]]);
    });

    enum Enum {
        A,
        B,
        C,
        D,
    }

    it("works for enums", () => {
        expect(
            setCoverage([Enum.A, Enum.B, Enum.C], [Enum.B, Enum.C], [Enum.A, Enum.D])
        ).to.deep.eq([[Enum.B, Enum.C], [Enum.A]]);
    });
});
