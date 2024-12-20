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
                    projectKey: "CYPLUG",
                    testExecutionIssue: {
                        fields: {
                            summary: "Integration test 341",
                        },
                    },
                },
                xray: {
                    uploadResults: true,
                    status: {
                        step: {
                            passed: "PASS",
                            skipped: "ABORTED",
                        },
                    },
                },
                cucumber: {
                    featureFileExtension: ".feature",
                    uploadFeatures: false,
                    prefixes: {
                        test: "TEST_",
                    },
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
