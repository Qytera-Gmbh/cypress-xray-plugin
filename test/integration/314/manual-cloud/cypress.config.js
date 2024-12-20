const { defineConfig } = require("cypress");
const { configureXrayPlugin } = require("cypress-xray-plugin");

async function setupNodeEvents(on, config) {
    await configureXrayPlugin(on, config, {
        jira: {
            url: "https://example.org",
            projectKey: "CYP",
            testExecutionIssue: {
                fields: {
                    summary: "Integration test 314",
                    description: new Date().toLocaleString(),
                },
            },
        },
        plugin: {
            debug: true,
        },
        xray: {
            uploadRequests: true,
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
