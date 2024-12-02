import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { contains } from "./compare";

describe(relative(cwd(), __filename), async () => {
    await describe(contains.name, async () => {
        await describe("primitive types", async () => {
            await it("bigint", () => {
                assert.strictEqual(contains(BigInt(200), BigInt(200)), true);
            });
            await it("bigint (negative)", () => {
                assert.strictEqual(contains(BigInt(200), BigInt(500)), false);
            });
            await it("boolean", () => {
                assert.strictEqual(contains(true, true), true);
            });
            await it("boolean (negative)", () => {
                assert.strictEqual(contains(true, false), false);
            });
            await it("function", () => {
                assert.strictEqual(contains(console.log, console.log), true);
            });
            await it("function (negative)", () => {
                assert.strictEqual(contains(console.log, console.info), false);
            });
            await it("number", () => {
                assert.strictEqual(contains(42, 42), true);
            });
            await it("number (negative)", () => {
                assert.strictEqual(contains(42, 1000), false);
            });
            await it("string", () => {
                assert.strictEqual(contains("hello", "hello"), true);
            });
            await it("string (negative)", () => {
                assert.strictEqual(contains("hello", "bye"), false);
            });
            await it("symbol", () => {
                assert.strictEqual(contains(Symbol.for("abc"), Symbol.for("abc")), true);
            });
            await it("symbol (negative)", () => {
                assert.strictEqual(contains(Symbol.for("abc"), Symbol.for("def")), false);
            });
            await it("undefined", () => {
                assert.strictEqual(contains(undefined, undefined), true);
            });
            await it("undefined (negative)", () => {
                assert.strictEqual(contains(undefined, 42), false);
            });
        });

        await describe("arrays", async () => {
            await it("equal", () => {
                assert.strictEqual(
                    contains([1, 2, 3, "hello", false], [1, 2, 3, "hello", false]),
                    true
                );
            });
            await it("partially equal", () => {
                assert.strictEqual(contains([1, 2, 3, "hello", false], [false, "hello", 3]), true);
            });
            await it("not equal", () => {
                assert.strictEqual(contains([1, 2, 3, "hello", false], [true, "bye", 17]), false);
            });
            await it("not equal and no array", () => {
                assert.strictEqual(contains(null, [1, 2, 3]), false);
            });
        });

        await describe("objects", async () => {
            await it("equal", () => {
                assert.strictEqual(
                    contains({ a: "b", c: 5, d: false }, { a: "b", c: 5, d: false }),
                    true
                );
            });
            await it("partially equal", () => {
                assert.strictEqual(contains({ a: "b", c: 5, d: false }, { c: 5, d: false }), true);
            });
            await it("not equal", () => {
                assert.strictEqual(
                    contains({ a: "b", c: 5, d: false }, { [5]: "oh no", x: "y" }),
                    false
                );
            });
        });

        await describe("complex", async () => {
            await it("partially equal", () => {
                assert.strictEqual(
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
                    ),
                    true
                );
            });
        });
    });
});
