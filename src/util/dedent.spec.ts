import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "./dedent";

void describe(relative(cwd(), __filename), () => {
    void it("strips leading whitespace", () => {
        assert.strictEqual(dedent(`   Hello\nthere\nyo`), "Hello\nthere\nyo");
    });

    void it("strips leading and trailing multiline whitespace", () => {
        assert.strictEqual(
            dedent(`
                Hello
                  there
                    yo
            `),
            "Hello\n  there\n    yo"
        );
    });

    void it("adds indentation to newlines in between", () => {
        assert.strictEqual(
            dedent(`
                Hello
                  there
                    ${["example 1", "example 2"].join("\n")}
                  yo
            `),
            "Hello\n  there\n    example 1\n    example 2\n  yo"
        );
    });

    void it("handles unindented strings", () => {
        assert.strictEqual(dedent(`Hello`), "Hello");
    });
});
