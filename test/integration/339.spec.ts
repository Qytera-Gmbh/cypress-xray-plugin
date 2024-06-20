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
            env: {
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 339",
                ["CYPRESS_PLUGIN_ENABLED"]: "false",
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
            service: "cloud",
            testIssueKey: "CYP-741",
            title: "the cy.request task does not do anything if disabled in cloud environments",
        },
        {
            env: {
                ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 339",
                ["CYPRESS_PLUGIN_ENABLED"]: "false",
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
            service: "server",
            testIssueKey: "CYPLUG-154",
            title: "the cy.request task does not do anything if disabled in server environments",
        },
    ] as IntegrationTest[]) {
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
            expect(fs.existsSync(project.logDirectory)).to.be.false;
        });
    }
});
