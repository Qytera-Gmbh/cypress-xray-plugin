import { expect } from "chai";
import path from "path";
import { dedent } from "./dedent";
import { unknownToString } from "./string";

describe(path.relative(process.cwd(), __filename), () => {
    describe(unknownToString.name, () => {
        it("string", () => {
            expect(unknownToString("hi")).to.eq("hi");
        });
        it("number", () => {
            expect(unknownToString(423535.568)).to.eq("423535.568");
        });
        it("boolean", () => {
            expect(unknownToString(false)).to.eq("false");
        });
        it("symbol", () => {
            expect(unknownToString(Symbol("hello"))).to.eq("Symbol(hello)");
        });
        it("function", () => {
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
        it("undefined", () => {
            expect(unknownToString(undefined)).to.eq("undefined");
        });
        it("object", () => {
            expect(unknownToString({ a: 5, b: [1, 2, 3], c: { d: "hi" } })).to.eq(
                '{"a":5,"b":[1,2,3],"c":{"d":"hi"}}'
            );
        });
        it("object (pretty)", () => {
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
