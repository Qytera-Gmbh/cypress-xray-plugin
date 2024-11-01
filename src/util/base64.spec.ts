import { expect } from "chai";
import path from "path";
import { encodeFile } from "./base64.js";

describe(path.relative(process.cwd(), import.meta.filename), () => {
    it("should encode png files to base64", () => {
        const encodedString = encodeFile("./test/resources/turtle.png");
        expect(encodedString).to.have.length.greaterThan(0);
    });

    it("should encode txt files to base64", () => {
        const encodedString = encodeFile("./test/resources/greetings.txt");
        expect(encodedString).to.eq("SGVsbG8gVGhlcmUh");
    });
});
