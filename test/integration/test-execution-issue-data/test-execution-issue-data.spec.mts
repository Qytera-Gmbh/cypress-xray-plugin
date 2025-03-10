import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";
import { runCypress } from "../../sh.mjs";
import { getIntegrationClient } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey } from "../util.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/359
// ============================================================================================== //

describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, async () => {
    for (const test of [
        {
            expectedLabels: [],
            expectedSummary: "Integration test test execution issue data (hardcoded)",
            projectDirectory: join(import.meta.dirname, "static-cloud"),
            projectKey: "CYP",
            service: "cloud",
            title: "test execution issue data is hardcoded (cloud)",
        },
        {
            expectedLabels: ["x", "y"],
            expectedSummary: "Integration test dynamic test execution issue data (wrapped)",
            projectDirectory: join(import.meta.dirname, "dynamic-cloud"),
            projectKey: "CYP",
            service: "cloud",
            title: "test execution issue data is wrapped (cloud)",
        },
        {
            expectedLabels: [],
            expectedSummary: "Integration test test execution issue data (hardcoded)",
            projectDirectory: join(import.meta.dirname, "static-server"),
            projectKey: "CYPLUG",
            service: "server",
            title: "test execution issue data is hardcoded (server)",
        },
        {
            expectedLabels: ["x", "y"],
            expectedSummary: "Integration test dynamic test execution issue data (wrapped)",
            projectDirectory: join(import.meta.dirname, "dynamic-server"),
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

            let searchResult;
            // Jira server does not like searches immediately after issue creation (socket hang up).
            if (test.service === "server") {
                await setTimeout(10000);
                searchResult = await getIntegrationClient("jira", test.service).issues.getIssue({
                    fields: ["labels", "summary"],
                    issueIdOrKey: testExecutionIssueKey,
                });
            } else {
                // Duplication necessary because of TypeScript errors (jira.js problem).
                searchResult = await getIntegrationClient("jira", test.service).issues.getIssue({
                    fields: ["labels", "summary"],
                    issueIdOrKey: testExecutionIssueKey,
                });
            }

            assert.deepStrictEqual(searchResult.fields.labels, test.expectedLabels);
            assert.deepStrictEqual(searchResult.fields.summary, test.expectedSummary);
        });
    }
});
