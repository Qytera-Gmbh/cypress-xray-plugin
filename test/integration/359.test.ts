import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "../../src/util/dedent.js";
import { LOCAL_SERVER } from "../server-config.js";
import { runCypress, setupCypressProject } from "../sh.js";
import { getIntegrationClient } from "./clients.js";
import { getCreatedTestExecutionIssueKey } from "./util.js";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/359
// ============================================================================================== //

await describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, async () => {
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
            expectedSummary: "Integration test 359 (wrapped)",
            manualTest: "CYP-1139",
            projectKey: "CYP",
            service: "cloud",
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
            expectedSummary: "Integration test 359 (hardcoded)",
            manualTest: "CYPLUG-461",
            projectKey: "CYPLUG",
            service: "server",
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
            expectedSummary: "Integration test 359 (wrapped)",
            manualTest: "CYPLUG-461",
            projectKey: "CYPLUG",
            service: "server",
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
        await it(test.title, async () => {
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
                            await describe("${test.manualTest} template spec", () => {
                                await it("passes", () => {
                                    cy.visawait it("${LOCAL_SERVER.url}");
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
            assert.deepStrictEqual(searchResult[0].fields?.labels, test.expectedLabels);
            assert.deepStrictEqual(searchResult[0].fields.summary, test.expectedSummary);
        });
    }
});
