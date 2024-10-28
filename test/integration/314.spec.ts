import ansiColors from "ansi-colors";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import process from "process";
import { LoggedRequest } from "../../src/client/https/https";
import { dedent } from "../../src/util/dedent";
import { LOCAL_SERVER } from "../server-config";
import { runCypress, setupCypressProject } from "../sh";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/314
// ============================================================================================== //

describe(path.relative(process.cwd(), __filename), () => {
    for (const test of [
        {
            env: {
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 314",
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
            service: "cloud",
            testIssueKey: "CYP-666",
            title: "cy.request gets overwritten (cloud)",
        },
        {
            env: {
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 314",
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
            service: "server",
            testIssueKey: "CYPLUG-107",
            title: "cy.request gets overwritten (server)",
        },
        {
            commandFileContent: dedent(`
                import { enqueueTask, PluginTask } from "cypress-xray-plugin/commands/tasks";

                Cypress.Commands.overwrite("request", (originalFn, options) => {
                    return enqueueTask(PluginTask.OUTGOING_REQUEST, "request.json", options)
                    .then(originalFn)
                    .then((response) =>
                        enqueueTask(PluginTask.INCOMING_RESPONSE, "response.json", response)
                    );
                });
            `),
            env: {
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 314",
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
            service: "cloud",
            testIssueKey: "CYP-692",
            title: "cy.request gets overwritten using manual task calls (cloud)",
        },
        {
            commandFileContent: dedent(`
                import { enqueueTask, PluginTask } from "cypress-xray-plugin/commands/tasks";

                Cypress.Commands.overwrite("request", (originalFn, options) => {
                    return enqueueTask(PluginTask.OUTGOING_REQUEST, "request.json", options)
                    .then(originalFn)
                    .then((response) =>
                        enqueueTask(PluginTask.INCOMING_RESPONSE, "response.json", response)
                    );
                });
            `),
            env: {
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 314",
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
            service: "server",
            testIssueKey: "CYPLUG-117",
            title: "cy.request gets overwritten using manual task calls (server)",
        },
    ] as const) {
        it(test.title, () => {
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
                    fs.readFileSync(path.join(entry.parentPath, entry.name), "utf8")
                ) as LoggedRequest;
                expect(fileContent.body).to.contain(
                    '"evidence":[{"contentType":"application/json","data":"ImxvY2FsaG9zdDo4MDgwIg=="'
                );
                return;
            }
            expect.fail(
                `Expected to find a logged import execution request in log directory ${ansiColors.red(
                    project.logDirectory
                )}, but did not find any`
            );
        });
    }
});
