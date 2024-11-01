import { expect } from "chai";
import path from "path";
import { dedent } from "./dedent.js";
import { asArrayOfStrings, asBoolean, asFloat, asInt, asObject } from "./parsing.js";

await describe(path.relative(process.cwd(), import.meta.filename), () => {
    await describe(asBoolean.name, () => {
        await describe(true.toString(), () => {
            await it("y", () => {
                expect(asBoolean("y")).to.be.true;
            });
            await it("yes", () => {
                expect(asBoolean("yes")).to.be.true;
            });
            await it("true", () => {
                expect(asBoolean("true")).to.be.true;
            });
            await it("1", () => {
                expect(asBoolean("1")).to.be.true;
            });
            await it("on", () => {
                expect(asBoolean("on")).to.be.true;
            });
        });
        await describe(false.toString(), () => {
            await it("n", () => {
                expect(asBoolean("n")).to.be.false;
            });
            await it("no", () => {
                expect(asBoolean("no")).to.be.false;
            });
            await it("false", () => {
                expect(asBoolean("false")).to.be.false;
            });
            await it("0", () => {
                expect(asBoolean("0")).to.be.false;
            });
            await it("off", () => {
                expect(asBoolean("off")).to.be.false;
            });
        });
        await it("throws for unknown values", () => {
            expect(() => asBoolean("hi")).to.throw("Failed to parse boolean value from string: hi");
        });
    });
    await describe(asFloat.name, () => {
        await it("10", () => {
            expect(asFloat("10")).to.eq(10.0);
        });
        await it("-1242.0535", () => {
            expect(asFloat("-1242.0535")).to.eq(-1242.0535);
        });
        await it("returns NaN for unknown values", () => {
            expect(asFloat("hi")).to.be.NaN;
        });
    });
    await describe(asInt.name, () => {
        await it("10", () => {
            expect(asInt("10")).to.eq(10);
        });
        await it("-1242.0535", () => {
            expect(asInt("-1242.0535")).to.eq(-1242);
        });
        await it("returns NaN for unknown values", () => {
            expect(asInt("hi")).to.be.NaN;
        });
    });
    await describe(asArrayOfStrings.name, () => {
        await it("parses arrays containing primitives", () => {
            expect(asArrayOfStrings([false, 5, 6, "hello", Symbol("anubis")])).to.deep.eq([
                "false",
                "5",
                "6",
                "hello",
                "Symbol(anubis)",
            ]);
        });

        await it("throws for non-array arguments", () => {
            expect(() => asArrayOfStrings(5)).to.throw(
                dedent(`
                    Failed to parse as array of strings: 5
                    Expected an array of primitives, but got: 5
                `)
            );
        });

        await it("throws for empty arguments", () => {
            expect(() => asArrayOfStrings([])).to.throw(
                dedent(`
                    Failed to parse as array of strings: []
                    Expected an array of primitives with at least one element
                `)
            );
        });

        await it("throws for non-array elements", () => {
            expect(() => asArrayOfStrings([1, 2, [3, "4"], 5])).to.throw(
                dedent(`
                    Failed to parse as array of strings: [1,2,[3,"4"],5]
                    Expected a primitive element at index 2, but got: [3,"4"]
                `)
            );
        });
    });
    await describe(asObject.name, () => {
        await it("parses objects", () => {
            expect(asObject({ hello: 5, something: { nested: "hi" } })).to.deep.eq({
                hello: 5,
                something: { nested: "hi" },
            });
        });

        await it("throws for array arguments", () => {
            expect(() => asObject([5, false, 6, "hi"])).to.throw(
                'Failed to parse as object: [5,false,6,"hi"]'
            );
        });

        await describe("throws for primitive arguments", () => {
            for (const value of ["hi", false, 15, Symbol("good"), BigInt(12345)]) {
                await it(`type: ${typeof value}`, () => {
                    expect(() => asObject(value)).to.throw(
                        `Failed to parse as object: ${value.toString()}`
                    );
                });
            }
        });

        await it("throws for null elements", () => {
            expect(() => asObject(null)).to.throw("Failed to parse as object: null");
        });

        await it("throws for undefined elements", () => {
            expect(() => asObject(undefined)).to.throw("Failed to parse as object: undefined");
        });
    });
});
