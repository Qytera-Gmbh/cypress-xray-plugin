import { expect } from "chai";
import { describe, it } from "node:test";
import { relative } from "path";
import { dedent } from "./dedent.js";

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await it("strips leading whitespace", () => {
        expect(dedent(`   Hello\nthere\nyo`)).to.eq("Hello\nthere\nyo");
    });

    await it("strips leading and trailing multiline whitespace", () => {
        expect(
            dedent(`
                Hello
                  there
                    yo
            `)
        ).to.eq("Hello\n  there\n    yo");
    });

    await it("adds indentation to newlines in between", () => {
        expect(
            dedent(`
                Hello
                  there
                    ${["example 1", "example 2"].join("\n")}
                  yo
            `)
        ).to.eq("Hello\n  there\n    example 1\n    example 2\n  yo");
    });

    await it("handles unindented strings", () => {
        expect(dedent(`Hello`)).to.eq("Hello");
    });
});
