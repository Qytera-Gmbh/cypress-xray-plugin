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
                            summary: "Integration test 421",
                        },
                    },
                    url: "https://example.org",
                },
                xray: {
                    status: {
                        // Workaround because of configured status automations for which I don't have permission.
                        failed: "EXECUTING",
                        passed: "CUSTOM_PASS2",
                    },
                },
            });
            return config;
        },
        specPattern: "**/*.cy.js",
    },
});
