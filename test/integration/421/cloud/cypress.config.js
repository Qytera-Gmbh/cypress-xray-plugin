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
                    projectKey: "CYP",
                    testExecutionIssue: {
                        fields: {
                            summary: "Integration test 421",
                        },
                    },
                    url: "https://example.org",
                },
                plugin: {
                    debug: false,
                },
                xray: {
                    uploadResults: true,
                },
            });
            return config;
        },
        specPattern: "**/*.cy.js",
    },
    video: false,
});
