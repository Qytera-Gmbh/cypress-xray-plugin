/// <reference types="cypress" />

import { expect } from "chai";
import { CONTEXT, initContext } from "../../src/context";

describe("the context configuration", () => {
    describe("should have certain default values", () => {
        before(() => {
            initContext({
                jira: {
                    projectKey: "PRJ",
                },
            });
        });

        describe("jira", () => {
            it("attachVideos", () => {
                expect(CONTEXT.config.jira.attachVideos).to.eq(false);
            });
            it("attachCreateTestIssues", () => {
                expect(CONTEXT.config.jira.createTestIssues).to.eq(true);
            });
            it("testExecutionIssueDescription", () => {
                expect(CONTEXT.config.jira.testExecutionIssueDescription).to.eq(undefined);
            });
            it("testExecutionIssueKey", () => {
                expect(CONTEXT.config.jira.testExecutionIssueKey).to.eq(undefined);
            });
            it("testExecutionIssueSummary", () => {
                expect(CONTEXT.config.jira.testExecutionIssueSummary).to.eq(undefined);
            });
            it("testPlanIssueKey", () => {
                expect(CONTEXT.config.jira.testPlanIssueKey).to.eq(undefined);
            });
            it("url", () => {
                expect(CONTEXT.config.jira.url).to.eq(undefined);
            });
        });

        describe("plugin", () => {
            it("overwriteIssueSummary", () => {
                expect(CONTEXT.config.plugin.overwriteIssueSummary).to.eq(false);
            });
            it("normalizeScreenshotNames", () => {
                expect(CONTEXT.config.plugin.normalizeScreenshotNames).to.eq(false);
            });
            it("debug", () => {
                expect(CONTEXT.config.plugin.debug).to.eq(false);
            });
        });

        describe("xray", () => {
            it("statusFailed", () => {
                expect(CONTEXT.config.xray.statusFailed).to.eq(undefined);
            });
            it("statusPassed", () => {
                expect(CONTEXT.config.xray.statusPassed).to.eq(undefined);
            });
            it("statusPending", () => {
                expect(CONTEXT.config.xray.statusPending).to.eq(undefined);
            });
            it("statusSkipped", () => {
                expect(CONTEXT.config.xray.statusSkipped).to.eq(undefined);
            });
            describe("steps", () => {
                it("maxLengthAction", () => {
                    expect(CONTEXT.config.xray.steps.maxLengthAction).to.eq(8000);
                });
                it("update", () => {
                    expect(CONTEXT.config.xray.steps.update).to.eq(true);
                });
            });
            it("testType", () => {
                expect(CONTEXT.config.xray.testType).to.eq("Manual");
            });
            it("uploadResults", () => {
                expect(CONTEXT.config.xray.uploadResults).to.eq(true);
            });
            it("uploadScreenshots", () => {
                expect(CONTEXT.config.xray.uploadScreenshots).to.eq(true);
            });
        });

        describe("cucumber", () => {
            it("downloadFeatures", () => {
                expect(CONTEXT.config.cucumber.downloadFeatures).to.eq(false);
            });
            it("uploadFeatures", () => {
                expect(CONTEXT.config.cucumber.uploadFeatures).to.eq(false);
            });
        });

        describe("openSSL", () => {
            it("openSSL", () => {
                expect(CONTEXT.config.openSSL.rootCAPath).to.eq(undefined);
            });
            it("uploadFeatures", () => {
                expect(CONTEXT.config.openSSL.secureOptions).to.eq(undefined);
            });
        });
    });
    describe("should prefer provided values over default ones", () => {
        describe("jira", () => {
            it("attachVideos", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                        attachVideos: true,
                    },
                });
                expect(CONTEXT.config.jira.attachVideos).to.eq(true);
            });
            it("createTestIssues", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                        createTestIssues: false,
                    },
                });
                expect(CONTEXT.config.jira.createTestIssues).to.eq(false);
            });
            it("testExecutionIssueDescription", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                        testExecutionIssueDescription: "hello",
                    },
                });
                expect(CONTEXT.config.jira.testExecutionIssueDescription).to.eq("hello");
            });
            it("testExecutionIssueKey", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                        testExecutionIssueKey: "PRJ-123",
                    },
                });
                expect(CONTEXT.config.jira.testExecutionIssueKey).to.eq("PRJ-123");
            });
            it("testExecutionIssueSummary", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                        testExecutionIssueSummary: "Test - Login",
                    },
                });
                expect(CONTEXT.config.jira.testExecutionIssueSummary).to.eq("Test - Login");
            });
            it("testPlanIssueKey", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                        testPlanIssueKey: "PRJ-456",
                    },
                });
                expect(CONTEXT.config.jira.testPlanIssueKey).to.eq("PRJ-456");
            });
            it("url", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                        url: "https://example.org",
                    },
                });
                expect(CONTEXT.config.jira.url).to.eq("https://example.org");
            });
        });

        describe("plugin", () => {
            it("overwriteIssueSummary", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                    },
                    plugin: {
                        overwriteIssueSummary: true,
                    },
                });
                expect(CONTEXT.config.plugin.overwriteIssueSummary).to.eq(true);
            });
            it("normalizeScreenshotNames", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                    },
                    plugin: {
                        normalizeScreenshotNames: true,
                    },
                });
                expect(CONTEXT.config.plugin.normalizeScreenshotNames).to.eq(true);
            });
            it("debug", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                    },
                    plugin: {
                        debug: true,
                    },
                });
                expect(CONTEXT.config.plugin.debug).to.eq(true);
            });
        });

        describe("xray", () => {
            it("statusFailed", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                    },
                    xray: {
                        statusFailed: "BAD",
                    },
                });
                expect(CONTEXT.config.xray.statusFailed).to.eq("BAD");
            });
            it("statusPassed", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                    },
                    xray: {
                        statusPassed: "GOOD",
                    },
                });
                expect(CONTEXT.config.xray.statusPassed).to.eq("GOOD");
            });
            it("statusPending", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                    },
                    xray: {
                        statusPending: "PENDULUM",
                    },
                });
                expect(CONTEXT.config.xray.statusPending).to.eq("PENDULUM");
            });
            it("statusSkipped", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                    },
                    xray: {
                        statusSkipped: "SKIPPING STONE",
                    },
                });
                expect(CONTEXT.config.xray.statusSkipped).to.eq("SKIPPING STONE");
            });

            describe("steps", () => {
                it("maxLengthAction", () => {
                    initContext({
                        jira: {
                            projectKey: "PRJ",
                        },
                        xray: {
                            steps: {
                                maxLengthAction: 42,
                            },
                        },
                    });
                    expect(CONTEXT.config.xray.steps.maxLengthAction).to.eq(42);
                });
                it("update", () => {
                    initContext({
                        jira: {
                            projectKey: "PRJ",
                        },
                        xray: {
                            steps: {
                                update: false,
                            },
                        },
                    });
                    expect(CONTEXT.config.xray.steps.update).to.eq(false);
                });
            });
            it("testType", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                    },
                    xray: {
                        testType: "Cucumber",
                    },
                });
                expect(CONTEXT.config.xray.testType).to.eq("Cucumber");
            });
            it("uploadResults", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                    },
                    xray: {
                        uploadResults: false,
                    },
                });
                expect(CONTEXT.config.xray.uploadResults).to.eq(false);
            });
            it("uploadScreenshots", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                    },
                    xray: {
                        uploadScreenshots: false,
                    },
                });
                expect(CONTEXT.config.xray.uploadScreenshots).to.eq(false);
            });
        });

        describe("cucumber", () => {
            it("downloadFeatures", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                    },
                    cucumber: {
                        featureFileExtension: ".feature",
                        downloadFeatures: true,
                    },
                });
                expect(CONTEXT.config.cucumber.downloadFeatures).to.eq(true);
            });
            it("uploadFeatures", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                    },
                    cucumber: {
                        featureFileExtension: ".feature",
                        uploadFeatures: true,
                    },
                });
                expect(CONTEXT.config.cucumber.uploadFeatures).to.eq(true);
            });
        });

        describe("openSSL", () => {
            it("rootCAPath", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                    },
                    openSSL: {
                        rootCAPath: "/path/to/cert.pem",
                    },
                });
                expect(CONTEXT.config.openSSL.rootCAPath).to.eq("/path/to/cert.pem");
            });
            it("secureOptions", () => {
                initContext({
                    jira: {
                        projectKey: "PRJ",
                    },
                    openSSL: {
                        secureOptions: 42,
                    },
                });
                expect(CONTEXT.config.openSSL.secureOptions).to.eq(42);
            });
        });
    });
});
