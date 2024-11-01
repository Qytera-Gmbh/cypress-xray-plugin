import { expect } from "chai";
import fs from "fs";
import { beforeEach, describe, it } from "node:test";
import { relative } from "path";
import type { CypressRunResultType } from "../../types/cypress/cypress.js";
import { dedent } from "../../util/dedent.js";
import { containsCucumberTest, containsCypressTest, getTestIssueKeys } from "./util.js";

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await describe(containsCypressTest.name, async () => {
        let result: CypressRunResultType;

        beforeEach(() => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
        });

        await it("returns true for native runs", () => {
            expect(containsCypressTest(result)).to.be.true;
        });

        await it("returns true for mixed runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            ) as CypressRunResultType;
            expect(containsCypressTest(result, ".feature")).to.be.true;
        });

        await it("returns false for cucumber runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressRunResultType;
            expect(containsCypressTest(result, ".feature")).to.be.false;
        });

        await it("regards cucumber runs as native if cucumber was not configured", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressRunResultType;
            expect(containsCypressTest(result)).to.be.true;
        });
    });

    await describe(containsCucumberTest.name, async () => {
        await it("returns true for Cucumber runs", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressRunResultType;
            expect(containsCucumberTest(result, ".feature")).to.be.true;
        });

        await it("returns true for mixed runs", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            ) as CypressRunResultType;
            expect(containsCucumberTest(result, ".feature")).to.be.true;
        });

        await it("returns false for native runs", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResultType;
            expect(containsCucumberTest(result, ".feature")).to.be.false;
        });

        await it("regards cucumber runs as native if cucumber was not configured", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressRunResultType;
            expect(containsCucumberTest(result)).to.be.false;
        });
    });

    await describe(getTestIssueKeys.name, async () => {
        await it("extracts single test issue keys", () => {
            expect(getTestIssueKeys("this is CYP-123 a test", "CYP")).to.deep.eq(["CYP-123"]);
        });

        await it("extracts multiple test issue keys", () => {
            expect(getTestIssueKeys("CYP-123 this is a CYP-456 test CYP-789", "CYP")).to.deep.eq([
                "CYP-123",
                "CYP-456",
                "CYP-789",
            ]);
        });

        await it("logs warnings for missing test issue keys", () => {
            expect(() => getTestIssueKeys("this is a test", "CYP")).to.throw(
                dedent(`
                    Test: this is a test

                      No test issue keys found in title.

                      You can target existing test issues by adding a corresponding issue key:

                        await it("CYP-123 this is a test", () => {
                          // ...
                        });

                      For more information, visit:
                      - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });
    });
});
