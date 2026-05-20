import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "./dedent";
import { asArrayOfStrings, asBoolean, asFloat, asInt, asObject } from "./parsing";

void describe(relative(cwd(), __filename), () => {
    void describe(asBoolean.name, () => {
        void describe(true.toString(), () => {
            void it("y", () => {
                assert.strictEqual(asBoolean("y"), true);
            });
            void it("yes", () => {
                assert.strictEqual(asBoolean("yes"), true);
            });
            void it("true", () => {
                assert.strictEqual(asBoolean("true"), true);
            });
            void it("1", () => {
                assert.strictEqual(asBoolean("1"), true);
            });
            void it("on", () => {
                assert.strictEqual(asBoolean("on"), true);
            });
        });
        void describe(false.toString(), () => {
            void it("n", () => {
                assert.strictEqual(asBoolean("n"), false);
            });
            void it("no", () => {
                assert.strictEqual(asBoolean("no"), false);
            });
            void it("false", () => {
                assert.strictEqual(asBoolean("false"), false);
            });
            void it("0", () => {
                assert.strictEqual(asBoolean("0"), false);
            });
            void it("off", () => {
                assert.strictEqual(asBoolean("off"), false);
            });
        });
        void it("throws for unknown values", () => {
            assert.throws(() => asBoolean("hi"), {
                message: "Failed to parse boolean value from string: hi",
            });
        });
    });
    void describe(asFloat.name, () => {
        void it("10", () => {
            assert.strictEqual(asFloat("10"), 10.0);
        });
        void it("-1242.0535", () => {
            assert.strictEqual(asFloat("-1242.0535"), -1242.0535);
        });
        void it("returns NaN for unknown values", () => {
            assert.strictEqual(asFloat("hi"), NaN);
        });
    });
    void describe(asInt.name, () => {
        void it("10", () => {
            assert.strictEqual(asInt("10"), 10);
        });
        void it("-1242.0535", () => {
            assert.strictEqual(asInt("-1242.0535"), -1242);
        });
        void it("returns NaN for unknown values", () => {
            assert.strictEqual(asInt("hi"), NaN);
        });
    });
    void describe(asArrayOfStrings.name, () => {
        void it("parses arrays containing primitives", () => {
            assert.deepStrictEqual(asArrayOfStrings([false, 5, 6, "hello", Symbol("anubis")]), [
                "false",
                "5",
                "6",
                "hello",
                "Symbol(anubis)",
            ]);
        });

        void it("throws for non-array arguments", () => {
            assert.throws(() => asArrayOfStrings(5), {
                message: dedent(`
                    Failed to parse as array of strings: 5
                    Expected an array of primitives, but got: 5
                `),
            });
        });

        void it("throws for empty arguments", () => {
            assert.throws(() => asArrayOfStrings([]), {
                message: dedent(`
                    Failed to parse as array of strings: []
                    Expected an array of primitives with at least one element
                `),
            });
        });

        void it("throws for non-array elements", () => {
            assert.throws(() => asArrayOfStrings([1, 2, [3, "4"], 5]), {
                message: dedent(`
                    Failed to parse as array of strings: [1,2,[3,"4"],5]
                    Expected a primitive element at index 2, but got: [3,"4"]
                `),
            });
        });
    });
    void describe(asObject.name, () => {
        void it("parses objects", () => {
            assert.deepStrictEqual(asObject({ hello: 5, something: { nested: "hi" } }), {
                hello: 5,
                something: { nested: "hi" },
            });
        });

        void it("throws for array arguments", () => {
            assert.throws(() => asObject([5, false, 6, "hi"]), {
                message: 'Failed to parse as object: [5,false,6,"hi"]',
            });
        });

        void describe("throws for primitive arguments", () => {
            for (const value of ["hi", false, 15, Symbol("good"), BigInt(12345)]) {
                void it(`type: ${typeof value}`, () => {
                    assert.throws(() => asObject(value), {
                        message: `Failed to parse as object: ${value.toString()}`,
                    });
                });
            }
        });

        void it("throws for null elements", () => {
            assert.throws(() => asObject(null), { message: "Failed to parse as object: null" });
        });

        void it("throws for undefined elements", () => {
            assert.throws(() => asObject(undefined), {
                message: "Failed to parse as object: undefined",
            });
        });
    });
});
