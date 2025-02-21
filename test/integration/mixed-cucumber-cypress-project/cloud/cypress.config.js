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
                    testExecutionIssue: {
                        fields: {
                            summary: "Integration test mixed cucumber cypress project",
                        },
                    },
                },
                xray: {
                    uploadResults: true,
                    testEnvironments: ["DEV"],
                    status: {
                        passed: "PASSED",
                    },
                },
                cucumber: {
                    featureFileExtension: ".feature",
                    uploadFeatures: false,
                    prefixes: {
                        test: "TestName:",
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
