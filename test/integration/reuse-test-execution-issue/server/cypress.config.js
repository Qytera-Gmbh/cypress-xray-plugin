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
                            summary: "DO NOT DELETE Integration test reused test execution issue",
                        },
                        key: "CYPLUG-3102",
                    },
                    url: "https://example.org",
                },
                xray: {
                    status: {
                        // Workaround because of configured status automations for which I don't have permission.
                        passed: "EXECUTING",
                    },
                },
            });
            return config;
        },
        specPattern: "**/*.cy.js",
    },
});
