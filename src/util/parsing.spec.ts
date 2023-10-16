import { expect } from "chai";
import { dedent } from "./dedent";
import { asArrayOfStrings } from "./parsing";

describe("parsing", () => {
    describe("asArrayOfStrings", () => {
        it("parses arrays containing primitives", () => {
            expect(asArrayOfStrings([false, 5, 6, "hello", Symbol("anubis")])).to.deep.eq([
                "false",
                "5",
                "6",
                "hello",
                "Symbol(anubis)",
            ]);
        });

        it("throws for non-array arguments", () => {
            expect(() => asArrayOfStrings(5)).to.throw(
                dedent(`
                    Failed to parse as array of strings: 5
                    Expected an array of primitives, but got: 5
                `)
            );
        });

        it("throws for empty arguments", () => {
            expect(() => asArrayOfStrings([])).to.throw(
                dedent(`
                    Failed to parse as array of strings: []
                    Expected an array of primitives with at least one element
                `)
            );
        });

        it("throws for non-array elements", () => {
            expect(() => asArrayOfStrings([1, 2, [3, "4"], 5])).to.throw(
                dedent(`
                    Failed to parse as array of strings: [1,2,[3,"4"],5]
                    Expected a primitive element at index 2, but got: [3,"4"]
                `)
            );
        });
    });
});
