const { defineConfig } = require("cypress");
const fix = require("cypress-on-fix");
const { configureXrayPlugin } = require("cypress-xray-plugin");

const LABELS = [];

module.exports = defineConfig({
    video: false,
    chromeWebSecurity: false,
    e2e: {
        specPattern: "**/*.cy.js",
        async setupNodeEvents(on, config) {
            const fixedOn = fix(on);
            await configureXrayPlugin(fixedOn, config, {
                jira: {
                    projectKey: "CXP",
                    testExecutionIssue: () => {
                        return {
                            fields: {
                                summary:
                                    "Integration test dynamic test execution issue data (wrapped)",
                                labels: LABELS,
                            },
                        };
                    },
                },
                xray: {
                    uploadResults: true,
                    testEnvironments: ["DEV"],
                    status: {
                        passed: "PASS",
                    },
                },
                plugin: {
                    debug: false,
                },
            });
            fixedOn("task", {
                "update-labels": (values) => LABELS.push(...values),
            });
            return config;
        },
    },
});
