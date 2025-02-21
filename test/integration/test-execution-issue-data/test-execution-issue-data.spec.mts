import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";
import { runCypress } from "../../sh.js";
import { getIntegrationClient } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey } from "../util.js";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/359
// ============================================================================================== //

describe(relative(cwd(), __filename), { timeout: 180000 }, async () => {
    for (const test of [
        {
            expectedLabels: [],
            expectedSummary: "Integration test 359 (hardcoded)",
            projectDirectory: join(__dirname, "static-cloud"),
            projectKey: "CYP",
            service: "cloud",
            title: "test execution issue data is hardcoded (cloud)",
        },
        {
            expectedLabels: ["x", "y"],
            expectedSummary: "Integration test 359 (wrapped)",
            projectDirectory: join(__dirname, "dynamic-cloud"),
            projectKey: "CYP",
            service: "cloud",
            title: "test execution issue data is wrapped (cloud)",
        },
        {
            expectedLabels: [],
            expectedSummary: "Integration test 359 (hardcoded)",
            projectDirectory: join(__dirname, "static-server"),
            projectKey: "CYPLUG",
            service: "server",
            title: "test execution issue data is hardcoded (server)",
        },
        {
            expectedLabels: ["x", "y"],
            expectedSummary: "Integration test 359 (wrapped)",
            projectDirectory: join(__dirname, "dynamic-server"),
            projectKey: "CYPLUG",
            service: "server",
            title: "test execution issue data is wrapped (server)",
        },
    ] as const) {
        await it(test.title, async () => {
            const output = runCypress(test.projectDirectory, {
                includeDefaultEnv: test.service,
            });

            const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                test.projectKey,
                output,
                "cypress"
            );

            // Jira server does not like searches immediately after issue creation (socket hang up).
            if (test.service === "server") {
                await setTimeout(10000);
            }

            const searchResult = await getIntegrationClient("jira", test.service).search({
                fields: ["labels", "summary"],
                jql: `issue in (${testExecutionIssueKey})`,
            });
            assert.deepStrictEqual(searchResult[0].fields?.labels, test.expectedLabels);
            assert.deepStrictEqual(searchResult[0].fields.summary, test.expectedSummary);
        });
    }
});
