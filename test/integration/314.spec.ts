import ansiColors from "ansi-colors";
import assert from "node:assert";
import fs from "node:fs";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import type { LoggedRequest } from "../../src/client/https/requests";
import { dedent } from "../../src/util/dedent";
import { LOCAL_SERVER } from "../server";
import { runCypress, setupCypressProject } from "../sh";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/314
// ============================================================================================== //

describe(relative(cwd(), __filename), { timeout: 180000 }, async () => {
    for (const test of [
        {
            commandFileContent: dedent(`
                import { enqueueTask } from "cypress-xray-plugin/tasks";

                Cypress.Commands.overwrite("request", (originalFn, request) => {
                    return enqueueTask("cypress-xray-plugin:add-evidence", {
                        contentType: "application/json",
                        data: Cypress.Buffer.from(JSON.stringify(request, null, 2)),
                        filename: "request.json",
                    })
                        .then(() => originalFn(request))
                        .then((response) => {
                            enqueueTask("cypress-xray-plugin:add-evidence", {
                                contentType: "application/json",
                                data: Cypress.Buffer.from(JSON.stringify(response, null, 2)),
                                filename: "response.json",
                            });
                            return cy.wrap(response);
                        });
                });
            `),
            env: {
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 314",
            },
            service: "cloud",
            testIssueKey: "CYP-692",
            title: "cy.request gets overwritten using task calls (cloud)",
        },
        {
            commandFileContent: dedent(`
                import { enqueueTask } from "cypress-xray-plugin/tasks";

                Cypress.Commands.overwrite("request", (originalFn, request) => {
                    return enqueueTask("cypress-xray-plugin:add-evidence", {
                        contentType: "application/json",
                        data: Cypress.Buffer.from(JSON.stringify(request, null, 2)),
                        filename: "request.json",
                    })
                        .then(() => originalFn(request))
                        .then((response) => {
                            enqueueTask("cypress-xray-plugin:add-evidence", {
                                contentType: "application/json",
                                data: Cypress.Buffer.from(JSON.stringify(response, null, 2)),
                                filename: "response.json",
                            });
                            return cy.wrap(response);
                        });
                });
            `),
            env: {
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 314",
            },
            service: "server",
            testIssueKey: "CYPLUG-117",
            title: "cy.request gets overwritten using task calls (server)",
        },
    ] as const) {
        await it(test.title, () => {
            const project = setupCypressProject({
                commandFileContent: test.commandFileContent,
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
            for (const entry of fs.readdirSync(project.logDirectory, {
                withFileTypes: true,
            })) {
                // 14_15_52_POST_https_xray.cloud.getxray.app_api_v2_import_execution_multipart_request.json
                if (!/.+_POST_.+_import_execution_multipart_request.json/.exec(entry.name)) {
                    continue;
                }
                const fileContent = JSON.parse(
                    fs.readFileSync(join(entry.parentPath, entry.name), "utf8")
                ) as LoggedRequest;
                assert.strictEqual(
                    (fileContent.body as string).includes(
                        '"evidence":[{"contentType":"application/json","data":"ImxvY2FsaG9zdDo4MDgwIg=="'
                    ),
                    true
                );
                return;
            }
            assert.fail(
                `Expected to find a logged import execution request in log directory ${ansiColors.red(
                    project.logDirectory
                )}, but did not find any`
            );
        });
    }
});
