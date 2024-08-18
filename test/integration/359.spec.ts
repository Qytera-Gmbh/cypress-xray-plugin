import { expect } from "chai";
import path from "path";
import process from "process";
import { dedent } from "../../src/util/dedent";
import { LOCAL_SERVER } from "../server-config";
import { runCypress, setupCypressProject } from "../sh";
import { getIntegrationClient } from "./clients";
import { getCreatedTestExecutionIssueKey } from "./util";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/359
// ============================================================================================== //

describe.only(path.relative(process.cwd(), __filename), () => {
    for (const test of [
        {
            expectedLabels: [],
            expectedSummary: "Integration test 359 (hardcoded)",
            manualTest: "CYP-1139",
            projectKey: "CYP",
            service: "cloud",
            testExecutionIssueData: dedent(`
                {
                    fields: {
                        summary: "Integration test 359 (hardcoded)",
                        labels: LABELS
                    }
                }
            `),
            title: "test execution issue data is hardcoded (cloud)",
            xrayPassedStatus: "PASSED",
        },
        {
            expectedLabels: ["x", "y"],
            manualTest: "CYP-1139",
            projectKey: "CYP",
            service: "cloud",
            summary: "Integration test 359 (wrapped)",
            testExecutionIssueData: dedent(`
                () => {
                    return {
                        fields: {
                            summary: "Integration test 359 (wrapped)",
                            labels: LABELS
                        }
                    };
                }
            `),
            title: "test execution issue data is wrapped (cloud)",
            xrayPassedStatus: "PASSED",
        },
        {
            expectedLabels: [],
            manualTest: "CYPLUG-461",
            projectKey: "CYPLUG",
            service: "server",
            summary: "Integration test 359 (hardcoded)",
            testExecutionIssueData: dedent(`
                {
                    fields: {
                        summary: "Integration test 359 (hardcoded)",
                        labels: LABELS
                    }
                }
            `),
            title: "test execution issue data is hardcoded (server)",
            xrayPassedStatus: "PASS",
        },
        {
            expectedLabels: ["x", "y"],
            manualTest: "CYPLUG-461",
            projectKey: "CYPLUG",
            service: "server",
            summary: "Integration test 359 (wrapped)",
            testExecutionIssueData: dedent(`
                () => {
                    return {
                        fields: {
                            summary: "Integration test 359 (wrapped)",
                            labels: LABELS
                        }
                    };
                }
            `),
            title: "test execution issue data is wrapped (server)",
            xrayPassedStatus: "PASS",
        },
    ] as const) {
        it(test.title, async () => {
            const project = setupCypressProject({
                configFileContent: dedent(`
                    const { defineConfig } = require("cypress");
                    const fix = require("cypress-on-fix");
                    const { configureXrayPlugin } = require("cypress-xray-plugin");

                    const LABELS = [];

                    module.exports = defineConfig({
                        video: false,
                        chromeWebSecurity: false,
                        e2e: {
                            specPattern: "**/*.cy.js",
                            async setupNodeEvents(on, config) {
                                const fixedOn = fix(on);
                                await configureXrayPlugin(fixedOn, config, {
                                    jira: {
                                        projectKey: "CYP",
                                        testExecutionIssue: ${test.testExecutionIssueData}
                                    },
                                    xray: {
                                        uploadResults: true,
                                        testEnvironments: ["DEV"],
                                        status: {
                                            passed: "${test.xrayPassedStatus}"
                                        }
                                    },
                                    plugin: {
                                        debug: false,
                                    },
                                });
                                fixedOn("task", {
                                    "update-labels": (values) => LABELS.push(...values)
                                });
                                return config;
                            },
                        },
                    });
                `),
                testFiles: [
                    {
                        content: dedent(`
                            describe("${test.manualTest} template spec", () => {
                                it("passes", () => {
                                    cy.visit("${LOCAL_SERVER.url}");
                                    cy.task("update-labels", ${JSON.stringify(test.expectedLabels)})
                                });
                            });
                        `),
                        fileName: "spec.cy.js",
                    },
                ],
            });

            const output = runCypress(project.projectDirectory, {
                includeDefaultEnv: test.service,
            });

            const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                test.projectKey,
                output,
                "cypress"
            );

            const searchResult = await getIntegrationClient("jira", test.service).search({
                fields: ["labels", "summary"],
                jql: `issue in (${testExecutionIssueKey})`,
            });
            expect(searchResult[0].fields?.labels).to.deep.eq(test.expectedLabels);
            expect(searchResult[0].fields?.summary).to.deep.eq(test.expectedSummary);
        });
    }
});
