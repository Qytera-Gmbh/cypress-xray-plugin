import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { extractArrayOfStrings, extractNestedString, extractString } from "./extraction";

describe(relative(cwd(), __filename), async () => {
    await describe("extractString", async () => {
        await it("extracts string properties", () => {
            const data = {
                x: "nice to meet you",
            };
            assert.strictEqual(extractString(data, "x"), "nice to meet you");
        });
        await it("throws if data is not an object", () => {
            assert.throws(() => extractString(5, "x"), {
                message: "Expected an object containing property 'x', but got: 5",
            });
        });
        await it("throws if data is null", () => {
            assert.throws(() => extractString(null, "x"), {
                message: "Expected an object containing property 'x', but got: null",
            });
        });
        await it("throws if data is undefined", () => {
            assert.throws(() => extractString(undefined, "x"), {
                message: "Expected an object containing property 'x', but got: undefined",
            });
        });
        await it("throws if data does not contain the property", () => {
            const data = {
                x: "nice to meet you",
            };
            assert.throws(() => extractString(data, "missing"), {
                message:
                    'Expected an object containing property \'missing\', but got: {"x":"nice to meet you"}',
            });
        });
        await it("throws if the property is not a string value", () => {
            const data = {
                x: 5,
            };
            assert.throws(() => extractString(data, "x"), {
                message: "Value is not of type string: 5",
            });
        });
    });

    await describe("extractArrayOfStrings", async () => {
        await it("extracts string array properties", () => {
            const data = {
                x: ["nice", "to", "meet", "you"],
            };
            assert.deepStrictEqual(extractArrayOfStrings(data, "x"), ["nice", "to", "meet", "you"]);
        });
        await it("throws if data is not an object", () => {
            assert.throws(() => extractArrayOfStrings(5, "x"), {
                message: "Expected an object containing property 'x', but got: 5",
            });
        });
        await it("throws if data is null", () => {
            assert.throws(() => extractArrayOfStrings(null, "x"), {
                message: "Expected an object containing property 'x', but got: null",
            });
        });
        await it("throws if data is undefined", () => {
            assert.throws(() => extractArrayOfStrings(undefined, "x"), {
                message: "Expected an object containing property 'x', but got: undefined",
            });
        });
        await it("throws if data does not contain the property", () => {
            const data = {
                x: ["nice", "to", "meet", "you"],
            };
            assert.throws(() => extractArrayOfStrings(data, "missing"), {
                message:
                    'Expected an object containing property \'missing\', but got: {"x":["nice","to","meet","you"]}',
            });
        });
        await it("throws if the property is not an array value", () => {
            const data = {
                x: "good morning",
            };
            assert.throws(() => extractArrayOfStrings(data, "x"), {
                message: 'Value is not an array of type string: "good morning"',
            });
        });
        await it("throws if the property is not a string array value", () => {
            const data = {
                x: ["good", "morning", "my", 42, "friends"],
            };
            assert.throws(() => extractArrayOfStrings(data, "x"), {
                message:
                    'Value is not an array of type string: ["good","morning","my",42,"friends"]',
            });
        });
    });

    await describe("extractNestedString", async () => {
        await it("extracts nested string properties", () => {
            const data = {
                a: {
                    b: {
                        c: {
                            d: "hello",
                        },
                    },
                },
            };
            assert.strictEqual(extractNestedString(data, ["a", "b", "c", "d"]), "hello");
        });
        await it("throws if data is not an object", () => {
            assert.throws(() => extractNestedString(5, ["x"]), {
                message: "Expected an object containing property 'x', but got: 5",
            });
        });
        await it("throws if data is null", () => {
            assert.throws(() => extractNestedString(null, ["x"]), {
                message: "Expected an object containing property 'x', but got: null",
            });
        });
        await it("throws if data is undefined", () => {
            assert.throws(() => extractNestedString(undefined, ["x"]), {
                message: "Expected an object containing property 'x', but got: undefined",
            });
        });
        await it("throws if a nested property is not an object value", () => {
            const data = {
                a: {
                    b: {
                        c: "surprise",
                    },
                },
            };
            assert.throws(() => extractNestedString(data, ["a", "b", "c", "d"]), {
                message: "Expected an object containing property 'd', but got: \"surprise\"",
            });
        });
        await it("throws if the final property is not a string value", () => {
            const data = {
                a: {
                    b: {
                        c: {
                            d: 42,
                        },
                    },
                },
            };
            assert.throws(() => extractNestedString(data, ["a", "b", "c", "d"]), {
                message: "Value is not of type string: 42",
            });
        });
    });
});
