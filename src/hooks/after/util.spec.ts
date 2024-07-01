import { expect } from "chai";
import fs from "fs";
import path from "path";
import { CypressRunResultType } from "../../types/cypress/cypress";
import { dedent } from "../../util/dedent";
import { containsCucumberTest, containsCypressTest, getTestIssueKeys } from "./util";

describe(path.relative(process.cwd(), __filename), () => {
    describe(containsCypressTest.name, () => {
        let result: CypressRunResultType;

        beforeEach(() => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
        });

        it("returns true for native runs", () => {
            expect(containsCypressTest(result)).to.be.true;
        });

        it("returns true for mixed runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            ) as CypressRunResultType;
            expect(containsCypressTest(result, ".feature")).to.be.true;
        });

        it("returns false for cucumber runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressRunResultType;
            expect(containsCypressTest(result, ".feature")).to.be.false;
        });

        it("regards cucumber runs as native if cucumber was not configured", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressRunResultType;
            expect(containsCypressTest(result)).to.be.true;
        });
    });

    describe(containsCucumberTest.name, () => {
        it("returns true for Cucumber runs", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressRunResultType;
            expect(containsCucumberTest(result, ".feature")).to.be.true;
        });

        it("returns true for mixed runs", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            ) as CypressRunResultType;
            expect(containsCucumberTest(result, ".feature")).to.be.true;
        });

        it("returns false for native runs", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResultType;
            expect(containsCucumberTest(result, ".feature")).to.be.false;
        });

        it("regards cucumber runs as native if cucumber was not configured", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressRunResultType;
            expect(containsCucumberTest(result)).to.be.false;
        });
    });

    describe(getTestIssueKeys.name, () => {
        it("extracts single test issue keys", () => {
            expect(getTestIssueKeys("this is CYP-123 a test", "CYP")).to.deep.eq(["CYP-123"]);
        });

        it("extracts multiple test issue keys", () => {
            expect(getTestIssueKeys("CYP-123 this is a CYP-456 test CYP-789", "CYP")).to.deep.eq([
                "CYP-123",
                "CYP-456",
                "CYP-789",
            ]);
        });

        it("logs warnings for missing test issue keys", () => {
            expect(() => getTestIssueKeys("this is a test", "CYP")).to.throw(
                dedent(`
                    Test: this is a test

                      No test issue keys found in title.

                      You can target existing test issues by adding a corresponding issue key:

                        it("CYP-123 this is a test", () => {
                          // ...
                        });

                      For more information, visit:
                      - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });
    });
});
