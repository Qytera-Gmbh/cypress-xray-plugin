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
                    projectKey: "CXP",
                    testExecutionIssue: {
                        fields: {
                            summary: "Integration test upload last attempt",
                        },
                    },
                    url: "https://example.org",
                },
                plugin: {
                    uploadLastAttempt: true,
                },
            });
            return config;
        },
        specPattern: "**/*.cy.js",
    },
});
