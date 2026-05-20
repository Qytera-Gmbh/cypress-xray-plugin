import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "./dedent";
import { unknownToString } from "./string";

void describe(relative(cwd(), __filename), () => {
    void describe(unknownToString.name, () => {
        void it("string", () => {
            assert.strictEqual(unknownToString("hi"), "hi");
        });
        void it("number", () => {
            assert.strictEqual(unknownToString(423535.568), "423535.568");
        });
        void it("boolean", () => {
            assert.strictEqual(unknownToString(false), "false");
        });
        void it("symbol", () => {
            assert.strictEqual(unknownToString(Symbol("hello")), "Symbol(hello)");
        });
        void it("function", () => {
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
        void it("undefined", () => {
            assert.strictEqual(unknownToString(undefined), "undefined");
        });
        void it("object", () => {
            assert.strictEqual(
                unknownToString({ a: 5, b: [1, 2, 3], c: { d: "hi" } }),
                '{"a":5,"b":[1,2,3],"c":{"d":"hi"}}'
            );
        });
        void it("object (pretty)", () => {
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
