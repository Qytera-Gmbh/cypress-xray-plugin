import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { encodeFile } from "./base64";

void describe(relative(cwd(), __filename), () => {
    void it("should encode png files to base64", () => {
        const encodedString = encodeFile("./test/resources/turtle.png");
        assert.notStrictEqual(encodedString.length, 0);
    });

    void it("should encode txt files to base64", () => {
        const encodedString = encodeFile("./test/resources/greetings.txt");
        assert.strictEqual(encodedString, "SGVsbG8gVGhlcmUh");
    });
});
