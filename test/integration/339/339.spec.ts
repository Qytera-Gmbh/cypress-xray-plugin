import assert from "node:assert";
import fs from "node:fs";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { runCypress } from "../../sh";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/pull/339
// ============================================================================================== //

describe(relative(cwd(), __filename), { timeout: 180000 }, async () => {
    for (const test of [
        {
            env: {
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 339",
                ["CYPRESS_PLUGIN_ENABLED"]: "false",
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
            logDirectory: join(__dirname, "server", "logs"),
            projectDirectory: join(__dirname, "cloud"),
            service: "cloud",
            title: "the cy.request task does not do anything if disabled (cloud)",
        },
        {
            env: {
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 339",
                ["CYPRESS_PLUGIN_ENABLED"]: "false",
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
            logDirectory: join(__dirname, "server", "logs"),
            projectDirectory: join(__dirname, "server"),
            service: "server",
            title: "the cy.request task does not do anything if disabled (server)",
        },
    ] as const) {
        await it(test.title, () => {
            runCypress(test.projectDirectory, {
                env: test.env,
                includeDefaultEnv: test.service,
            });
            assert.strictEqual(fs.existsSync(test.logDirectory), false);
        });
    }
});
