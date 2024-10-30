import { expect } from "chai";
import path from "path";
import process from "process";
import { dedent } from "../../src/util/dedent";
import { LOCAL_SERVER } from "../server-config";
import { runCypress, setupCypressProject } from "../sh";
import { expectToExist } from "../util";
import { getIntegrationClient } from "./clients";
import { getCreatedTestExecutionIssueKey } from "./util";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/328
// ============================================================================================== //

describe(path.relative(process.cwd(), __filename), () => {
    for (const test of [
        {
            cucumberTestPrefix: "TestName:",
            cucumberTests: ["CYP-969", "CYP-970"],
            manualTests: ["CYP-967", "CYP-968"],
            projectKey: "CYP",
            service: "cloud",
            title: "results upload works for tests with multiple issue keys (cloud)",
            xrayPassedStatus: "PASSED",
        },
        {
            cucumberTestPrefix: "TEST_",
            cucumberTests: ["CYPLUG-342", "CYPLUG-343"],
            manualTests: ["CYPLUG-340", "CYPLUG-341"],
            projectKey: "CYPLUG",
            service: "server",
            title: "results upload works for tests with multiple issue keys (server)",
            xrayPassedStatus: "EXECUTING", // Must be a non-final status (I don't have permission)
        },
    ] as const) {
        it(test.title, async () => {
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

                                Given("a step", () => {
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
                            describe("${test.manualTests.join(" ")} template spec", () => {
                                it("passes", () => {
                                    cy.visit("${LOCAL_SERVER.url}");
                                });
                            });
                        `),
                        fileName: "spec.cy.js",
                    },
                    {
                        content: dedent(`
                            Feature: Testing a single scenario

                                ${test.cucumberTests
                                    .map((key) => `@${test.cucumberTestPrefix}${key}`)
                                    .join(" ")}
                                Scenario: Single scenario test
                                    Given a step
                        `),
                        fileName: "cucumber.feature",
                    },
                ],
            });

            const output = runCypress(project.projectDirectory, {
                env: {
                    ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 328",
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
                    test.manualTests[0],
                    test.manualTests[1],
                    test.cucumberTests[0],
                    test.cucumberTests[1],
                ]);
            }

            if (test.service === "server") {
                const testResults = await getIntegrationClient(
                    "xray",
                    test.service
                ).getTestExecution(testExecutionIssueKey);
                expect(testResults.map((result) => result.key)).to.deep.eq([
                    test.manualTests[0],
                    test.manualTests[1],
                    test.cucumberTests[0],
                    test.cucumberTests[1],
                ]);
            }
        });
    }
});
