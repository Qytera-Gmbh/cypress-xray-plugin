import { expect } from "chai";
import path from "path";
import { contains } from "./compare";

describe(path.relative(process.cwd(), __filename), () => {
    describe(contains.name, () => {
        describe("primitive types", () => {
            it("bigint", () => {
                expect(contains(BigInt(200), BigInt(200))).to.be.true;
            });
            it("bigint (negative)", () => {
                expect(contains(BigInt(200), BigInt(500))).to.be.false;
            });
            it("boolean", () => {
                expect(contains(true, true)).to.be.true;
            });
            it("boolean (negative)", () => {
                expect(contains(true, false)).to.be.false;
            });
            it("function", () => {
                expect(contains(console.log, console.log)).to.be.true;
            });
            it("function (negative)", () => {
                expect(contains(console.log, console.info)).to.be.false;
            });
            it("number", () => {
                expect(contains(42, 42)).to.be.true;
            });
            it("number (negative)", () => {
                expect(contains(42, 1000)).to.be.false;
            });
            it("string", () => {
                expect(contains("hello", "hello")).to.be.true;
            });
            it("string (negative)", () => {
                expect(contains("hello", "bye")).to.be.false;
            });
            it("symbol", () => {
                expect(contains(Symbol.for("abc"), Symbol.for("abc"))).to.be.true;
            });
            it("symbol (negative)", () => {
                expect(contains(Symbol.for("abc"), Symbol.for("def"))).to.be.false;
            });
            it("undefined", () => {
                expect(contains(undefined, undefined)).to.be.true;
            });
            it("undefined (negative)", () => {
                expect(contains(undefined, 42)).to.be.false;
            });
        });

        describe("arrays", () => {
            it("equal", () => {
                expect(contains([1, 2, 3, "hello", false], [1, 2, 3, "hello", false])).to.be.true;
            });
            it("partially equal", () => {
                expect(contains([1, 2, 3, "hello", false], [false, "hello", 3])).to.be.true;
            });
            it("not equal", () => {
                expect(contains([1, 2, 3, "hello", false], [true, "bye", 17])).to.be.false;
            });
            it("not equal and no array", () => {
                expect(contains(null, [1, 2, 3])).to.be.false;
            });
        });

        describe("objects", () => {
            it("equal", () => {
                expect(contains({ a: "b", c: 5, d: false }, { a: "b", c: 5, d: false })).to.be.true;
            });
            it("partially equal", () => {
                expect(contains({ a: "b", c: 5, d: false }, { c: 5, d: false })).to.be.true;
            });
            it("not equal", () => {
                expect(contains({ a: "b", c: 5, d: false }, { [5]: "oh no", x: "y" })).to.be.false;
            });
        });

        describe("complex", () => {
            it("partially equal", () => {
                expect(
                    contains(
                        {
                            a: "b",
                            c: 5,
                            d: [
                                { e: 42, f: 100, g: "hi", h: [32, 1052] },
                                null,
                                { x: [17, { y: null, z: "bonjour" }] },
                            ],
                        },
                        {
                            c: 5,
                            d: [{ g: "hi", h: [1052] }, { x: [{ z: "bonjour" }] }],
                        }
                    )
                ).to.be.true;
            });
        });
    });
});
