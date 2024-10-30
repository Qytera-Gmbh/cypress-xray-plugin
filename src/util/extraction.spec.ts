import { expect } from "chai";
import path from "path";
import { extractArrayOfStrings, extractNestedString, extractString } from "./extraction";

describe(path.relative(process.cwd(), __filename), () => {
    describe("extractString", () => {
        it("extracts string properties", () => {
            const data = {
                x: "nice to meet you",
            };
            expect(extractString(data, "x")).to.eq("nice to meet you");
        });
        it("throws if data is not an object", () => {
            expect(() => extractString(5, "x")).to.throw(
                "Expected an object containing property 'x', but got: 5"
            );
        });
        it("throws if data is null", () => {
            expect(() => extractString(null, "x")).to.throw(
                "Expected an object containing property 'x', but got: null"
            );
        });
        it("throws if data is undefined", () => {
            expect(() => extractString(undefined, "x")).to.throw(
                "Expected an object containing property 'x', but got: undefined"
            );
        });
        it("throws if data does not contain the property", () => {
            const data = {
                x: "nice to meet you",
            };
            expect(() => extractString(data, "missing")).to.throw(
                'Expected an object containing property \'missing\', but got: {"x":"nice to meet you"}'
            );
        });
        it("throws if the property is not a string value", () => {
            const data = {
                x: 5,
            };
            expect(() => extractString(data, "x")).to.throw("Value is not of type string: 5");
        });
    });

    describe("extractArrayOfStrings", () => {
        it("extracts string array properties", () => {
            const data = {
                x: ["nice", "to", "meet", "you"],
            };
            expect(extractArrayOfStrings(data, "x")).to.deep.eq(["nice", "to", "meet", "you"]);
        });
        it("throws if data is not an object", () => {
            expect(() => extractArrayOfStrings(5, "x")).to.throw(
                "Expected an object containing property 'x', but got: 5"
            );
        });
        it("throws if data is null", () => {
            expect(() => extractArrayOfStrings(null, "x")).to.throw(
                "Expected an object containing property 'x', but got: null"
            );
        });
        it("throws if data is undefined", () => {
            expect(() => extractArrayOfStrings(undefined, "x")).to.throw(
                "Expected an object containing property 'x', but got: undefined"
            );
        });
        it("throws if data does not contain the property", () => {
            const data = {
                x: ["nice", "to", "meet", "you"],
            };
            expect(() => extractArrayOfStrings(data, "missing")).to.throw(
                'Expected an object containing property \'missing\', but got: {"x":["nice","to","meet","you"]}'
            );
        });
        it("throws if the property is not an array value", () => {
            const data = {
                x: "good morning",
            };
            expect(() => extractArrayOfStrings(data, "x")).to.throw(
                'Value is not an array of type string: "good morning"'
            );
        });
        it("throws if the property is not a string array value", () => {
            const data = {
                x: ["good", "morning", "my", 42, "friends"],
            };
            expect(() => extractArrayOfStrings(data, "x")).to.throw(
                'Value is not an array of type string: ["good","morning","my",42,"friends"]'
            );
        });
    });

    describe("extractNestedString", () => {
        it("extracts nested string properties", () => {
            const data = {
                a: {
                    b: {
                        c: {
                            d: "hello",
                        },
                    },
                },
            };
            expect(extractNestedString(data, ["a", "b", "c", "d"])).to.eq("hello");
        });
        it("throws if data is not an object", () => {
            expect(() => extractNestedString(5, ["x"])).to.throw(
                "Expected an object containing property 'x', but got: 5"
            );
        });
        it("throws if data is null", () => {
            expect(() => extractNestedString(null, ["x"])).to.throw(
                "Expected an object containing property 'x', but got: null"
            );
        });
        it("throws if data is undefined", () => {
            expect(() => extractNestedString(undefined, ["x"])).to.throw(
                "Expected an object containing property 'x', but got: undefined"
            );
        });
        it("throws if a nested property is not an object value", () => {
            const data = {
                a: {
                    b: {
                        c: "surprise",
                    },
                },
            };
            expect(() => extractNestedString(data, ["a", "b", "c", "d"])).to.throw(
                "Expected an object containing property 'd', but got: \"surprise\""
            );
        });
        it("throws if the final property is not a string value", () => {
            const data = {
                a: {
                    b: {
                        c: {
                            d: 42,
                        },
                    },
                },
            };
            expect(() => extractNestedString(data, ["a", "b", "c", "d"])).to.throw(
                "Value is not of type string: 42"
            );
        });
    });
});
