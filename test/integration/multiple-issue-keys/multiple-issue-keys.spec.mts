import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { runCypress } from "../../sh.mjs";
import { getIntegrationClient } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey } from "../util.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/328
// ============================================================================================== //

describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, async () => {
    for (const testCase of [
        {
            cucumberTests: ["CYP-969", "CYP-970"],
            manualTests: ["CYP-967", "CYP-968"],
            projectDirectory: join(import.meta.dirname, "cloud"),
            projectKey: "CYP",
            service: "cloud",
            title: "results upload works for tests with multiple issue keys (cloud)",
        },
        {
            cucumberTests: ["CYPLUG-342", "CYPLUG-343"],
            manualTests: ["CYPLUG-340", "CYPLUG-341"],
            projectDirectory: join(import.meta.dirname, "server"),
            projectKey: "CYPLUG",
            service: "server",
            title: "results upload works for tests with multiple issue keys (server)",
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
                        testResults.results((test) => [test.jira({ fields: ["key"] })]),
                    ]),
                ]);
                assert.strictEqual(query.tests?.results?.[0]?.jira.key, testCase.manualTests[0]);
                assert.strictEqual(query.tests.results[1]?.jira.key, testCase.manualTests[1]);
                assert.strictEqual(query.tests.results[2]?.jira.key, testCase.cucumberTests[0]);
                assert.strictEqual(query.tests.results[3]?.jira.key, testCase.cucumberTests[1]);
            }

            if (testCase.service === "server") {
                const testResults = await getIntegrationClient(
                    "xray",
                    testCase.service
                ).testExecution.getTests(testExecutionIssueKey);
                assert.deepStrictEqual(
                    testResults.map((result) => result.key),
                    [
                        testCase.manualTests[0],
                        testCase.manualTests[1],
                        testCase.cucumberTests[0],
                        testCase.cucumberTests[1],
                    ]
                );
            }
        });
    }
});
