const { defineConfig } = require("cypress");
const { configureXrayPlugin } = require("cypress-xray-plugin");

async function setupNodeEvents(on, config) {
    await configureXrayPlugin(on, config, {
        jira: {
            url: "https://example.org",
            projectKey: "CYP",
            testExecutionIssueDescription: "20/12/2024, 13:02:32",
            testExecutionIssueSummary: "Integration tests",
        },
        plugin: {
            debug: true,
        },
    });
    return config;
}

module.exports = defineConfig({
    e2e: {
        specPattern: "*.cy.js",
        setupNodeEvents,
    },
});
