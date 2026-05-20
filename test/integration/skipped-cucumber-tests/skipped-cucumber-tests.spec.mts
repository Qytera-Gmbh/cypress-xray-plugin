import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { runCypress } from "../../sh.mjs";
import { getIntegrationClient } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey, shouldRunIntegrationTests } from "../util.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/341
// ============================================================================================== //

void describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, () => {
    if (shouldRunIntegrationTests("cloud")) {
        for (const testCase of [
            {
                projectDirectory: join(import.meta.dirname, "cloud"),
                projectKey: "CXP",
                testKeys: {
                    included: "CXP-12",
                    skipped: "CXP-13",
                },
                title: "results upload works for skipped cucumber tests (cloud)",
                xrayPassedStatus: "PASSED",
                xraySkippedStatus: "SKIPPED",
            },
        ] as const) {
            void it(testCase.title, async () => {
                const output = runCypress(testCase.projectDirectory, {
                    includeDefaultEnv: "cloud",
                });

                const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                    testCase.projectKey,
                    output,
                    "cucumber"
                );

                const execution = await getIntegrationClient("jira", "cloud").issues.getIssue({
                    fields: ["id"],
                    issueIdOrKey: testExecutionIssueKey,
                });
                assert.ok(execution.id);
                const query = await getIntegrationClient("xray", "cloud").graphql.getTestExecution(
                    { issueId: execution.id },
                    (testExecution) => [
                        testExecution.tests({ limit: 100 }, (testResults) => [
                            testResults.results((test) => [
                                test.status((status) => [status.name]),
                                test.jira({ fields: ["summary"] }),
                            ]),
                        ]),
                    ]
                );
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
            });
        }
    }

    if (shouldRunIntegrationTests("server")) {
        for (const testCase of [
            {
                projectDirectory: join(import.meta.dirname, "server"),
                projectKey: "CYPLUG",
                testKeys: {
                    included: "CYPLUG-208",
                    skipped: "CYPLUG-209",
                },
                title: "results upload works for skipped cucumber tests (server)",
                xrayPassedStatus: "PASS",
                xraySkippedStatus: "ABORTED",
            },
        ] as const) {
            void it(testCase.title, async () => {
                const output = runCypress(testCase.projectDirectory, {
                    includeDefaultEnv: "server",
                });

                const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                    testCase.projectKey,
                    output,
                    "cucumber"
                );

                const tests = await getIntegrationClient("xray", "server").testExecution.getTests(
                    testExecutionIssueKey
                );
                const includedTest = tests.find((r) => r.key === testCase.testKeys.included);
                assert.ok(includedTest);
                assert.strictEqual(includedTest.status, testCase.xrayPassedStatus);
                const skippedTest = tests.find((r) => r.key === testCase.testKeys.skipped);
                assert.ok(skippedTest);
                assert.strictEqual(skippedTest.status, testCase.xraySkippedStatus);
            });
        }
    }
});
