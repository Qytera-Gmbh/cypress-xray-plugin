import { expect } from "chai";
import path from "path";
import { dedent } from "./dedent";
import { asArrayOfStrings, asBoolean, asFloat, asInt } from "./parsing";

describe(path.relative(process.cwd(), __filename), () => {
    describe(asBoolean.name, () => {
        describe(true.toString(), () => {
            it("y", () => {
                expect(asBoolean("y")).to.be.true;
            });
            it("yes", () => {
                expect(asBoolean("yes")).to.be.true;
            });
            it("true", () => {
                expect(asBoolean("true")).to.be.true;
            });
            it("1", () => {
                expect(asBoolean("1")).to.be.true;
            });
            it("on", () => {
                expect(asBoolean("on")).to.be.true;
            });
        });
        describe(false.toString(), () => {
            it("n", () => {
                expect(asBoolean("n")).to.be.false;
            });
            it("no", () => {
                expect(asBoolean("no")).to.be.false;
            });
            it("false", () => {
                expect(asBoolean("false")).to.be.false;
            });
            it("0", () => {
                expect(asBoolean("0")).to.be.false;
            });
            it("off", () => {
                expect(asBoolean("off")).to.be.false;
            });
        });
        it("throws for unknown values", () => {
            expect(() => asBoolean("hi")).to.throw("Failed to parse boolean value from string: hi");
        });
    });
    describe(asFloat.name, () => {
        it("10", () => {
            expect(asFloat("10")).to.eq(10.0);
        });
        it("-1242.0535", () => {
            expect(asFloat("-1242.0535")).to.eq(-1242.0535);
        });
        it("returns NaN for unknown values", () => {
            expect(asFloat("hi")).to.be.NaN;
        });
    });
    describe(asInt.name, () => {
        it("10", () => {
            expect(asInt("10")).to.eq(10);
        });
        it("-1242.0535", () => {
            expect(asInt("-1242.0535")).to.eq(-1242);
        });
        it("returns NaN for unknown values", () => {
            expect(asInt("hi")).to.be.NaN;
        });
    });
    describe(asArrayOfStrings.name, () => {
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
