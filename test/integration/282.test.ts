import { expect } from "chai";
import path from "path";
import process from "process";
import { dedent } from "../../src/util/dedent.js";
import { LOCAL_SERVER } from "../server-config.js";
import { runCypress, setupCypressProject } from "../sh.js";
import { expectToExist } from "../util.js";
import { getIntegrationClient } from "./clients.js";
import { getCreatedTestExecutionIssueKey } from "./util.js";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/282
// ============================================================================================== //

await describe(path.relative(process.cwd(), import.meta.filename), () => {
    for (const test of [
        {
            cucumberTestPrefix: "TestName:",
            projectKey: "CYP",
            scenarioIssueKey: "CYP-756",
            service: "cloud",
            testIssueKey: "CYP-757",
            title: "results upload works for mixed cypress and cucumber projects (cloud)",
            xrayPassedStatus: "PASSED",
        },
        {
            cucumberTestPrefix: "TEST_",
            projectKey: "CYPLUG",
            scenarioIssueKey: "CYPLUG-165",
            service: "server",
            testIssueKey: "CYPLUG-166",
            title: "results upload works for mixed cypress and cucumber projects (server)",
            xrayPassedStatus: "EXECUTING", // Must be a non-final status (I don't have permission)
        },
    ] as const) {
        await it(test.title, async () => {
            const project = setupCypressProject({
                configFileContent: dedent(`
                    const preprocessor = require("@badeball/cypress-cucumber-preprocessor");
                    const createEsbuildPlugin = require("@badeball/cypress-cucumber-preprocessor/esbuild");
                    const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
                    const { defineConfig } = require("cypress");
                    const fix = require("cypress-on-fix");
                    const { configureXrayPlugin, syncFeatureFile } = require("cypress-xray-plugin");

                    module.exports = defineConfig({
                        video: false,
                        chromeWebSecurity: false,
                        e2e: {
                            supportFile: false,
                            experimentalStudio: true,
                            specPattern: "**/*.{feature,cy.js}",
                            async setupNodeEvents(on, config) {
                                const fixedOn = fix(on);
                                await preprocessor.addCucumberPreprocessorPlugin(fixedOn, config);
                                await configureXrayPlugin(fixedOn, config, {
                                    jira: {
                                        projectKey: "CYP",
                                    },
                                    xray: {
                                        uploadResults: true,
                                        testEnvironments: ["DEV"],
                                        status: {
                                            passed: "${test.xrayPassedStatus}"
                                        }
                                    },
                                    cucumber: {
                                        featureFileExtension: ".feature",
                                        uploadFeatures: false,
                                        prefixes: {
                                            test: "${test.cucumberTestPrefix}"
                                        }
                                    },
                                    plugin: {
                                        debug: false,
                                    },
                                });
                                fixedOn("file:preprocessor", (file) => {
                                    syncFeatureFile(file);
                                    const cucumberPlugin = createBundler({
                                        plugins: [createEsbuildPlugin.createEsbuildPlugin(config)],
                                    });
                                    return cucumberPlugin(file);
                                });

                                return config;
                            },
                        },
                    });
                `),
                cucumber: {
                    configFileContent: dedent(`
                        {
                            "json": {
                                "enabled": true
                            }
                        }
                    `),
                    stepDefinitions: [
                        {
                            content: dedent(`
                                import { Given } from "@badeball/cypress-cucumber-preprocessor";

                                Given("Something", () => {
                                    expect(true).to.be.true;
                                });
                            `),
                            filename: "steps.js",
                        },
                    ],
                },
                testFiles: [
                    {
                        content: dedent(`
                            await describe("${test.testIssueKey} template spec", () => {
                                await it("passes", () => {
                                    cy.visawait it("${LOCAL_SERVER.url}");
                                });
                            });
                        `),
                        fileName: "spec.cy.js",
                    },
                    {
                        content: dedent(`
                            Feature: Testing a single scenario

                                @${test.cucumberTestPrefix}${test.scenarioIssueKey}
                                Scenario: Single scenario test
                                    Given Something
                        `),
                        fileName: "cucumber.feature",
                    },
                ],
            });

            const output = runCypress(project.projectDirectory, {
                env: {
                    ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 282",
                },
                includeDefaultEnv: test.service,
            });

            const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                test.projectKey,
                output,
                "both"
            );

            if (test.service === "cloud") {
                const searchResult = await getIntegrationClient("jira", test.service).search({
                    fields: ["id"],
                    jql: `issue in (${testExecutionIssueKey})`,
                });
                expectToExist(searchResult[0].id);
                const testResults = await getIntegrationClient("xray", test.service).getTestResults(
                    searchResult[0].id
                );
                expect(testResults.map((result) => result.jira.key)).to.deep.eq([
                    test.testIssueKey,
                    test.scenarioIssueKey,
                ]);
            }

            if (test.service === "server") {
                const testResults = await getIntegrationClient(
                    "xray",
                    test.service
                ).getTestExecution(testExecutionIssueKey);
                expect(testResults.map((result) => result.key)).to.deep.eq([
                    test.testIssueKey,
                    test.scenarioIssueKey,
                ]);
            }
        });
    }
});
