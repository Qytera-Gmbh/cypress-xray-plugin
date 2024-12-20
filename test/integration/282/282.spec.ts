import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { runCypress } from "../../sh";
import { getIntegrationClient } from "../clients";
import { getCreatedTestExecutionIssueKey } from "../util";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/282
// ============================================================================================== //

describe(relative(cwd(), __filename), { timeout: 180000 }, async () => {
    for (const test of [
        {
            projectDirectory: join(__dirname, "cloud"),
            projectKey: "CYP",
            scenarioIssueKey: "CYP-756",
            service: "cloud",
            testIssueKey: "CYP-757",
            title: "results upload works for mixed cypress and cucumber projects (cloud)",
        },
        {
            projectDirectory: join(__dirname, "server"),
            projectKey: "CYPLUG",
            scenarioIssueKey: "CYPLUG-165",
            service: "server",
            testIssueKey: "CYPLUG-166",
            title: "results upload works for mixed cypress and cucumber projects (server)",
        },
    ] as const) {
        await it(test.title, async () => {
            const output = runCypress(test.projectDirectory, {
                includeDefaultEnv: test.service,
            });

            const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                test.projectKey,
                output,
                "both"
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
                assert.deepStrictEqual(
                    testResults.map((result) => result.jira.key),
                    [test.testIssueKey, test.scenarioIssueKey]
                );
            }

            if (test.service === "server") {
                const testResults = await getIntegrationClient(
                    "xray",
                    test.service
                ).getTestExecution(testExecutionIssueKey);
                assert.deepStrictEqual(
                    testResults.map((result) => result.key),
                    [test.testIssueKey, test.scenarioIssueKey]
                );
            }
        });
    }
});
