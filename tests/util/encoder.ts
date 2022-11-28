import { expect } from "chai";
import { encodeBase64 } from "../../src/util/encoder";

describe("the encoding utility", () => {
    it("should be able to encode png files to base64", () => {
        const encodedString = encodeBase64("./tests/resources/turtle.png");
        expect(encodedString).to.have.length.greaterThan(0);
    });

    it("should be able to encode txt files to base64", () => {
        const encodedString = encodeBase64("./tests/resources/greetings.txt");
        expect(encodedString).to.eq("SGVsbG8gVGhlcmUh");
    });
});
