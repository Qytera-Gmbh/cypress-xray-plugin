import { expect } from "chai";
import path from "path";
import process from "process";
import { dedent } from "../../src/util/dedent";
import { IntegrationTest, runCypress, setupCypressProject } from "../sh";
import { LOCAL_SERVER } from "./server";

describe(path.relative(process.cwd(), __filename), () => {
    for (const test of [
        {
            title: "results upload works for mixed cypress and cucumber projects (cloud)",
            service: "cloud",
            testIssueKey: "CYP-757",
            scenarioLabel: "TestName:CYP-756",
            cucumberTestPrefix: "TestName:",
            xrayPassedStatus: "PASSED",
        },
        {
            title: "results upload works for mixed cypress and cucumber projects (server)",
            service: "server",
            testIssueKey: "CYPLUG-166",
            scenarioLabel: "TEST_CYPLUG-165",
            cucumberTestPrefix: "TEST_",
            xrayPassedStatus: "EXECUTING", // Must be a non-final status
        },
    ]) {
        it(test.title, () => {
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
                testFiles: [
                    {
                        fileName: "spec.cy.js",
                        content: dedent(`
                            describe("${test.testIssueKey} template spec", () => {
                                it("passes", () => {
                                    cy.visit("${LOCAL_SERVER.url}");
                                });
                            });
                        `),
                    },
                    {
                        fileName: "cucumber.feature",
                        content: dedent(`
                            Feature: Testing a single scenario

                                @${test.scenarioLabel}
                                Scenario: Single scenario test
                                    Given Something
                        `),
                    },
                ],
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
                            filename: "steps.js",
                            content: dedent(`
                                import { Given } from "@badeball/cypress-cucumber-preprocessor";

                                Given("Something", () => {
                                    expect(true).to.be.true;
                                });
                            `),
                        },
                    ],
                },
            });
            const output = runCypress(project.projectDirectory, {
                includeDefaultEnv: test.service as IntegrationTest["service"],
                env: {
                    ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 282",
                },
            });
            expect(output).to.include("Uploaded test results to issue");
            expect(output).not.to.include("WARNING");
        });
    }
});
