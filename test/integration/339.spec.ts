import assert from "node:assert";
import fs from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "../../src/util/dedent";
import { LOCAL_SERVER } from "../server";
import { runCypress, setupCypressProject } from "../sh";

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
            service: "cloud",
            testIssueKey: "CYP-741",
            title: "the cy.request task does not do anything if disabled (cloud)",
        },
        {
            env: {
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 339",
                ["CYPRESS_PLUGIN_ENABLED"]: "false",
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
            service: "server",
            testIssueKey: "CYPLUG-154",
            title: "the cy.request task does not do anything if disabled (server)",
        },
    ] as const) {
        await it(test.title, () => {
            const project = setupCypressProject({
                testFiles: [
                    {
                        content: dedent(`
                            describe("request", () => {
                                it("${test.testIssueKey} does something", () => {
                                    cy.request("${LOCAL_SERVER.url}");
                                });
                            });
                        `),
                        fileName: "cy.request.cy.js",
                    },
                ],
            });
            runCypress(project.projectDirectory, {
                env: test.env,
                includeDefaultEnv: test.service,
            });
            assert.strictEqual(fs.existsSync(project.logDirectory), false);
        });
    }
});
