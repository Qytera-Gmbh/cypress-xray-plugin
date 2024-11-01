import { expect } from "chai";
import { describe, it } from "node:test";
import { relative } from "path";
import { encodeFile } from "./base64.js";

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await it("should encode png files to base64", () => {
        const encodedString = encodeFile("./test/resources/turtle.png");
        expect(encodedString).to.have.length.greaterThan(0);
    });

    await it("should encode txt files to base64", () => {
        const encodedString = encodeFile("./test/resources/greetings.txt");
        expect(encodedString).to.eq("SGVsbG8gVGhlcmUh");
    });
});
