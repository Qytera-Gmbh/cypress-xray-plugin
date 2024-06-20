import { expect } from "chai";
import fs from "fs";
import path from "path";
import process from "process";
import { dedent } from "../../src/util/dedent";
import { IntegrationTest, runCypress, setupCypressProject } from "../sh";
import { LOCAL_SERVER } from "./server";

describe(path.relative(process.cwd(), __filename), () => {
    for (const test of [
        {
            title: "the cy.request task does not do anything if disabled in cloud environments",
            service: "cloud",
            testIssueKey: "CYP-741",
            env: {
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
                ["CYPRESS_PLUGIN_ENABLED"]: "false",
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 339",
            },
        },
        {
            title: "the cy.request task does not do anything if disabled in server environments",
            service: "server",
            testIssueKey: "CYPLUG-154",
            env: {
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
                ["CYPRESS_PLUGIN_ENABLED"]: "false",
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 339",
            },
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
            runCypress(project.projectDirectory, {
                includeDefaultEnv: test.service,
                env: test.env,
            });
            expect(fs.existsSync(project.logDirectory)).to.be.false;
        });
    }
});