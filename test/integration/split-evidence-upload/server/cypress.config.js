const { defineConfig } = require("cypress");
const fix = require("cypress-on-fix");
const { configureXrayPlugin } = require("cypress-xray-plugin");

module.exports = defineConfig({
    chromeWebSecurity: false,
    e2e: {
        async setupNodeEvents(on, config) {
            const fixedOn = fix(on);
            await configureXrayPlugin(fixedOn, config, {
                jira: {
                    projectKey: "CYPLUG",
                    testExecutionIssue: {
                        fields: {
                            summary: "Integration test split evidence upload",
                        },
                    },
                    url: "https://example.org",
                },
                plugin: {
                    splitUpload: true,
                },
            });
            return config;
        },
        specPattern: "**/*.cy.js",
    },
});
