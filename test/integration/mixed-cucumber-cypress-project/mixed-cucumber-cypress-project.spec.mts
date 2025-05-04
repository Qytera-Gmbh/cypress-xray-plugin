import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { runCypress } from "../../sh.mjs";
import { getIntegrationClient } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey } from "../util.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/282
// ============================================================================================== //

describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, async () => {
    for (const testCase of [
        {
            projectDirectory: join(import.meta.dirname, "cloud"),
            projectKey: "CYP",
            scenarioIssueKey: "CYP-756",
            service: "cloud",
            testIssueKey: "CYP-757",
            title: "results upload works for mixed cypress and cucumber projects (cloud)",
        },
        {
            projectDirectory: join(import.meta.dirname, "server"),
            projectKey: "CYPLUG",
            scenarioIssueKey: "CYPLUG-165",
            service: "server",
            testIssueKey: "CYPLUG-166",
            title: "results upload works for mixed cypress and cucumber projects (server)",
        },
    ] as const) {
        await it(testCase.title, async () => {
            const output = runCypress(testCase.projectDirectory, {
                includeDefaultEnv: testCase.service,
            });

            const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                testCase.projectKey,
                output,
                "both"
            );

            if (testCase.service === "cloud") {
                const issue = await getIntegrationClient("jira", testCase.service).issues.getIssue({
                    fields: ["id"],
                    issueIdOrKey: testExecutionIssueKey,
                });
                assert.ok(issue.id);
                const execution = await getIntegrationClient(
                    "xray",
                    testCase.service
                ).graphql.getTestExecution({ issueId: issue.id }, (testExecution) => [
                    testExecution.tests({ limit: 100 }, (testResults) => [
                        testResults.results((test) => [test.jira({ fields: ["key"] })]),
                    ]),
                ]);
                assert.strictEqual(execution.tests?.results?.[0]?.jira.key, testCase.testIssueKey);
                assert.strictEqual(execution.tests.results[1]?.jira.key, testCase.scenarioIssueKey);
            }

            if (testCase.service === "server") {
                const testResults = await getIntegrationClient(
                    "xray",
                    testCase.service
                ).testExecution.getTests(testExecutionIssueKey);
                assert.deepStrictEqual(
                    testResults.map((result) => result.key),
                    [testCase.testIssueKey, testCase.scenarioIssueKey]
                );
            }
        });
    }
});
