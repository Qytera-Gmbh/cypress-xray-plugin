import { expect } from "chai";
import path from "path";
import process from "process";
import { dedent } from "../../src/util/dedent";
import { runCypress, setupCypressProject } from "../sh";
import { expectToExist } from "../util";
import { getIntegrationClient } from "./clients";
import { getCreatedTestExecutionIssueKey } from "./util";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/341
// ============================================================================================== //

describe(path.relative(process.cwd(), __filename), () => {
    for (const test of [
        {
            cucumberTestPrefix: "TestName:",
            projectKey: "CYP",
            service: "cloud",
            testKeys: {
                included: "CYP-798",
                skipped: "CYP-797",
            },
            title: "results upload works for skipped cucumber tests (cloud)",
            xrayPassedStatus: "PASSED",
            xraySkippedStatus: "SKIPPED",
        },
        {
            cucumberTestPrefix: "TEST_",
            projectKey: "CYPLUG",
            service: "server",
            testKeys: {
                included: "CYPLUG-208",
                skipped: "CYPLUG-209",
            },
            title: "results upload works for skipped cucumber tests (server)",
            xrayPassedStatus: "PASS",
            xraySkippedStatus: "ABORTED",
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
                    const fs = require("node:fs");

                    module.exports = defineConfig({
                        video: false,
                        chromeWebSecurity: false,
                        e2e: {
                            supportFile: false,
                            experimentalStudio: true,
                            specPattern: "**/*.{feature,cy.js}",
                            async setupNodeEvents(on, config) {
                                const fixedOn = fix(on);
                                fixedOn("after:run", (results) => {
                                    fs.writeFileSync("results.json", JSON.stringify(results, null, 2));
                                });
                                await preprocessor.addCucumberPreprocessorPlugin(fixedOn, config);
                                await configureXrayPlugin(fixedOn, config, {
                                    jira: {
                                        projectKey: "${test.projectKey}",
                                    },
                                    xray: {
                                        uploadResults: true,
                                        status: {
                                            step: {
                                                passed: "${test.xrayPassedStatus}",
                                                skipped: "${test.xraySkippedStatus}"
                                            }
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
                            Feature: Testing a single scenario

                                @skip
                                @${test.cucumberTestPrefix}${test.testKeys.skipped}
                                Scenario: skipped cucumber test
                                    Given a step
                                    Given a step
                                    Given a step
                        `),
                        fileName: "cucumber-skipped.feature",
                    },
                    {
                        content: dedent(`
                            Feature: Testing a single scenario

                            @${test.cucumberTestPrefix}${test.testKeys.included}
                                Scenario: included cucumber test
                                    Given a step
                        `),
                        fileName: "cucumber-included.feature",
                    },
                ],
            });
            const output = runCypress(project.projectDirectory, {
                env: {
                    ["CYPRESS_JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Integration test 341",
                },
                includeDefaultEnv: test.service,
            });

            const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                test.projectKey,
                output,
                "cucumber"
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
                const includedTest = testResults.find(
                    (r) => r.jira.summary === "included cucumber test"
                );
                expectToExist(includedTest);
                expect(includedTest.status?.name).to.eq(test.xrayPassedStatus);
                const skippedTest = testResults.find(
                    (r) => r.jira.summary === "skipped cucumber test"
                );
                expectToExist(skippedTest);
                expect(skippedTest.status?.name).to.eq(test.xraySkippedStatus);
            }

            if (test.service === "server") {
                const testResults = await getIntegrationClient(
                    "xray",
                    test.service
                ).getTestExecution(testExecutionIssueKey);
                const includedTest = testResults.find((r) => r.key === test.testKeys.included);
                expectToExist(includedTest);
                expect(includedTest.status).to.eq(test.xrayPassedStatus);
                const skippedTest = testResults.find((r) => r.key === test.testKeys.skipped);
                expectToExist(skippedTest);
                expect(skippedTest.status).to.eq(test.xraySkippedStatus);
            }
        });
    }
});
