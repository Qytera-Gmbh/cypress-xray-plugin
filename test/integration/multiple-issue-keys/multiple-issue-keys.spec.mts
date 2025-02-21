import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { runCypress } from "../../sh.js";
import { getIntegrationClient } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey } from "../util.js";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/328
// ============================================================================================== //

describe(relative(cwd(), __filename), { timeout: 180000 }, async () => {
    for (const test of [
        {
            cucumberTests: ["CYP-969", "CYP-970"],
            manualTests: ["CYP-967", "CYP-968"],
            projectDirectory: join(__dirname, "cloud"),
            projectKey: "CYP",
            service: "cloud",
            title: "results upload works for tests with multiple issue keys (cloud)",
        },
        {
            cucumberTests: ["CYPLUG-342", "CYPLUG-343"],
            manualTests: ["CYPLUG-340", "CYPLUG-341"],
            projectDirectory: join(__dirname, "server"),
            projectKey: "CYPLUG",
            service: "server",
            title: "results upload works for tests with multiple issue keys (server)",
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
                    [
                        test.manualTests[0],
                        test.manualTests[1],
                        test.cucumberTests[0],
                        test.cucumberTests[1],
                    ]
                );
            }

            if (test.service === "server") {
                const testResults = await getIntegrationClient(
                    "xray",
                    test.service
                ).getTestExecution(testExecutionIssueKey);
                assert.deepStrictEqual(
                    testResults.map((result) => result.key),
                    [
                        test.manualTests[0],
                        test.manualTests[1],
                        test.cucumberTests[0],
                        test.cucumberTests[1],
                    ]
                );
            }
        });
    }
});
