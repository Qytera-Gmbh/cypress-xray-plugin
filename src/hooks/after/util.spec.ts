import assert from "node:assert";
import fs from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import type { CypressRunResult } from "../../types/cypress";
import { dedent } from "../../util/dedent";
import { containsCucumberTest, containsCypressTest, getTestIssueKeys } from "./util";

describe(relative(cwd(), __filename), async () => {
    await describe(containsCypressTest.name, async () => {
        let result: CypressRunResult;

        beforeEach(() => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResult;
        });

        await it("returns true for native runs", () => {
            assert.strictEqual(containsCypressTest(result), true);
        });

        await it("returns true for mixed runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            ) as CypressRunResult;
            assert.strictEqual(containsCypressTest(result, ".feature"), true);
        });

        await it("returns false for cucumber runs", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressRunResult;
            assert.strictEqual(containsCypressTest(result, ".feature"), false);
        });

        await it("regards cucumber runs as native if cucumber was not configured", () => {
            result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressRunResult;
            assert.strictEqual(containsCypressTest(result), true);
        });
    });

    await describe(containsCucumberTest.name, async () => {
        await it("returns true for Cucumber runs", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressRunResult;
            assert.strictEqual(containsCucumberTest(result, ".feature"), true);
        });

        await it("returns true for mixed runs", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
            ) as CypressRunResult;
            assert.strictEqual(containsCucumberTest(result, ".feature"), true);
        });

        await it("returns false for native runs", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResult;
            assert.strictEqual(containsCucumberTest(result, ".feature"), false);
        });

        await it("regards cucumber runs as native if cucumber was not configured", () => {
            const result = JSON.parse(
                fs.readFileSync("./test/resources/runResultCucumber.json", "utf-8")
            ) as CypressRunResult;
            assert.strictEqual(containsCucumberTest(result), false);
        });
    });

    await describe(getTestIssueKeys.name, async () => {
        await it("extracts single test issue keys", () => {
            assert.deepStrictEqual(getTestIssueKeys("this is CYP-123 a test", "CYP"), ["CYP-123"]);
        });

        await it("extracts multiple test issue keys", () => {
            assert.deepStrictEqual(
                getTestIssueKeys("CYP-123 this is a CYP-456 test CYP-789", "CYP"),
                ["CYP-123", "CYP-456", "CYP-789"]
            );
        });

        await it("logs warnings for missing test issue keys", () => {
            assert.throws(() => getTestIssueKeys("this is a test", "CYP"), {
                message: dedent(`
                    Test: this is a test

                      No test issue keys found in title.

                      You can target existing test issues by adding a corresponding issue key:

                        it("CYP-123 this is a test", () => {
                          // ...
                        });

                      For more information, visit:
                      - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `),
            });
        });
    });
});
