import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { runCypress } from "../../sh.mjs";
import { getIntegrationClient } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey } from "../util.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/341
// ============================================================================================== //

describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, async () => {
    for (const testCase of [
        {
            projectDirectory: join(import.meta.dirname, "cloud"),
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
            projectDirectory: join(import.meta.dirname, "server"),
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
        await it(testCase.title, async () => {
            const output = runCypress(testCase.projectDirectory, {
                includeDefaultEnv: testCase.service,
            });

            const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                testCase.projectKey,
                output,
                "cucumber"
            );

            if (testCase.service === "cloud") {
                const execution = await getIntegrationClient(
                    "jira",
                    testCase.service
                ).issues.getIssue({
                    fields: ["id"],
                    issueIdOrKey: testExecutionIssueKey,
                });
                assert.ok(execution.id);
                const query = await getIntegrationClient(
                    "xray",
                    testCase.service
                ).graphql.getTestExecution({ issueId: execution.id }, (testExecution) => [
                    testExecution.tests({ limit: 100 }, (testResults) => [
                        testResults.results((test) => [
                            test.status((status) => [status.name]),
                            test.jira({ fields: ["summary"] }),
                        ]),
                    ]),
                ]);
                const includedTest = query.tests?.results?.find(
                    (t) => t?.jira.summary === "included cucumber test"
                );
                assert.ok(includedTest);
                assert.strictEqual(includedTest.status?.name, testCase.xrayPassedStatus);
                const skippedTest = query.tests?.results?.find(
                    (t) => t?.jira.summary === "skipped cucumber test"
                );
                assert.ok(skippedTest);
                assert.strictEqual(skippedTest.status?.name, testCase.xraySkippedStatus);
            }

            if (testCase.service === "server") {
                const tests = await getIntegrationClient(
                    "xray",
                    testCase.service
                ).testExecutions.getTests(testExecutionIssueKey);
                const includedTest = tests.find((r) => r.key === testCase.testKeys.included);
                assert.ok(includedTest);
                assert.strictEqual(includedTest.status, testCase.xrayPassedStatus);
                const skippedTest = tests.find((r) => r.key === testCase.testKeys.skipped);
                assert.ok(skippedTest);
                assert.strictEqual(skippedTest.status, testCase.xraySkippedStatus);
            }
        });
    }
});
