import { expect } from "chai";
import { encodeFile } from "./base64";

describe("the base64 utility", () => {
    it("should encode png files to base64", () => {
        const encodedString = encodeFile("./test/resources/turtle.png");
        expect(encodedString).to.have.length.greaterThan(0);
    });

    it("should encode txt files to base64", () => {
        const encodedString = encodeFile("./test/resources/greetings.txt");
        expect(encodedString).to.eq("SGVsbG8gVGhlcmUh");
    });
});
