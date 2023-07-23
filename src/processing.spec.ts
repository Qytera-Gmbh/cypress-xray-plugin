import { expect } from "chai";
import dedent from "dedent";
import fs from "fs";
import { stubLogging } from "../test/util";
import { initOptions } from "./context";
import { containsCucumberTest, containsNativeTest, getNativeTestIssueKeys } from "./processing";
import { InternalOptions } from "./types/plugin";

describe("the processing", () => {
    let result: CypressCommandLine.CypressRunResult;
    let options: InternalOptions;

    beforeEach(() => {
        options = initOptions(
            {},
            {
                jira: {
                    projectKey: "CYP",
                    url: "https://example.org",
                },
                cucumber: {
                    featureFileExtension: ".feature",
                },
            }
        );
        result = JSON.parse(
            fs.readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
        );
    });

    describe("getNativeTestIssueKeys", () => {
        it("returns valid issue keys", () => {
            const issueKeys = getNativeTestIssueKeys(result, options);
            expect(issueKeys).to.deep.eq(["CYP-40", "CYP-41", "CYP-49"]);
        });

        it("skips invalid or missing issue keys", () => {
            result = JSON.parse(fs.readFileSync("./test/resources/runResult.json", "utf-8"));
            const { stubbedWarning } = stubLogging();
            const issueKeys = getNativeTestIssueKeys(result, options);
            expect(issueKeys).to.deep.eq([]);
            expect(stubbedWarning).to.have.been.called.with.callCount(3);
            expect(stubbedWarning.getCall(0)).to.have.been.calledWithExactly(
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
            );
            expect(stubbedWarning.getCall(1)).to.have.been.calledWithExactly(
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
            );
            expect(stubbedWarning.getCall(2)).to.have.been.calledWithExactly(
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
            );
        });

        it("skips cucumber tests", () => {
            const { stubbedWarning } = stubLogging();
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            );
            const issueKeys = getNativeTestIssueKeys(result, options);
            expect(issueKeys).to.deep.eq(["CYP-330", "CYP-268", "CYP-237", "CYP-332", "CYP-333"]);
            expect(stubbedWarning).to.not.have.been.called;
        });
    });

    describe("containsNativeTest", () => {
        it("returns true", () => {
            expect(containsNativeTest(result, options)).to.be.true;
        });

        it("returns true for mixed runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            );
            expect(containsNativeTest(result, options)).to.be.true;
        });

        it("returns false for cucumber runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            );
            expect(containsNativeTest(result, options)).to.be.false;
        });

        it("regards cucumber runs as native if cucumber was not configured", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            );
            options.cucumber = undefined;
            expect(containsNativeTest(result, options)).to.be.true;
        });
    });

    describe("containsCucumberTest", () => {
        it("returns true", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            );
            expect(containsCucumberTest(result, options)).to.be.true;
        });

        it("returns true for mixed runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            );
            expect(containsCucumberTest(result, options)).to.be.true;
        });

        it("returns false for native runs", () => {
            result = JSON.parse(fs.readFileSync("./test/resources/runResult.json", "utf-8"));
            expect(containsCucumberTest(result, options)).to.be.false;
        });

        it("regards cucumber runs as native if cucumber was not configured", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            );
            options.cucumber = undefined;
            expect(containsCucumberTest(result, options)).to.be.false;
        });
    });
});
