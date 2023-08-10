import { expect } from "chai";
import { dedent } from "./dedent";
import { setCoverage } from "./setCoverage";

describe("the set coverage", () => {
    it("throws for missing singleton subsets", () => {
        expect(() => setCoverage([1, 2, 3, 4], [1], [2], [3, 4], [4])).to.throw(
            dedent(`
                Cannot build set coverage for: [1, 2, 3, 4]
                There are elements without singleton subsets: [3]

                Subsets:
                  [1]
                  [2]
                  [3, 4]
                  [4]
            `)
        );
    });

    it("covers single elements", () => {
        expect(setCoverage([2], [1], [2], [3, 4], [4])).to.deep.eq([[2]]);
    });

    it("covers single subsets", () => {
        expect(setCoverage([1], [1])).to.deep.eq([[1]]);
    });

    it("prefers greater subsets", () => {
        expect(setCoverage([1, 2, 3, 4], [4, 2, 3], [1], [2], [3], [4])).to.deep.eq([
            [4, 2, 3],
            [1],
        ]);
    });

    it("covers complex subsets", () => {
        expect(
            setCoverage([1, 2, 3, 4, 5, 6], [4, 2, 3], [1], [2], [3], [4], [5], [6], [1, 5])
        ).to.deep.eq([[4, 2, 3], [1, 5], [6]]);
    });

    it("does not include unnecessary elements", () => {
        expect(
            setCoverage([1, 2, 3, 4], [4, 2, 3, 1, 0], [1], [2], [4, 3, 1, 2], [3], [4])
        ).to.deep.eq([[4, 3, 1, 2]]);
    });

    it("works for strings", () => {
        expect(setCoverage(["1", "2", "3"], ["1", "3"], ["1"], ["2"], ["3"])).to.deep.eq([
            ["1", "3"],
            ["2"],
        ]);
    });

    enum Enum {
        A,
        B,
        C,
    }

    it("works for enums", () => {
        expect(
            setCoverage([Enum.A, Enum.B, Enum.C], [Enum.B, Enum.C], [Enum.A], [Enum.B], [Enum.C])
        ).to.deep.eq([[Enum.B, Enum.C], [Enum.A]]);
    });
});
