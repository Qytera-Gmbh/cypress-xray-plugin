import { expect } from "chai";
import { describe, it } from "node:test";
import path from "path";
import { contains } from "./compare.js";

await describe(path.relative(process.cwd(), import.meta.filename), () => {
    await describe(contains.name, () => {
        await describe("primitive types", () => {
            await it("bigint", () => {
                expect(contains(BigInt(200), BigInt(200))).to.be.true;
            });
            await it("bigint (negative)", () => {
                expect(contains(BigInt(200), BigInt(500))).to.be.false;
            });
            await it("boolean", () => {
                expect(contains(true, true)).to.be.true;
            });
            await it("boolean (negative)", () => {
                expect(contains(true, false)).to.be.false;
            });
            await it("function", () => {
                expect(contains(console.log, console.log)).to.be.true;
            });
            await it("function (negative)", () => {
                expect(contains(console.log, console.info)).to.be.false;
            });
            await it("number", () => {
                expect(contains(42, 42)).to.be.true;
            });
            await it("number (negative)", () => {
                expect(contains(42, 1000)).to.be.false;
            });
            await it("string", () => {
                expect(contains("hello", "hello")).to.be.true;
            });
            await it("string (negative)", () => {
                expect(contains("hello", "bye")).to.be.false;
            });
            await it("symbol", () => {
                expect(contains(Symbol.for("abc"), Symbol.for("abc"))).to.be.true;
            });
            await it("symbol (negative)", () => {
                expect(contains(Symbol.for("abc"), Symbol.for("def"))).to.be.false;
            });
            await it("undefined", () => {
                expect(contains(undefined, undefined)).to.be.true;
            });
            await it("undefined (negative)", () => {
                expect(contains(undefined, 42)).to.be.false;
            });
        });

        await describe("arrays", () => {
            await it("equal", () => {
                expect(contains([1, 2, 3, "hello", false], [1, 2, 3, "hello", false])).to.be.true;
            });
            await it("partially equal", () => {
                expect(contains([1, 2, 3, "hello", false], [false, "hello", 3])).to.be.true;
            });
            await it("not equal", () => {
                expect(contains([1, 2, 3, "hello", false], [true, "bye", 17])).to.be.false;
            });
            await it("not equal and no array", () => {
                expect(contains(null, [1, 2, 3])).to.be.false;
            });
        });

        await describe("objects", () => {
            await it("equal", () => {
                expect(contains({ a: "b", c: 5, d: false }, { a: "b", c: 5, d: false })).to.be.true;
            });
            await it("partially equal", () => {
                expect(contains({ a: "b", c: 5, d: false }, { c: 5, d: false })).to.be.true;
            });
            await it("not equal", () => {
                expect(contains({ a: "b", c: 5, d: false }, { [5]: "oh no", x: "y" })).to.be.false;
            });
        });

        await describe("complex", () => {
            await it("partially equal", () => {
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
