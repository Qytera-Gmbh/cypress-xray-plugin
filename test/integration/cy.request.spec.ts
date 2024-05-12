import { expect } from "chai";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import process from "process";
import { LoggedRequest } from "../../src/https/requests";
import { XrayTestExecutionResults } from "../../src/types/xray/importTestExecutionResults";
import { dedent } from "../../src/util/dedent";
import { IntegrationTest, runCypress, setupCypressProject } from "../sh";
import { TIMEOUT_INTEGRATION_TESTS, expectToExist } from "../util";

describe(path.relative(process.cwd(), __filename), () => {
    for (const env of [
        {
            service: "cloud",
            testIssueKey: "CYP-666",
            env: {
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
        },
        {
            service: "server",
            testIssueKey: "CYPLUG-107",
            env: {
                ["CYPRESS_XRAY_UPLOAD_REQUESTS"]: "true",
            },
        },
    ] as IntegrationTest[]) {
        it(`cy.request gets overwritten in ${env.service} environments`, () => {
            const project = setupCypressProject({
                testFiles: [
                    {
                        fileName: "cy.request.cy.js",
                        content: dedent(`
                            describe("request", () => {
                                it("${env.testIssueKey} does something", () => {
                                    cy.request("https://example.org");
                                });
                            });
                        `),
                    },
                ],
            });
            runCypress(project.projectDirectory, { includeEnv: env.service, env: env.env });
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