import { expect } from "chai";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import process from "process";
import { LoggedRequest } from "../../src/client/https/https";
import { dedent } from "../../src/util/dedent";
import { runCypress, setupCypressProject } from "../sh";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/pull/394
// ============================================================================================== //

describe.only(path.relative(process.cwd(), __filename), () => {
    for (const test of [
        {
            env: {
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 394",
            },
            service: "cloud",
            testIssueKey: "CYP-1446",
            title: "add arbitrary evidence",
        },
        {
            env: {
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 394",
            },
            service: "server",
            testIssueKey: "CYPLUG-709",
            title: "add arbitrary evidence",
        },
    ] as const) {
        it(test.title, () => {
            const project = setupCypressProject({
                testFiles: [
                    {
                        content: dedent(`
                            const { enqueueTask } = require("cypress-xray-plugin/tasks");

                            describe("evidence", () => {
                                it("${test.testIssueKey} adds evidence", () => {
                                    enqueueTask("cypress-xray-plugin:add-evidence", {
                                        filename: "queued.json",
                                        data: Cypress.Buffer.from(JSON.stringify({ name: "Bob" })),
                                        contentType: "application/json"
                                    });
                                    cy.task("cypress-xray-plugin:add-evidence", {
                                        evidence: {
                                            filename: "raw.json",
                                            data: Cypress.Buffer.from(JSON.stringify({ name: "Jeff" })),
                                            contentType: "application/json"
                                        },
                                        test: "${test.testIssueKey}"
                                    });
                                });
                            });
                        `),
                        fileName: "evidence.cy.js",
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
                    '"evidence":[{"contentType":"application/json","data":"eyJuYW1lIjoiQm9iIn0=","filename":"queued.json"},{"contentType":"application/json","data":"eyJuYW1lIjoiSmVmZiJ9","filename":"raw.json"}]'
                );
                return;
            }
            expect.fail(
                `Expected to find a logged import execution request in log directory ${chalk.red(
                    project.logDirectory
                )}, but did not find any`
            );
        });
    }
});
