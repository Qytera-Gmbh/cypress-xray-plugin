import { expect } from "chai";
import { describe, it } from "node:test";
import { relative } from "path";
import { dedent } from "./dedent.js";
import { unknownToString } from "./string.js";

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await describe(unknownToString.name, async () => {
        await it("string", () => {
            expect(unknownToString("hi")).to.eq("hi");
        });
        await it("number", () => {
            expect(unknownToString(423535.568)).to.eq("423535.568");
        });
        await it("boolean", () => {
            expect(unknownToString(false)).to.eq("false");
        });
        await it("symbol", () => {
            expect(unknownToString(Symbol("hello"))).to.eq("Symbol(hello)");
        });
        await it("function", () => {
            const f: (arg1: number) => Promise<void> = async (arg1: number) => {
                await new Promise((resolve) => {
                    resolve(arg1);
                });
            };
            expect(unknownToString(f)).to.eq(
                `async (arg1) => {
                await new Promise((resolve) => {
                    resolve(arg1);
                });
            }`
            );
        });
        await it("undefined", () => {
            expect(unknownToString(undefined)).to.eq("undefined");
        });
        await it("object", () => {
            expect(unknownToString({ a: 5, b: [1, 2, 3], c: { d: "hi" } })).to.eq(
                '{"a":5,"b":[1,2,3],"c":{"d":"hi"}}'
            );
        });
        await it("object (pretty)", () => {
            expect(unknownToString({ a: 5, b: [1, 2, 3], c: { d: "hi" } }, true)).to.eq(
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
