import { expect } from "chai";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import process from "process";
import { LoggedRequest } from "../../src/client/https/requests";
import { XrayTestExecutionResults } from "../../src/types/xray/import-test-execution-results";
import { dedent } from "../../src/util/dedent";
import { IntegrationTest, runCypress, setupCypressProject } from "../sh";
import { TIMEOUT_INTEGRATION_TESTS, expectToExist } from "../util";
import { LOCAL_SERVER } from "./server";

describe(path.relative(process.cwd(), __filename), () => {
    for (const test of [
        {
            title: "cy.request gets overwritten in cloud environments",
            service: "cloud",
            testIssueKey: "CYP-666",
            env: {
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
        },
        {
            title: "cy.request gets overwritten in server environments",
            service: "server",
            testIssueKey: "CYPLUG-107",
            env: {
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
        },
        {
            title: "cy.request gets overwritten in cloud environments using manual task calls",
            service: "cloud",
            testIssueKey: "CYP-692",
            env: {
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
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
        },
        {
            title: "cy.request gets overwritten in server environments using manual task calls",
            service: "server",
            testIssueKey: "CYPLUG-117",
            env: {
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
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
        },
    ] as IntegrationTest[]) {
        it(test.title, () => {
            const project = setupCypressProject({
                commandFileContent: test.commandFileContent,
                testFiles: [
                    {
                        fileName: "cy.request.cy.js",
                        content: dedent(`
                            describe("request", () => {
                                it("${test.testIssueKey} does something", () => {
                                    cy.request("${LOCAL_SERVER.url}");
                                });
                            });
                        `),
                    },
                ],
            });
            runCypress(project.projectDirectory, { includeEnv: test.service, env: test.env });
            for (const entry of fs.readdirSync(project.logDirectory, {
                withFileTypes: true,
            })) {
                // 12345_POST_https_xray.cloud.getxray.app_api_v2_import_execution_request.json
                if (!entry.name.match(/.+_POST_.+_import_execution_request.json/)) {
                    continue;
                }
                const fileContent = JSON.parse(
                    fs.readFileSync(path.join(entry.path, entry.name), "utf8")
                ) as LoggedRequest;
                expectToExist(fileContent.body);
                const content = fileContent.body as XrayTestExecutionResults;
                expectToExist(content.tests);
                expectToExist(content.tests[0].evidence);
                return;
            }
            expect.fail(
                `Expected to find a logged import execution request in log directory ${chalk.red(
                    project.logDirectory
                )}, but did not find any`
            );
        }).timeout(TIMEOUT_INTEGRATION_TESTS);
    }
});
