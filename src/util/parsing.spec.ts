import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "./dedent";
import { asArrayOfStrings, asBoolean, asFloat, asInt, asObject } from "./parsing";

describe(relative(cwd(), __filename), async () => {
    await describe(asBoolean.name, async () => {
        await describe(true.toString(), async () => {
            await it("y", () => {
                assert.strictEqual(asBoolean("y"), true);
            });
            await it("yes", () => {
                assert.strictEqual(asBoolean("yes"), true);
            });
            await it("true", () => {
                assert.strictEqual(asBoolean("true"), true);
            });
            await it("1", () => {
                assert.strictEqual(asBoolean("1"), true);
            });
            await it("on", () => {
                assert.strictEqual(asBoolean("on"), true);
            });
        });
        await describe(false.toString(), async () => {
            await it("n", () => {
                assert.strictEqual(asBoolean("n"), false);
            });
            await it("no", () => {
                assert.strictEqual(asBoolean("no"), false);
            });
            await it("false", () => {
                assert.strictEqual(asBoolean("false"), false);
            });
            await it("0", () => {
                assert.strictEqual(asBoolean("0"), false);
            });
            await it("off", () => {
                assert.strictEqual(asBoolean("off"), false);
            });
        });
        await it("throws for unknown values", () => {
            assert.throws(() => asBoolean("hi"), {
                message: "Failed to parse boolean value from string: hi",
            });
        });
    });
    await describe(asFloat.name, async () => {
        await it("10", () => {
            assert.strictEqual(asFloat("10"), 10.0);
        });
        await it("-1242.0535", () => {
            assert.strictEqual(asFloat("-1242.0535"), -1242.0535);
        });
        await it("returns NaN for unknown values", () => {
            assert.strictEqual(asFloat("hi"), NaN);
        });
    });
    await describe(asInt.name, async () => {
        await it("10", () => {
            assert.strictEqual(asInt("10"), 10);
        });
        await it("-1242.0535", () => {
            assert.strictEqual(asInt("-1242.0535"), -1242);
        });
        await it("returns NaN for unknown values", () => {
            assert.strictEqual(asInt("hi"), NaN);
        });
    });
    await describe(asArrayOfStrings.name, async () => {
        await it("parses arrays containing primitives", () => {
            assert.deepStrictEqual(asArrayOfStrings([false, 5, 6, "hello", Symbol("anubis")]), [
                "false",
                "5",
                "6",
                "hello",
                "Symbol(anubis)",
            ]);
        });

        await it("throws for non-array arguments", () => {
            assert.throws(() => asArrayOfStrings(5), {
                message: dedent(`
                    Failed to parse as array of strings: 5
                    Expected an array of primitives, but got: 5
                `),
            });
        });

        await it("throws for empty arguments", () => {
            assert.throws(() => asArrayOfStrings([]), {
                message: dedent(`
                    Failed to parse as array of strings: []
                    Expected an array of primitives with at least one element
                `),
            });
        });

        await it("throws for non-array elements", () => {
            assert.throws(() => asArrayOfStrings([1, 2, [3, "4"], 5]), {
                message: dedent(`
                    Failed to parse as array of strings: [1,2,[3,"4"],5]
                    Expected a primitive element at index 2, but got: [3,"4"]
                `),
            });
        });
    });
    await describe(asObject.name, async () => {
        await it("parses objects", () => {
            assert.deepStrictEqual(asObject({ hello: 5, something: { nested: "hi" } }), {
                hello: 5,
                something: { nested: "hi" },
            });
        });

        await it("throws for array arguments", () => {
            assert.throws(() => asObject([5, false, 6, "hi"]), {
                message: 'Failed to parse as object: [5,false,6,"hi"]',
            });
        });

        await describe("throws for primitive arguments", async () => {
            for (const value of ["hi", false, 15, Symbol("good"), BigInt(12345)]) {
                await it(`type: ${typeof value}`, () => {
                    assert.throws(() => asObject(value), {
                        message: `Failed to parse as object: ${value.toString()}`,
                    });
                });
            }
        });

        await it("throws for null elements", () => {
            assert.throws(() => asObject(null), { message: "Failed to parse as object: null" });
        });

        await it("throws for undefined elements", () => {
            assert.throws(() => asObject(undefined), {
                message: "Failed to parse as object: undefined",
            });
        });
    });
});
