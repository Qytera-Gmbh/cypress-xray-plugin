import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { runCypress } from "../../sh.js";
import { getIntegrationClient } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey } from "../util.js";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/341
// ============================================================================================== //

describe(relative(cwd(), __filename), { timeout: 180000 }, async () => {
    for (const test of [
        {
            projectDirectory: join(__dirname, "cloud"),
            projectKey: "CYP",
            service: "cloud",
            testKeys: {
                included: "CYP-798",
                skipped: "CYP-797",
            },
            title: "results upload works for skipped cucumber tests (cloud)",
            xrayPassedStatus: "PASSED",
            xraySkippedStatus: "SKIPPED",
        },
        {
            projectDirectory: join(__dirname, "server"),
            projectKey: "CYPLUG",
            service: "server",
            testKeys: {
                included: "CYPLUG-208",
                skipped: "CYPLUG-209",
            },
            title: "results upload works for skipped cucumber tests (server)",
            xrayPassedStatus: "PASS",
            xraySkippedStatus: "ABORTED",
        },
    ] as const) {
        await it(test.title, async () => {
            const output = runCypress(test.projectDirectory, {
                includeDefaultEnv: test.service,
            });

            const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                test.projectKey,
                output,
                "cucumber"
            );

            if (test.service === "cloud") {
                const searchResult = await getIntegrationClient("jira", test.service).search({
                    fields: ["id"],
                    jql: `issue in (${testExecutionIssueKey})`,
                });
                assert.ok(searchResult[0].id);
                const testResults = await getIntegrationClient("xray", test.service).getTestResults(
                    searchResult[0].id
                );
                const includedTest = testResults.find(
                    (r) => r.jira.summary === "included cucumber test"
                );
                assert.ok(includedTest);
                assert.strictEqual(includedTest.status?.name, test.xrayPassedStatus);
                const skippedTest = testResults.find(
                    (r) => r.jira.summary === "skipped cucumber test"
                );
                assert.ok(skippedTest);
                assert.strictEqual(skippedTest.status?.name, test.xraySkippedStatus);
            }

            if (test.service === "server") {
                const testResults = await getIntegrationClient(
                    "xray",
                    test.service
                ).getTestExecution(testExecutionIssueKey);
                const includedTest = testResults.find((r) => r.key === test.testKeys.included);
                assert.ok(includedTest);
                assert.strictEqual(includedTest.status, test.xrayPassedStatus);
                const skippedTest = testResults.find((r) => r.key === test.testKeys.skipped);
                assert.ok(skippedTest);
                assert.strictEqual(skippedTest.status, test.xraySkippedStatus);
            }
        });
    }
});
