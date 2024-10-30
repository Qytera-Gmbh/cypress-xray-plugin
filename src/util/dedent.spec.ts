import { expect } from "chai";
import path from "path";
import { dedent } from "./dedent";

describe(path.relative(process.cwd(), __filename), () => {
    it("strips leading whitespace", () => {
        expect(dedent(`   Hello\nthere\nyo`)).to.eq("Hello\nthere\nyo");
    });

    it("strips leading and trailing multiline whitespace", () => {
        expect(
            dedent(`
                Hello
                  there
                    yo
            `)
        ).to.eq("Hello\n  there\n    yo");
    });

    it("adds indentation to newlines in between", () => {
        expect(
            dedent(`
                Hello
                  there
                    ${["example 1", "example 2"].join("\n")}
                  yo
            `)
        ).to.eq("Hello\n  there\n    example 1\n    example 2\n  yo");
    });

    it("handles unindented strings", () => {
        expect(dedent(`Hello`)).to.eq("Hello");
    });
});
