import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "./dedent";
import { unknownToString } from "./string";

describe(relative(cwd(), __filename), async () => {
    await describe(unknownToString.name, async () => {
        await it("string", () => {
            assert.strictEqual(unknownToString("hi"), "hi");
        });
        await it("number", () => {
            assert.strictEqual(unknownToString(423535.568), "423535.568");
        });
        await it("boolean", () => {
            assert.strictEqual(unknownToString(false), "false");
        });
        await it("symbol", () => {
            assert.strictEqual(unknownToString(Symbol("hello")), "Symbol(hello)");
        });
        await it("function", () => {
            const f: (arg1: number) => Promise<void> = async (arg1: number) => {
                await new Promise((resolve) => {
                    resolve(arg1);
                });
            };
            assert.strictEqual(
                unknownToString(f),
                "async arg1=>{await new Promise(resolve=>{resolve(arg1)})}"
            );
        });
        await it("undefined", () => {
            assert.strictEqual(unknownToString(undefined), "undefined");
        });
        await it("object", () => {
            assert.strictEqual(
                unknownToString({ a: 5, b: [1, 2, 3], c: { d: "hi" } }),
                '{"a":5,"b":[1,2,3],"c":{"d":"hi"}}'
            );
        });
        await it("object (pretty)", () => {
            assert.strictEqual(
                unknownToString({ a: 5, b: [1, 2, 3], c: { d: "hi" } }, true),
                dedent(`
                    {
                      "a": 5,
                      "b": [
                        1,
                        2,
                        3
                      ],
                      "c": {
                        "d": "hi"
                      }
                    }
                `)
            );
        });
    });
});
