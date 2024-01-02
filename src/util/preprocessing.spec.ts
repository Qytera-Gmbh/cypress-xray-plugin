import { expect } from "chai";
import fs from "fs";
import { getMockedLogger } from "../../test/mocks";
import { dedent } from "./dedent";
import { Level } from "./logging";
import { containsNativeTest, getNativeTestIssueKey, getNativeTestIssueKeys } from "./preprocessing";

describe("cypress preprocessing", () => {
    let result: CypressCommandLine.CypressRunResult;

    beforeEach(() => {
        result = JSON.parse(
            fs.readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
        ) as CypressCommandLine.CypressRunResult;
    });

    describe("getNativeTestIssueKeys", () => {
        it("returns valid issue keys", () => {
            const issueKeys = getNativeTestIssueKeys(result, "CYP");
            expect(issueKeys).to.deep.eq(["CYP-40", "CYP-41", "CYP-49"]);
        });

        it("skips invalid or missing issue keys", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const logger = getMockedLogger();
            logger.message
                .withArgs(
                    Level.WARNING,
                    dedent(`
                        Skipping test: xray upload demo should look for paragraph elements

                        No test issue keys found in title of test: should look for paragraph elements
                        You can target existing test issues by adding a corresponding issue key:

                        it("CYP-123 should look for paragraph elements", () => {
                          // ...
                        });

                        For more information, visit:
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                )
                .onFirstCall()
                .returns();
            logger.message
                .withArgs(
                    Level.WARNING,
                    dedent(`
                        Skipping test: xray upload demo should look for the anchor element

                        No test issue keys found in title of test: should look for the anchor element
                        You can target existing test issues by adding a corresponding issue key:

                        it("CYP-123 should look for the anchor element", () => {
                          // ...
                        });

                        For more information, visit:
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                )
                .onFirstCall()
                .returns();
            logger.message
                .withArgs(
                    Level.WARNING,
                    dedent(`
                        Skipping test: xray upload demo should fail

                        No test issue keys found in title of test: should fail
                        You can target existing test issues by adding a corresponding issue key:

                        it("CYP-123 should fail", () => {
                          // ...
                        });

                        For more information, visit:
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                )
                .onFirstCall()
                .returns();
            const issueKeys = getNativeTestIssueKeys(result, "CYP");
            expect(issueKeys).to.deep.eq([]);
        });

        it("skips cucumber tests", () => {
            const logger = getMockedLogger();
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const issueKeys = getNativeTestIssueKeys(result, "CYP", ".feature");
            expect(issueKeys).to.deep.eq(["CYP-330", "CYP-268", "CYP-237", "CYP-332", "CYP-333"]);
            expect(logger.message).to.not.have.been.called;
        });
    });

    describe("containsNativeTest", () => {
        it("returns true for native runs", () => {
            expect(containsNativeTest(result)).to.be.true;
        });

        it("returns true for mixed runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            expect(containsNativeTest(result, ".feature")).to.be.true;
        });

        it("returns false for cucumber runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            expect(containsNativeTest(result, ".feature")).to.be.false;
        });

        it("regards cucumber runs as native if cucumber was not configured", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            expect(containsNativeTest(result)).to.be.true;
        });
    });

    describe("getTestIssueKey", () => {
        it("should extract single test issue keys", () => {
            expect(getNativeTestIssueKey("this is CYP-123 a test", "CYP")).to.eq("CYP-123");
        });

        it("should log warnings for missing test issue keys", () => {
            expect(() => getNativeTestIssueKey("this is a test", "CYP")).to.throw(
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
            expect(() =>
                getNativeTestIssueKey("CYP-123 this is a CYP-456 test CYP-789", "CYP")
            ).to.throw(
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
