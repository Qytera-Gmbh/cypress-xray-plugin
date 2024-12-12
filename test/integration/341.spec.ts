import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "../../src/util/dedent";
import { runCypress, setupCypressProject } from "../sh";
import { getIntegrationClient } from "./clients";
import { getCreatedTestExecutionIssueKey } from "./util";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/341
// ============================================================================================== //

describe(relative(cwd(), __filename), { timeout: 180000 }, async () => {
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
        await it(test.title, async () => {
            const project = setupCypressProject({
                configFileContent: dedent(`
                    const preprocessor = require("@badeball/cypress-cucumber-preprocessor");
                    const createEsbuildPlugin = require("@badeball/cypress-cucumber-preprocessor/esbuild");
                    const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
                    const { defineConfig } = require("cypress");
                    const fix = require("cypress-on-fix");
                    const { configureXrayPlugin, syncFeatureFile } = require("cypress-xray-plugin");
                    const fs = require("fs");

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
                                    expect(true, true);
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
                assert.ok(searchResult[0].id);
                const testResults = await getIntegrationClient("xray", test.service).getTestResults(
                    searchResult[0].id
                );
                const includedTest = testResults.find(
                    (r) => r.jira.summary === "included cucumber test"
                );
                assert.ok(includedTest);
                assert.strictEqual(includedTest.status?.name, test.xrayPassedStatus);
                const skippedTest = testResults.find(
                    (r) => r.jira.summary === "skipped cucumber test"
                );
                assert.ok(skippedTest);
                assert.strictEqual(skippedTest.status?.name, test.xraySkippedStatus);
            }

            if (test.service === "server") {
                const testResults = await getIntegrationClient(
                    "xray",
                    test.service
                ).getTestExecution(testExecutionIssueKey);
                const includedTest = testResults.find((r) => r.key === test.testKeys.included);
                assert.ok(includedTest);
                assert.strictEqual(includedTest.status, test.xrayPassedStatus);
                const skippedTest = testResults.find((r) => r.key === test.testKeys.skipped);
                assert.ok(skippedTest);
                assert.strictEqual(skippedTest.status, test.xraySkippedStatus);
            }
        });
    }
});
