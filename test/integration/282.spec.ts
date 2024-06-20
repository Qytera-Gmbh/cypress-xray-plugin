import { expect } from "chai";
import path from "path";
import process from "process";
import { dedent } from "../../src/util/dedent";
import { IntegrationTest, runCypress, setupCypressProject } from "../sh";
import { LOCAL_SERVER } from "./server";

describe(path.relative(process.cwd(), __filename), () => {
    for (const test of [
        {
            cucumberTestPrefix: "TestName:",
            scenarioLabel: "TestName:CYP-756",
            service: "cloud",
            testIssueKey: "CYP-757",
            title: "results upload works for mixed cypress and cucumber projects (cloud)",
            xrayPassedStatus: "PASSED",
        },
        {
            cucumberTestPrefix: "TEST_",
            scenarioLabel: "TEST_CYPLUG-165",
            service: "server",
            testIssueKey: "CYPLUG-166",
            title: "results upload works for mixed cypress and cucumber projects (server)",
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
                            describe("${test.testIssueKey} template spec", () => {
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

                                @${test.scenarioLabel}
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
                includeDefaultEnv: test.service as IntegrationTest["service"],
            });
            expect(output.join("\n")).to.include("Uploaded test results to issue");
            expect(output.join("\n")).not.to.include("WARNING");
        });
    }
});
