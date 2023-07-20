import { expect } from "chai";
import dedent from "dedent";
import { getTestIssueKey } from "./cypress";

describe("the cypress tag extractor", () => {
    describe("getTestIssueKey", () => {
        it("should extract single test issue keys", () => {
            expect(getTestIssueKey("this is CYP-123 a test", "CYP")).to.eq("CYP-123");
        });

        it("should log warnings for missing test issue keys", () => {
            expect(() => getTestIssueKey("this is a test", "CYP")).to.throw(
                dedent(`
                    No test issue keys found in title of test: this is a test
                    You can target existing test issues by adding a corresponding issue key:

                    it("CYP-123 this is a test", () => {
                        // ...
                    });

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });

        it("should log warnings for multiple test issue keys", () => {
            expect(() => getTestIssueKey("CYP-123 this is a CYP-456 test CYP-789", "CYP")).to.throw(
                dedent(`
                    Multiple test keys found in title of test: CYP-123 this is a CYP-456 test CYP-789
                    The plugin cannot decide for you which one to use:

                    it("CYP-123 this is a CYP-456 test CYP-789", () => {
                        ^^^^^^^           ^^^^^^^      ^^^^^^^
                        // ...
                    });

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });
    });
});
