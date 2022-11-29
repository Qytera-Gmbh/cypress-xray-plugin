import { expect } from "chai";
import { encodeFile } from "../../../src/util/base64";

describe("the encoding utility", () => {
    it("should be able to encode png files to base64", () => {
        const encodedString = encodeFile("./tests/resources/turtle.png");
        expect(encodedString).to.have.length.greaterThan(0);
    });

    it("should be able to encode txt files to base64", () => {
        const encodedString = encodeFile("./tests/resources/greetings.txt");
        expect(encodedString).to.eq("SGVsbG8gVGhlcmUh");
    });
});
