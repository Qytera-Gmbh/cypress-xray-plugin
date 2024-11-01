import { expect } from "chai";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { encodeFile } from "./base64.js";

await describe(relative(cwd(), import.meta.filename), async () => {
    await it("should encode png files to base64", () => {
        const encodedString = encodeFile("./test/resources/turtle.png");
        expect(encodedString).to.have.length.greaterThan(0);
    });

    await it("should encode txt files to base64", () => {
        const encodedString = encodeFile("./test/resources/greetings.txt");
        expect(encodedString).to.eq("SGVsbG8gVGhlcmUh");
    });
});
