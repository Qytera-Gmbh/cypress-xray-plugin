import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";
import { runCypress } from "../../sh.mjs";
import { getIntegrationClient } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey, shouldRunIntegrationTests } from "../util.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/359
// ============================================================================================== //

void describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, () => {
    if (shouldRunIntegrationTests("cloud")) {
        for (const test of [
            {
                expectedLabels: [],
                expectedSummary: "Integration test test execution issue data (hardcoded)",
                projectDirectory: join(import.meta.dirname, "static-cloud"),
                projectKey: "CXP",
                title: "test execution issue data is hardcoded (cloud)",
            },
            {
                expectedLabels: ["x", "y"],
                expectedSummary: "Integration test dynamic test execution issue data (wrapped)",
                projectDirectory: join(import.meta.dirname, "dynamic-cloud"),
                projectKey: "CXP",
                title: "test execution issue data is wrapped (cloud)",
            },
        ] as const) {
            void it(test.title, async () => {
                const output = runCypress(test.projectDirectory, { includeDefaultEnv: "cloud" });

                const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                    test.projectKey,
                    output,
                    "cypress"
                );

                // Duplication necessary because of TypeScript errors (jira.js problem).
                const searchResult = await getIntegrationClient("jira", "cloud").issues.getIssue({
                    fields: ["labels", "summary"],
                    issueIdOrKey: testExecutionIssueKey,
                });

                assert.deepStrictEqual(searchResult.fields.labels, test.expectedLabels);
                assert.deepStrictEqual(searchResult.fields.summary, test.expectedSummary);
            });
        }
    }

    if (shouldRunIntegrationTests("server")) {
        for (const test of [
            {
                expectedLabels: [],
                expectedSummary: "Integration test test execution issue data (hardcoded)",
                projectDirectory: join(import.meta.dirname, "static-server"),
                projectKey: "CYPLUG",
                title: "test execution issue data is hardcoded (server)",
            },
            {
                expectedLabels: ["x", "y"],
                expectedSummary: "Integration test dynamic test execution issue data (wrapped)",
                projectDirectory: join(import.meta.dirname, "dynamic-server"),
                projectKey: "CYPLUG",
                title: "test execution issue data is wrapped (server)",
            },
        ] as const) {
            void it(test.title, async () => {
                const output = runCypress(test.projectDirectory, { includeDefaultEnv: "server" });

                const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                    test.projectKey,
                    output,
                    "cypress"
                );

                // Jira server does not like searches immediately after issue creation (socket hang up).
                await setTimeout(10000);
                const searchResult = await getIntegrationClient("jira", "server").issues.getIssue({
                    fields: ["labels", "summary"],
                    issueIdOrKey: testExecutionIssueKey,
                });

                assert.deepStrictEqual(searchResult.fields.labels, test.expectedLabels);
                assert.deepStrictEqual(searchResult.fields.summary, test.expectedSummary);
            });
        }
    }
});
