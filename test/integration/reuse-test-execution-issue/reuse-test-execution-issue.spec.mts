import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { runCypress } from "../../sh.mjs";
import { getCreatedTestExecutionIssueKey, shouldRunIntegrationTests } from "../util.mjs";

void describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, () => {
    if (shouldRunIntegrationTests("cloud")) {
        for (const testCase of [
            {
                projectDirectory: join(import.meta.dirname, "cloud"),
                projectKey: "CXP",
                testExecutionIssueKey: "CXP-804",
                title: "reuse test execution issue (cloud)",
            },
        ] as const) {
            void it(testCase.title, () => {
                const output = runCypress(testCase.projectDirectory, {
                    expectedStatusCode: 0,
                    includeDefaultEnv: "cloud",
                });
                const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                    testCase.projectKey,
                    output,
                    "cypress"
                );
                assert.strictEqual(testExecutionIssueKey, testCase.testExecutionIssueKey);
            });
        }
    }

    if (shouldRunIntegrationTests("server")) {
        for (const testCase of [
            {
                projectDirectory: join(import.meta.dirname, "server"),
                projectKey: "CYPLUG",
                testExecutionIssueKey: "CYPLUG-3102",
                title: "reuse test execution issue (server)",
            },
        ] as const) {
            void it(testCase.title, () => {
                const output = runCypress(testCase.projectDirectory, {
                    expectedStatusCode: 0,
                    includeDefaultEnv: "server",
                });
                const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                    testCase.projectKey,
                    output,
                    "cypress"
                );
                assert.strictEqual(testExecutionIssueKey, testCase.testExecutionIssueKey);
            });
        }
    }
});
