import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "./dedent";
import { extractArrayOfStrings, extractIssueKeys, extractString } from "./extraction";

void describe(relative(cwd(), __filename), () => {
    void describe(extractIssueKeys.name, () => {
        void it("extracts single test issue keys", () => {
            assert.deepStrictEqual(extractIssueKeys("this is CYP-123 a test", "CYP"), ["CYP-123"]);
        });

        void it("extracts multiple test issue keys", () => {
            assert.deepStrictEqual(
                extractIssueKeys("CYP-123 this is a CYP-456 test CYP-789", "CYP"),
                ["CYP-123", "CYP-456", "CYP-789"]
            );
        });

        void it("logs warnings for missing test issue keys", () => {
            assert.throws(() => extractIssueKeys("this is a test", "CYP"), {
                message: dedent(`
                    Test: this is a test

                      No test issue keys found in title.

                      You can target existing test issues by adding a corresponding issue key:

                        it("CYP-123 this is a test", () => {
                          // ...
                        });

                      For more information, visit:
                      - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                `),
            });
        });
    });

    void describe("extractString", () => {
        void it("extracts string properties", () => {
            const data = {
                x: "nice to meet you",
            };
            assert.strictEqual(extractString(data, "x"), "nice to meet you");
        });
        void it("throws if data is not an object", () => {
            assert.throws(() => extractString(5, "x"), {
                message: "Expected an object containing property 'x', but got: 5",
            });
        });
        void it("throws if data is null", () => {
            assert.throws(() => extractString(null, "x"), {
                message: "Expected an object containing property 'x', but got: null",
            });
        });
        void it("throws if data is undefined", () => {
            assert.throws(() => extractString(undefined, "x"), {
                message: "Expected an object containing property 'x', but got: undefined",
            });
        });
        void it("throws if data does not contain the property", () => {
            const data = {
                x: "nice to meet you",
            };
            assert.throws(() => extractString(data, "missing"), {
                message:
                    'Expected an object containing property \'missing\', but got: {"x":"nice to meet you"}',
            });
        });
        void it("throws if the property is not a string value", () => {
            const data = {
                x: 5,
            };
            assert.throws(() => extractString(data, "x"), {
                message: "Value is not of type string: 5",
            });
        });
    });

    void describe("extractArrayOfStrings", () => {
        void it("extracts string array properties", () => {
            const data = {
                x: ["nice", "to", "meet", "you"],
            };
            assert.deepStrictEqual(extractArrayOfStrings(data, "x"), ["nice", "to", "meet", "you"]);
        });
        void it("throws if data is not an object", () => {
            assert.throws(() => extractArrayOfStrings(5, "x"), {
                message: "Expected an object containing property 'x', but got: 5",
            });
        });
        void it("throws if data is null", () => {
            assert.throws(() => extractArrayOfStrings(null, "x"), {
                message: "Expected an object containing property 'x', but got: null",
            });
        });
        void it("throws if data is undefined", () => {
            assert.throws(() => extractArrayOfStrings(undefined, "x"), {
                message: "Expected an object containing property 'x', but got: undefined",
            });
        });
        void it("throws if data does not contain the property", () => {
            const data = {
                x: ["nice", "to", "meet", "you"],
            };
            assert.throws(() => extractArrayOfStrings(data, "missing"), {
                message:
                    'Expected an object containing property \'missing\', but got: {"x":["nice","to","meet","you"]}',
            });
        });
        void it("throws if the property is not an array value", () => {
            const data = {
                x: "good morning",
            };
            assert.throws(() => extractArrayOfStrings(data, "x"), {
                message: 'Value is not an array of type string: "good morning"',
            });
        });
        void it("throws if the property is not a string array value", () => {
            const data = {
                x: ["good", "morning", "my", 42, "friends"],
            };
            assert.throws(() => extractArrayOfStrings(data, "x"), {
                message:
                    'Value is not an array of type string: ["good","morning","my",42,"friends"]',
            });
        });
    });
});
