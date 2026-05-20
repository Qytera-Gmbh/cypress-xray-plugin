import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { runCypress } from "../../sh.mjs";
import { getIntegrationClient } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey, shouldRunIntegrationTests } from "../util.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/282
// ============================================================================================== //

void describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, () => {
    if (shouldRunIntegrationTests("cloud")) {
        for (const testCase of [
            {
                projectDirectory: join(import.meta.dirname, "cloud"),
                projectKey: "CXP",
                scenarioIssueKey: "CXP-4",
                testIssueKey: "CXP-3",
                title: "results upload works for mixed cypress and cucumber projects (cloud)",
            },
        ] as const) {
            void it(testCase.title, async () => {
                const output = runCypress(testCase.projectDirectory, {
                    includeDefaultEnv: "cloud",
                });

                const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                    testCase.projectKey,
                    output,
                    "both"
                );

                const issue = await getIntegrationClient("jira", "cloud").issues.getIssue({
                    fields: ["id"],
                    issueIdOrKey: testExecutionIssueKey,
                });
                assert.ok(issue.id);
                const execution = await getIntegrationClient(
                    "xray",
                    "cloud"
                ).graphql.getTestExecution({ issueId: issue.id }, (testExecution) => [
                    testExecution.tests({ limit: 100 }, (testResults) => [
                        testResults.results((test) => [test.jira({ fields: ["key"] })]),
                    ]),
                ]);
                assert.strictEqual(execution.tests?.results?.[0]?.jira.key, testCase.testIssueKey);
                assert.strictEqual(execution.tests.results[1]?.jira.key, testCase.scenarioIssueKey);
            });
        }
    }

    if (shouldRunIntegrationTests("server")) {
        for (const testCase of [
            {
                projectDirectory: join(import.meta.dirname, "server"),
                projectKey: "CYPLUG",
                scenarioIssueKey: "CYPLUG-165",
                testIssueKey: "CYPLUG-166",
                title: "results upload works for mixed cypress and cucumber projects (server)",
            },
        ] as const) {
            void it(testCase.title, async () => {
                const output = runCypress(testCase.projectDirectory, {
                    includeDefaultEnv: "server",
                });

                const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                    testCase.projectKey,
                    output,
                    "both"
                );

                const testResults = await getIntegrationClient(
                    "xray",
                    "server"
                ).testExecution.getTests(testExecutionIssueKey);
                assert.deepStrictEqual(
                    testResults.map((result) => result.key),
                    [testCase.testIssueKey, testCase.scenarioIssueKey]
                );
            });
        }
    }
});
