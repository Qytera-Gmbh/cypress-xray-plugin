import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { stub } from "sinon";
import { getMockedLogger, getMockedRestClient } from "../test/mocks";
import {
    BasicAuthCredentials,
    JwtCredentials,
    PatCredentials,
} from "./client/authentication/credentials";
import { BaseJiraClient } from "./client/jira/jira-client";
import { XrayClientCloud } from "./client/xray/xray-client-cloud";
import { ServerClient } from "./client/xray/xray-client-server";
import {
    PluginContext,
    SimpleEvidenceCollection,
    initClients,
    initCucumberOptions,
    initHttpClients,
    initJiraOptions,
    initPluginOptions,
    initXrayOptions,
} from "./context";

import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import path from "node:path";
import { AxiosRestClient } from "./client/https/requests";
import { User } from "./types/jira/responses/user";
import {
    InternalCucumberOptions,
    InternalHttpOptions,
    InternalJiraOptions,
    InternalPluginOptions,
    InternalXrayOptions,
} from "./types/plugin";
import { dedent } from "./util/dedent";
import * as dependencies from "./util/dependencies";
import { ExecutableGraph } from "./util/graph/executable-graph";
import { CapturingLogger, Level } from "./util/logging";

// REMOVE IN VERSION 8.0.0
/* eslint-disable @typescript-eslint/no-deprecated */

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe("the plugin context configuration", () => {
        describe("the option initialization", () => {
            describe("should have certain default values", () => {
                describe("jira", () => {
                    const jiraOptions: InternalJiraOptions = initJiraOptions(
                        {},
                        {
                            projectKey: "PRJ",
                            url: "https://example.org",
                        }
                    );
                    it("attachVideos", () => {
                        expect(jiraOptions.attachVideos).to.eq(false);
                    });
                    describe("fields", () => {
                        it("description", () => {
                            expect(jiraOptions.fields.description).to.eq(undefined);
                        });
                        it("labels", () => {
                            expect(jiraOptions.fields.labels).to.eq(undefined);
                        });
                        it("summary", () => {
                            expect(jiraOptions.fields.summary).to.eq(undefined);
                        });
                        it("testEnvironments", () => {
                            expect(jiraOptions.fields.testEnvironments).to.eq(undefined);
                        });
                        it("testPlan", () => {
                            expect(jiraOptions.fields.testPlan).to.eq(undefined);
                        });
                    });
                    it("testExecutionIssue", () => {
                        expect(jiraOptions.testExecutionIssue).to.eq(undefined);
                    });
                    it("testExecutionIssueDescription", () => {
                        expect(jiraOptions.testExecutionIssueDescription).to.eq(undefined);
                    });
                    it("testExecutionIssueKey", () => {
                        expect(jiraOptions.testExecutionIssueKey).to.eq(undefined);
                    });
                    it("testExecutionIssueSummary", () => {
                        expect(jiraOptions.testExecutionIssueSummary).to.eq(undefined);
                    });
                    it("testExecutionIssueType", () => {
                        expect(jiraOptions.testExecutionIssueType).to.eq("Test Execution");
                    });
                    it("testPlanIssueKey", () => {
                        expect(jiraOptions.testPlanIssueKey).to.eq(undefined);
                    });
                    it("testPlanIssueType", () => {
                        expect(jiraOptions.testPlanIssueType).to.eq("Test Plan");
                    });
                });

                describe("plugin", () => {
                    const pluginOptions: InternalPluginOptions = initPluginOptions({}, {});
                    it("debug", () => {
                        expect(pluginOptions.debug).to.eq(false);
                    });
                    it("enabled", () => {
                        expect(pluginOptions.enabled).to.eq(true);
                    });
                    it("logDirectory", () => {
                        expect(pluginOptions.logDirectory).to.eq("logs");
                    });
                    it("normalizeScreenshotNames", () => {
                        expect(pluginOptions.normalizeScreenshotNames).to.eq(false);
                    });
                });

                describe("xray", () => {
                    const xrayOptions: InternalXrayOptions = initXrayOptions({}, {});
                    describe("status", () => {
                        it("failed", () => {
                            expect(xrayOptions.status.failed).to.eq(undefined);
                        });
                        it("passed", () => {
                            expect(xrayOptions.status.passed).to.eq(undefined);
                        });
                        it("pending", () => {
                            expect(xrayOptions.status.pending).to.eq(undefined);
                        });
                        it("skipped", () => {
                            expect(xrayOptions.status.skipped).to.eq(undefined);
                        });
                        describe("step", () => {
                            it("failed", () => {
                                expect(xrayOptions.status.step?.failed).to.eq(undefined);
                            });
                            it("passed", () => {
                                expect(xrayOptions.status.step?.passed).to.eq(undefined);
                            });
                            it("pending", () => {
                                expect(xrayOptions.status.step?.pending).to.eq(undefined);
                            });
                            it("skipped", () => {
                                expect(xrayOptions.status.step?.skipped).to.eq(undefined);
                            });
                        });
                    });
                    it("testEnvironments", () => {
                        expect(xrayOptions.testEnvironments).to.eq(undefined);
                    });
                    it("uploadResults", () => {
                        expect(xrayOptions.uploadResults).to.eq(true);
                    });
                    it("uploadScreenshots", () => {
                        expect(xrayOptions.uploadScreenshots).to.eq(true);
                    });
                });

                describe("cucumber", () => {
                    let cucumberOptions: InternalCucumberOptions | undefined = undefined;
                    beforeEach(async () => {
                        cucumberOptions = await initCucumberOptions(
                            {
                                env: {
                                    jsonEnabled: true,
                                },
                                excludeSpecPattern: "",
                                projectRoot: "",
                                reporter: "",
                                specPattern: "",
                                testingType: "e2e",
                            },
                            { featureFileExtension: ".feature" }
                        );
                    });
                    it("downloadFeatures", () => {
                        expect(cucumberOptions?.downloadFeatures).to.eq(false);
                    });

                    describe("prefixes", () => {
                        it("precondition", () => {
                            expect(cucumberOptions?.prefixes.precondition).to.eq(undefined);
                        });
                        it("test", () => {
                            expect(cucumberOptions?.prefixes.test).to.eq(undefined);
                        });
                    });
                    it("uploadFeatures", () => {
                        expect(cucumberOptions?.uploadFeatures).to.eq(false);
                    });
                });
            });
            describe("should prefer provided values over default ones", () => {
                describe("jira", () => {
                    it("attachVideos", () => {
                        const jiraOptions = initJiraOptions(
                            {},
                            {
                                attachVideos: true,
                                projectKey: "PRJ",
                                url: "https://example.org",
                            }
                        );
                        expect(jiraOptions.attachVideos).to.eq(true);
                    });
                    describe("fields", () => {
                        it("description", () => {
                            const jiraOptions = initJiraOptions(
                                {},
                                {
                                    fields: {
                                        description: "Beschreibung",
                                    },
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                }
                            );
                            expect(jiraOptions.fields.description).to.eq("Beschreibung");
                        });
                        it("labels", () => {
                            const jiraOptions = initJiraOptions(
                                {},
                                {
                                    fields: {
                                        labels: "Stichworte",
                                    },
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                }
                            );
                            expect(jiraOptions.fields.labels).to.eq("Stichworte");
                        });
                        it("summary", () => {
                            const jiraOptions = initJiraOptions(
                                {},
                                {
                                    fields: {
                                        summary: "Résumé",
                                    },
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                }
                            );
                            expect(jiraOptions.fields.summary).to.eq("Résumé");
                        });
                        it("testEnvironments", () => {
                            const jiraOptions = initJiraOptions(
                                {},
                                {
                                    fields: {
                                        testEnvironments: "Testumgebungen",
                                    },
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                }
                            );
                            expect(jiraOptions.fields.testEnvironments).to.eq("Testumgebungen");
                        });
                        it("testPlan", () => {
                            const jiraOptions = initJiraOptions(
                                {},
                                {
                                    fields: {
                                        testPlan: "Plan de Test",
                                    },
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                }
                            );
                            expect(jiraOptions.fields.testPlan).to.eq("Plan de Test");
                        });
                    });
                    it("testExecutionIssue", () => {
                        const jiraOptions = initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                testExecutionIssue: { fields: { summary: "hello" } },
                                url: "https://example.org",
                            }
                        );
                        expect(jiraOptions.testExecutionIssue).to.deep.eq({
                            fields: { summary: "hello" },
                        });
                    });
                    it("testExecutionIssueDescription", () => {
                        const jiraOptions = initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                testExecutionIssueDescription: "hello",
                                url: "https://example.org",
                            }
                        );
                        expect(jiraOptions.testExecutionIssueDescription).to.eq("hello");
                    });
                    it("testExecutionIssueKey", () => {
                        const jiraOptions = initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                testExecutionIssueKey: "PRJ-123",
                                url: "https://example.org",
                            }
                        );
                        expect(jiraOptions.testExecutionIssueKey).to.eq("PRJ-123");
                    });
                    it("testExecutionIssueSummary", () => {
                        const jiraOptions = initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                testExecutionIssueSummary: "Test - Login",
                                url: "https://example.org",
                            }
                        );
                        expect(jiraOptions.testExecutionIssueSummary).to.eq("Test - Login");
                    });
                    it("testExecutionIssueType", () => {
                        const jiraOptions = initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                testExecutionIssueType: "Execution Ticket",
                                url: "https://example.org",
                            }
                        );
                        expect(jiraOptions.testExecutionIssueType).to.eq("Execution Ticket");
                    });
                    it("testPlanIssueKey", () => {
                        const jiraOptions = initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                testPlanIssueKey: "PRJ-456",
                                url: "https://example.org",
                            }
                        );
                        expect(jiraOptions.testPlanIssueKey).to.eq("PRJ-456");
                    });
                    it("testPlanIssueType", () => {
                        const jiraOptions = initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                testPlanIssueType: "Plan Ticket",
                                url: "https://example.org",
                            }
                        );
                        expect(jiraOptions.testPlanIssueType).to.eq("Plan Ticket");
                    });
                    it("url", () => {
                        const jiraOptions = initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            }
                        );
                        expect(jiraOptions.url).to.eq("https://example.org");
                    });
                });

                describe("plugin", () => {
                    it("debug", () => {
                        const pluginOptions = initPluginOptions(
                            {},
                            {
                                debug: true,
                            }
                        );
                        expect(pluginOptions.debug).to.eq(true);
                    });
                    it("enabled", () => {
                        const pluginOptions = initPluginOptions(
                            {},
                            {
                                enabled: false,
                            }
                        );
                        expect(pluginOptions.enabled).to.eq(false);
                    });
                    it("logDirectory", () => {
                        const pluginOptions = initPluginOptions(
                            {},
                            {
                                logDirectory: "./logs/",
                            }
                        );
                        expect(pluginOptions.logDirectory).to.eq("./logs/");
                    });
                    it("normalizeScreenshotNames", () => {
                        const pluginOptions = initPluginOptions(
                            {},
                            {
                                normalizeScreenshotNames: true,
                            }
                        );
                        expect(pluginOptions.normalizeScreenshotNames).to.eq(true);
                    });
                });

                describe("xray", () => {
                    describe("status", () => {
                        it("failed", () => {
                            const xrayOptions = initXrayOptions(
                                {},
                                {
                                    status: {
                                        failed: "BAD",
                                    },
                                }
                            );
                            expect(xrayOptions.status.failed).to.eq("BAD");
                        });
                        it("passed", () => {
                            const xrayOptions = initXrayOptions(
                                {},
                                {
                                    status: {
                                        passed: "GOOD",
                                    },
                                }
                            );
                            expect(xrayOptions.status.passed).to.eq("GOOD");
                        });
                        it("pending", () => {
                            const xrayOptions = initXrayOptions(
                                {},
                                {
                                    status: {
                                        pending: "PENDULUM",
                                    },
                                }
                            );
                            expect(xrayOptions.status.pending).to.eq("PENDULUM");
                        });
                        it("skipped", () => {
                            const xrayOptions = initXrayOptions(
                                {},
                                {
                                    status: {
                                        skipped: "SKIPPING STONE",
                                    },
                                }
                            );
                            expect(xrayOptions.status.skipped).to.eq("SKIPPING STONE");
                        });
                        describe("step", () => {
                            it("failed", () => {
                                const xrayOptions = initXrayOptions(
                                    {},
                                    {
                                        status: {
                                            step: {
                                                failed: "BAD",
                                            },
                                        },
                                    }
                                );
                                expect(xrayOptions.status.step?.failed).to.eq("BAD");
                            });
                            it("passed", () => {
                                const xrayOptions = initXrayOptions(
                                    {},
                                    {
                                        status: {
                                            step: {
                                                passed: "GOOD",
                                            },
                                        },
                                    }
                                );
                                expect(xrayOptions.status.step?.passed).to.eq("GOOD");
                            });
                            it("pending", () => {
                                const xrayOptions = initXrayOptions(
                                    {},
                                    {
                                        status: {
                                            step: {
                                                pending: "PENDULUM",
                                            },
                                        },
                                    }
                                );
                                expect(xrayOptions.status.step?.pending).to.eq("PENDULUM");
                            });
                            it("skipped", () => {
                                const xrayOptions = initXrayOptions(
                                    {},
                                    {
                                        status: {
                                            step: {
                                                skipped: "SKIPPING STONE",
                                            },
                                        },
                                    }
                                );
                                expect(xrayOptions.status.step?.skipped).to.eq("SKIPPING STONE");
                            });
                        });
                    });

                    it("testEnvironments", () => {
                        const xrayOptions = initXrayOptions(
                            {},
                            {
                                testEnvironments: ["Test", "Prod"],
                            }
                        );
                        expect(xrayOptions.testEnvironments).to.deep.eq(["Test", "Prod"]);
                    });

                    it("uploadResults", () => {
                        const xrayOptions = initXrayOptions(
                            {},
                            {
                                uploadResults: false,
                            }
                        );
                        expect(xrayOptions.uploadResults).to.eq(false);
                    });

                    it("uploadScreenshots", () => {
                        const xrayOptions = initXrayOptions(
                            {},
                            {
                                uploadScreenshots: false,
                            }
                        );
                        expect(xrayOptions.uploadScreenshots).to.eq(false);
                    });
                });

                describe("cucumber", () => {
                    it("downloadFeatures", async () => {
                        const cucumberOptions = await initCucumberOptions(
                            {
                                env: { jsonEnabled: true },
                                excludeSpecPattern: "",
                                projectRoot: "",
                                reporter: "",
                                specPattern: "",
                                testingType: "component",
                            },
                            {
                                downloadFeatures: true,
                                featureFileExtension: ".feature",
                            }
                        );
                        expect(cucumberOptions?.downloadFeatures).to.eq(true);
                    });
                    describe("prefixes", () => {
                        it("precondition", async () => {
                            const cucumberOptions = await initCucumberOptions(
                                {
                                    env: { jsonEnabled: true },
                                    excludeSpecPattern: "",
                                    projectRoot: "",
                                    reporter: "",
                                    specPattern: "",
                                    testingType: "component",
                                },
                                {
                                    featureFileExtension: ".feature",
                                    prefixes: { precondition: "PreconditionYeah_" },
                                }
                            );
                            expect(cucumberOptions?.prefixes.precondition).to.eq(
                                "PreconditionYeah_"
                            );
                        });
                        it("test", async () => {
                            const cucumberOptions = await initCucumberOptions(
                                {
                                    env: { jsonEnabled: true },
                                    excludeSpecPattern: "",
                                    projectRoot: "",
                                    reporter: "",
                                    specPattern: "",
                                    testingType: "component",
                                },
                                {
                                    featureFileExtension: ".feature",
                                    prefixes: { test: "TestSomething_" },
                                }
                            );
                            expect(cucumberOptions?.prefixes.test).to.eq("TestSomething_");
                        });
                    });
                    it("uploadFeatures", async () => {
                        const cucumberOptions = await initCucumberOptions(
                            {
                                env: { jsonEnabled: true },
                                excludeSpecPattern: "",
                                projectRoot: "",
                                reporter: "",
                                specPattern: "",
                                testingType: "component",
                            },
                            {
                                featureFileExtension: ".feature",
                                uploadFeatures: true,
                            }
                        );
                        expect(cucumberOptions?.uploadFeatures).to.eq(true);
                    });
                });
            });
            describe("should prefer environment variables over provided values", () => {
                describe("jira", () => {
                    it("JIRA_PROJECT_KEY", () => {
                        const env = {
                            ["JIRA_PROJECT_KEY"]: "ABC",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "CYP",
                            url: "https://example.org",
                        });
                        expect(jiraOptions.projectKey).to.eq("ABC");
                    });

                    it("JIRA_ATTACH_VIDEOS", () => {
                        const env = {
                            ["JIRA_ATTACH_VIDEOS"]: "true",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            attachVideos: false,
                            projectKey: "CYP",
                            url: "https://example.org",
                        });
                        expect(jiraOptions.attachVideos).to.be.true;
                    });

                    describe("fields", () => {
                        it("JIRA_FIELDS_DESCRIPTION", () => {
                            const env = {
                                ["JIRA_FIELDS_DESCRIPTION"]: "customfield_98765",
                            };
                            const jiraOptions = initJiraOptions(env, {
                                fields: {
                                    description: "customfield_12345",
                                },
                                projectKey: "PRJ",
                                url: "https://example.org",
                            });
                            expect(jiraOptions.fields.description).to.eq("customfield_98765");
                        });

                        it("JIRA_FIELDS_LABELS", () => {
                            const env = {
                                ["JIRA_FIELDS_LABELS"]: "customfield_98765",
                            };
                            const jiraOptions = initJiraOptions(env, {
                                fields: {
                                    labels: "customfield_12345",
                                },
                                projectKey: "PRJ",
                                url: "https://example.org",
                            });
                            expect(jiraOptions.fields.labels).to.eq("customfield_98765");
                        });

                        it("JIRA_FIELDS_SUMMARY", () => {
                            const env = {
                                ["JIRA_FIELDS_SUMMARY"]: "customfield_98765",
                            };
                            const jiraOptions = initJiraOptions(env, {
                                fields: {
                                    summary: "customfield_12345",
                                },
                                projectKey: "PRJ",
                                url: "https://example.org",
                            });
                            expect(jiraOptions.fields.summary).to.eq("customfield_98765");
                        });

                        it("JIRA_FIELDS_TEST_ENVIRONMENTS", () => {
                            const env = {
                                ["JIRA_FIELDS_TEST_ENVIRONMENTS"]: "customfield_98765",
                            };
                            const jiraOptions = initJiraOptions(env, {
                                fields: {
                                    testEnvironments: "customfield_12345",
                                },
                                projectKey: "PRJ",
                                url: "https://example.org",
                            });
                            expect(jiraOptions.fields.testEnvironments).to.eq("customfield_98765");
                        });

                        it("JIRA_FIELDS_TEST_PLAN", () => {
                            const env = {
                                ["JIRA_FIELDS_TEST_PLAN"]: "customfield_98765",
                            };
                            const jiraOptions = initJiraOptions(env, {
                                fields: {
                                    testPlan: "customfield_12345",
                                },
                                projectKey: "PRJ",
                                url: "https://example.org",
                            });
                            expect(jiraOptions.fields.testPlan).to.eq("customfield_98765");
                        });
                    });

                    it("JIRA_TEST_EXECUTION_ISSUE", () => {
                        const env = {
                            ["JIRA_TEST_EXECUTION_ISSUE"]: {
                                fields: {
                                    ["customfield_12345"]: "Jeff",
                                    summary: "Hello bonjour",
                                },
                            },
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "CYP",
                            testExecutionIssue: {
                                fields: {
                                    description: "hey",
                                },
                            },
                            url: "https://example.org",
                        });
                        expect(jiraOptions.testExecutionIssue).to.deep.eq({
                            fields: {
                                ["customfield_12345"]: "Jeff",
                                summary: "Hello bonjour",
                            },
                        });
                    });

                    it("JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION", () => {
                        const env = {
                            ["JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION"]: "Good morning",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "CYP",
                            testExecutionIssueDescription: "Goodbye",
                            url: "https://example.org",
                        });
                        expect(jiraOptions.testExecutionIssueDescription).to.eq("Good morning");
                    });

                    it("JIRA_TEST_EXECUTION_ISSUE_KEY", () => {
                        const env = {
                            ["JIRA_TEST_EXECUTION_ISSUE_KEY"]: "CYP-123",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "CYP",
                            testExecutionIssueKey: "CYP-789",
                            url: "https://example.org",
                        });
                        expect(jiraOptions.testExecutionIssueKey).to.eq("CYP-123");
                    });

                    it("JIRA_TEST_EXECUTION_ISSUE_SUMMARY", () => {
                        const env = {
                            ["JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Some test case",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "CYP",
                            testExecutionIssueSummary: "Summarini",
                            url: "https://example.org",
                        });
                        expect(jiraOptions.testExecutionIssueSummary).to.eq("Some test case");
                    });

                    it("JIRA_TEST_EXECUTION_ISSUE_TYPE", () => {
                        const env = {
                            ["JIRA_TEST_EXECUTION_ISSUE_TYPE"]: "Execution Issue",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "CYP",
                            testExecutionIssueType: "Execution",
                            url: "https://example.org",
                        });
                        expect(jiraOptions.testExecutionIssueType).to.eq("Execution Issue");
                    });

                    it("JIRA_TEST_PLAN_ISSUE_KEY", () => {
                        const env = {
                            ["JIRA_TEST_PLAN_ISSUE_KEY"]: "CYP-456",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "CYP",
                            testPlanIssueKey: "CYP-123",
                            url: "https://example.org",
                        });
                        expect(jiraOptions.testPlanIssueKey).to.eq("CYP-456");
                    });

                    it("JIRA_TEST_PLAN_ISSUE_TYPE", () => {
                        const env = {
                            ["JIRA_TEST_PLAN_ISSUE_TYPE"]: "Plan Issue",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "CYP",
                            testExecutionIssueType: "Plan",
                            url: "https://example.org",
                        });
                        expect(jiraOptions.testPlanIssueType).to.eq("Plan Issue");
                    });

                    it("JIRA_URL", () => {
                        const env = {
                            ["JIRA_URL"]: "https://example.org",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "CYP",
                            url: "https://some.domain.org",
                        });
                        expect(jiraOptions.url).to.eq("https://example.org");
                    });
                });
                describe("xray", () => {
                    it("XRAY_STATUS_FAILED", () => {
                        const env = {
                            ["XRAY_STATUS_FAILED"]: "no",
                        };
                        const xrayOptions = initXrayOptions(env, {
                            status: {
                                failed: "ERROR",
                            },
                        });
                        expect(xrayOptions.status.failed).to.eq("no");
                    });

                    it("XRAY_STATUS_PASSED", () => {
                        const env = {
                            ["XRAY_STATUS_PASSED"]: "ok",
                        };
                        const xrayOptions = initXrayOptions(env, {
                            status: {
                                passed: "FLYBY",
                            },
                        });
                        expect(xrayOptions.status.passed).to.eq("ok");
                    });

                    it("XRAY_STATUS_PENDING", () => {
                        const env = {
                            ["XRAY_STATUS_PENDING"]: "pendulum",
                        };
                        const xrayOptions = initXrayOptions(env, {
                            status: {
                                pending: "PENCIL",
                            },
                        });
                        expect(xrayOptions.status.pending).to.eq("pendulum");
                    });

                    it("XRAY_STATUS_SKIPPED", () => {
                        const env = {
                            ["XRAY_STATUS_SKIPPED"]: "ski-ba-bop-ba-dop-bop",
                        };
                        const xrayOptions = initXrayOptions(env, {
                            status: {
                                skipped: "HOP",
                            },
                        });
                        expect(xrayOptions.status.skipped).to.eq("ski-ba-bop-ba-dop-bop");
                    });

                    it("XRAY_STATUS_STEP_FAILED", () => {
                        const env = {
                            ["XRAY_STATUS_STEP_FAILED"]: "no",
                        };
                        const xrayOptions = initXrayOptions(env, {
                            status: {
                                step: {
                                    failed: "ERROR",
                                },
                            },
                        });
                        expect(xrayOptions.status.step?.failed).to.eq("no");
                    });

                    it("XRAY_STATUS_STEP_PASSED", () => {
                        const env = {
                            ["XRAY_STATUS_STEP_PASSED"]: "ok",
                        };
                        const xrayOptions = initXrayOptions(env, {
                            status: {
                                step: { passed: "FLYBY" },
                            },
                        });
                        expect(xrayOptions.status.step?.passed).to.eq("ok");
                    });

                    it("XRAY_STATUS_STEP_PENDING", () => {
                        const env = {
                            ["XRAY_STATUS_STEP_PENDING"]: "pendulum",
                        };
                        const xrayOptions = initXrayOptions(env, {
                            status: {
                                step: { pending: "PENCIL" },
                            },
                        });
                        expect(xrayOptions.status.step?.pending).to.eq("pendulum");
                    });

                    it("XRAY_STATUS_STEP_SKIPPED", () => {
                        const env = {
                            ["XRAY_STATUS_STEP_SKIPPED"]: "ski-ba-bop-ba-dop-bop",
                        };
                        const xrayOptions = initXrayOptions(env, {
                            status: {
                                step: { skipped: "HOP" },
                            },
                        });
                        expect(xrayOptions.status.step?.skipped).to.eq("ski-ba-bop-ba-dop-bop");
                    });

                    it("XRAY_TEST_ENVIRONMENTS", () => {
                        const env = {
                            ["XRAY_TEST_ENVIRONMENTS"]: [false, "bonjour", 5],
                        };
                        const xrayOptions = initXrayOptions(env, {
                            testEnvironments: ["A", "B", "C"],
                        });
                        expect(xrayOptions.testEnvironments).to.deep.eq(["false", "bonjour", "5"]);
                    });

                    it("XRAY_UPLOAD_RESULTS", () => {
                        const env = {
                            ["XRAY_UPLOAD_RESULTS"]: "false",
                        };
                        const xrayOptions = initXrayOptions(env, {
                            uploadResults: true,
                        });
                        expect(xrayOptions.uploadResults).to.be.false;
                    });

                    it("XRAY_UPLOAD_SCREENSHOTS", () => {
                        const env = {
                            ["XRAY_UPLOAD_SCREENSHOTS"]: "false",
                        };
                        const xrayOptions = initXrayOptions(env, {
                            uploadScreenshots: true,
                        });
                        expect(xrayOptions.uploadScreenshots).to.be.false;
                    });
                });
                describe("cucumber", () => {
                    it("CUCUMBER_FEATURE_FILE_EXTENSION", async () => {
                        const cucumberOptions = await initCucumberOptions(
                            {
                                env: {
                                    ["CUCUMBER_FEATURE_FILE_EXTENSION"]: ".feature.file",
                                    jsonEnabled: true,
                                },
                                excludeSpecPattern: "",
                                projectRoot: "",
                                reporter: "",
                                specPattern: "",
                                testingType: "e2e",
                            },
                            {
                                featureFileExtension: ".feature",
                            }
                        );
                        expect(cucumberOptions?.featureFileExtension).to.eq(".feature.file");
                    });

                    it("CUCUMBER_DOWNLOAD_FEATURES", async () => {
                        const cucumberOptions = await initCucumberOptions(
                            {
                                env: {
                                    ["CUCUMBER_DOWNLOAD_FEATURES"]: "true",
                                    jsonEnabled: true,
                                },
                                excludeSpecPattern: "",
                                projectRoot: "",
                                reporter: "",
                                specPattern: "",
                                testingType: "e2e",
                            },
                            {
                                downloadFeatures: false,
                                featureFileExtension: ".feature",
                            }
                        );
                        expect(cucumberOptions?.downloadFeatures).to.be.true;
                    });

                    it("CUCUMBER_PREFIXES_PRECONDITION", async () => {
                        const cucumberOptions = await initCucumberOptions(
                            {
                                env: {
                                    ["CUCUMBER_PREFIXES_PRECONDITION"]: "BigPrecondition:",
                                    jsonEnabled: true,
                                },
                                excludeSpecPattern: "",
                                projectRoot: "",
                                reporter: "",
                                specPattern: "",
                                testingType: "e2e",
                            },
                            {
                                featureFileExtension: ".feature",
                                prefixes: { precondition: "SmallPrecondition:" },
                            }
                        );
                        expect(cucumberOptions?.prefixes.precondition).to.eq("BigPrecondition:");
                    });

                    it("CUCUMBER_PREFIXES_TEST", async () => {
                        const cucumberOptions = await initCucumberOptions(
                            {
                                env: {
                                    ["CUCUMBER_PREFIXES_TEST"]: "BigTest:",
                                    jsonEnabled: true,
                                },
                                excludeSpecPattern: "",
                                projectRoot: "",
                                reporter: "",
                                specPattern: "",
                                testingType: "e2e",
                            },
                            {
                                featureFileExtension: ".feature",
                                prefixes: { test: "SmallTest:" },
                            }
                        );
                        expect(cucumberOptions?.prefixes.test).to.eq("BigTest:");
                    });

                    it("CUCUMBER_UPLOAD_FEATURES", async () => {
                        const cucumberOptions = await initCucumberOptions(
                            {
                                env: {
                                    ["CUCUMBER_UPLOAD_FEATURES"]: "true",
                                    jsonEnabled: true,
                                },
                                excludeSpecPattern: "",
                                projectRoot: "",
                                reporter: "",
                                specPattern: "",
                                testingType: "e2e",
                            },
                            {
                                featureFileExtension: ".feature",
                                uploadFeatures: false,
                            }
                        );
                        expect(cucumberOptions?.uploadFeatures).to.be.true;
                    });
                });
                describe("plugin", () => {
                    it("PLUGIN_DEBUG", () => {
                        const env = {
                            ["PLUGIN_DEBUG"]: "true",
                        };
                        const pluginOptions = initPluginOptions(env, {
                            debug: false,
                        });
                        expect(pluginOptions.debug).to.be.true;
                    });

                    it("PLUGIN_ENABLED", () => {
                        const env = {
                            ["PLUGIN_ENABLED"]: "false",
                        };
                        const pluginOptions = initPluginOptions(env, {
                            enabled: true,
                        });
                        expect(pluginOptions.enabled).to.be.false;
                    });

                    it("PLUGIN_LOG_DIRECTORY", () => {
                        const env = {
                            ["PLUGIN_LOG_DIRECTORY"]: "/home/logs/cypress-xray-plugin",
                        };
                        const pluginOptions = initPluginOptions(env, {
                            logDirectory: "./logging/subdirectory",
                        });
                        expect(pluginOptions.logDirectory).to.eq("/home/logs/cypress-xray-plugin");
                    });

                    it("PLUGIN_NORMALIZE_SCREENSHOT_NAMES", () => {
                        const env = {
                            ["PLUGIN_NORMALIZE_SCREENSHOT_NAMES"]: "true",
                        };
                        const pluginOptions = initPluginOptions(env, {
                            normalizeScreenshotNames: false,
                        });
                        expect(pluginOptions.normalizeScreenshotNames).to.be.true;
                    });
                });
            });
            describe("detects invalid configurations", () => {
                it("detects unset project keys", () => {
                    expect(() =>
                        initJiraOptions(
                            {},
                            {
                                projectKey: undefined as unknown as string,
                                url: "https://example.org",
                            }
                        )
                    ).to.throw("Plugin misconfiguration: Jira project key was not set");
                });
                it("throws if the cucumber preprocessor is not installed", async () => {
                    stub(dependencies, "IMPORT").rejects(new Error("Failed to import package"));
                    await expect(
                        initCucumberOptions(
                            {
                                env: {},
                                excludeSpecPattern: "",
                                projectRoot: "",
                                reporter: "",
                                specPattern: "",
                                testingType: "e2e",
                            },
                            {
                                featureFileExtension: ".feature",
                            }
                        )
                    ).to.eventually.be.rejectedWith(
                        dedent(`
                            Plugin dependency misconfigured: @badeball/cypress-cucumber-preprocessor

                            Failed to import package

                            The plugin depends on the package and should automatically download it during installation, but might have failed to do so because of conflicting Node versions

                            Make sure to install the package manually using: npm install @badeball/cypress-cucumber-preprocessor --save-dev
                        `)
                    );
                });
                it("detects if the cucumber preprocessor json report is not enabled", async () => {
                    await expect(
                        initCucumberOptions(
                            {
                                env: { jsonEnabled: false },
                                excludeSpecPattern: "",
                                projectRoot: "",
                                reporter: "",
                                specPattern: "",
                                testingType: "e2e",
                            },
                            {
                                featureFileExtension: ".feature",
                            }
                        )
                    ).to.eventually.be.rejectedWith(
                        dedent(`
                            Plugin misconfiguration: Cucumber preprocessor JSON report disabled

                            Make sure to enable the JSON report as described in https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md
                        `)
                    );
                });
                it("detects if the cucumber preprocessor json report path was not set", async () => {
                    await expect(
                        initCucumberOptions(
                            {
                                env: { jsonEnabled: true, jsonOutput: "" },
                                excludeSpecPattern: "",
                                projectRoot: "",
                                reporter: "",
                                specPattern: "",
                                testingType: "e2e",
                            },
                            {
                                featureFileExtension: ".feature",
                            }
                        )
                    ).to.eventually.be.rejectedWith(
                        dedent(`
                            Plugin misconfiguration: Cucumber preprocessor JSON report path was not set

                            Make sure to configure the JSON report path as described in https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md
                        `)
                    );
                });
            });
        });

        describe("the http clients instantiation", () => {
            it("creates a single client by default", () => {
                const httpClients = initHttpClients(undefined, undefined);
                expect(httpClients.jira).to.eq(httpClients.xray);
                expect(httpClients.jira).to.deep.eq(new AxiosRestClient({ debug: undefined }));
            });
            it("sets debugging to true if enabled", () => {
                const httpClients = initHttpClients({ debug: true }, undefined);
                expect(httpClients.jira).to.eq(httpClients.xray);
                expect(httpClients.jira).to.deep.eq(new AxiosRestClient({ debug: true }));
            });
            it("sets debugging to false if disabled", () => {
                const httpClients = initHttpClients({ debug: false }, undefined);
                expect(httpClients.jira).to.eq(httpClients.xray);
                expect(httpClients.jira).to.deep.eq(new AxiosRestClient({ debug: false }));
            });
            it("creates a single client if empty options are passed", () => {
                const httpClients = initHttpClients(undefined, {});
                expect(httpClients.jira).to.eq(httpClients.xray);
                expect(httpClients.jira).to.deep.eq(
                    new AxiosRestClient({
                        debug: undefined,
                        http: {},
                        rateLimiting: undefined,
                    })
                );
            });
            it("creates a single client using a single config", () => {
                const httpOptions: InternalHttpOptions = {
                    proxy: {
                        host: "https://example.org",
                        port: 12345,
                    },
                };
                const httpClients = initHttpClients(undefined, httpOptions);
                expect(httpClients.jira).to.eq(httpClients.xray);
                expect(httpClients.jira).to.deep.eq(
                    new AxiosRestClient({
                        debug: undefined,
                        http: {
                            proxy: {
                                host: "https://example.org",
                                port: 12345,
                            },
                        },
                        rateLimiting: undefined,
                    })
                );
            });
            it("creates a different jira client if a jira config is passed", () => {
                const httpOptions: InternalHttpOptions = {
                    jira: {
                        proxy: {
                            host: "https://example.org",
                            port: 12345,
                        },
                    },
                };
                const httpClients = initHttpClients(undefined, httpOptions);
                expect(httpClients.jira).to.not.eq(httpClients.xray);
                expect(httpClients.jira).to.deep.eq(
                    new AxiosRestClient({
                        debug: undefined,
                        http: {
                            proxy: {
                                host: "https://example.org",
                                port: 12345,
                            },
                        },
                        rateLimiting: undefined,
                    })
                );
                expect(httpClients.xray).to.deep.eq(
                    new AxiosRestClient({
                        debug: undefined,
                        http: {},
                        rateLimiting: undefined,
                    })
                );
            });
            it("creates a different xray client if an xray config is passed", () => {
                const httpOptions: InternalHttpOptions = {
                    xray: {
                        proxy: {
                            host: "https://example.org",
                            port: 12345,
                        },
                    },
                };
                const httpClients = initHttpClients(undefined, httpOptions);
                expect(httpClients.jira).to.not.eq(httpClients.xray);
                expect(httpClients.jira).to.deep.eq(
                    new AxiosRestClient({
                        debug: undefined,
                        http: {},
                        rateLimiting: undefined,
                    })
                );
                expect(httpClients.xray).to.deep.eq(
                    new AxiosRestClient({
                        debug: undefined,
                        http: {
                            proxy: {
                                host: "https://example.org",
                                port: 12345,
                            },
                        },
                        rateLimiting: undefined,
                    })
                );
            });
            it("creates different clients if individual configs are passed", () => {
                const httpOptions: InternalHttpOptions = {
                    jira: {
                        proxy: {
                            host: "http://localhost",
                            port: 98765,
                        },
                    },
                    xray: {
                        proxy: {
                            host: "https://example.org",
                            port: 12345,
                        },
                    },
                };
                const httpClients = initHttpClients(undefined, httpOptions);
                expect(httpClients.jira).to.not.eq(httpClients.xray);
                expect(httpClients.jira).to.deep.eq(
                    new AxiosRestClient({
                        debug: undefined,
                        http: {
                            proxy: {
                                host: "http://localhost",
                                port: 98765,
                            },
                        },
                        rateLimiting: undefined,
                    })
                );
                expect(httpClients.xray).to.deep.eq(
                    new AxiosRestClient({
                        debug: undefined,
                        http: {
                            proxy: {
                                host: "https://example.org",
                                port: 12345,
                            },
                        },
                        rateLimiting: undefined,
                    })
                );
            });
            it("passes common http options to both clients", () => {
                const httpOptions: InternalHttpOptions = {
                    jira: {
                        proxy: {
                            host: "http://localhost",
                            port: 98765,
                        },
                    },
                    rateLimiting: { requestsPerSecond: 5 },
                    timeout: 42,
                    xray: {
                        proxy: {
                            host: "https://example.org",
                            port: 12345,
                        },
                    },
                };
                const httpClients = initHttpClients(undefined, httpOptions);
                expect(httpClients.jira).to.not.eq(httpClients.xray);
                expect(httpClients.jira).to.deep.eq(
                    new AxiosRestClient({
                        debug: undefined,
                        http: {
                            proxy: {
                                host: "http://localhost",
                                port: 98765,
                            },
                            timeout: 42,
                        },
                        rateLimiting: { requestsPerSecond: 5 },
                    })
                );
                expect(httpClients.xray).to.deep.eq(
                    new AxiosRestClient({
                        debug: undefined,
                        http: {
                            proxy: {
                                host: "https://example.org",
                                port: 12345,
                            },
                            timeout: 42,
                        },
                        rateLimiting: { requestsPerSecond: 5 },
                    })
                );
            });
            it("prefers individual http options to common ones", () => {
                const httpOptions: InternalHttpOptions = {
                    jira: {
                        proxy: {
                            host: "http://localhost1",
                            port: 9999,
                        },
                        rateLimiting: { requestsPerSecond: 20 },
                        timeout: 500,
                    },
                    proxy: {
                        host: "http://localhost2",
                        port: 5555,
                    },
                    rateLimiting: { requestsPerSecond: 10 },
                    timeout: 42,
                    xray: {
                        proxy: {
                            host: "http://localhost3",
                            port: 1111,
                        },
                        rateLimiting: { requestsPerSecond: 1 },
                        timeout: 10000,
                    },
                };
                const httpClients = initHttpClients(undefined, httpOptions);
                expect(httpClients.jira).to.deep.eq(
                    new AxiosRestClient({
                        debug: undefined,
                        http: {
                            proxy: {
                                host: "http://localhost1",
                                port: 9999,
                            },
                            timeout: 500,
                        },
                        rateLimiting: { requestsPerSecond: 20 },
                    })
                );
                expect(httpClients.xray).to.deep.eq(
                    new AxiosRestClient({
                        debug: undefined,
                        http: {
                            proxy: {
                                host: "http://localhost3",
                                port: 1111,
                            },
                            timeout: 10000,
                        },
                        rateLimiting: { requestsPerSecond: 1 },
                    })
                );
            });
        });

        describe("the clients instantiation", () => {
            let jiraOptions: InternalJiraOptions;
            beforeEach(() => {
                jiraOptions = initJiraOptions(
                    {},
                    {
                        projectKey: "CYP",
                        url: "https://example.org",
                    }
                );
            });

            it("should detect cloud credentials", async () => {
                const env = {
                    ["JIRA_API_TOKEN"]: "1337",
                    ["JIRA_USERNAME"]: "user@somewhere.xyz",
                    ["XRAY_CLIENT_ID"]: "abc",
                    ["XRAY_CLIENT_SECRET"]: "xyz",
                };
                const logger = getMockedLogger();
                const httpClients = { jira: getMockedRestClient(), xray: getMockedRestClient() };
                httpClients.jira.get.onFirstCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: { active: true, displayName: "Jeff" } as User,
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                httpClients.xray.post.onFirstCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                const { jiraClient, xrayClient } = await initClients(jiraOptions, env, httpClients);
                expect(jiraClient).to.be.an.instanceof(BaseJiraClient);
                expect(xrayClient).to.be.an.instanceof(XrayClientCloud);
                expect((jiraClient as BaseJiraClient).getCredentials()).to.be.an.instanceof(
                    BasicAuthCredentials
                );
                expect((xrayClient as XrayClientCloud).getCredentials()).to.be.an.instanceof(
                    JwtCredentials
                );
                expect(httpClients.jira.get).to.have.been.calledOnce;
                expect(httpClients.xray.post).to.have.been.calledOnce;
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.INFO,
                    "Jira username and API token found. Setting up Jira cloud basic auth credentials."
                );
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.INFO,
                    "Xray client ID and client secret found. Setting up Xray cloud JWT credentials."
                );
            });

            it("should throw for missing xray cloud credentials", async () => {
                const env = {
                    ["JIRA_API_TOKEN"]: "1337",
                    ["JIRA_USERNAME"]: "user@somewhere.xyz",
                };
                const logger = getMockedLogger();
                const httpClients = { jira: getMockedRestClient(), xray: getMockedRestClient() };
                httpClients.jira.get.onFirstCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: { active: true, displayName: "Jeff" } as User,
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                await expect(
                    initClients(jiraOptions, env, httpClients)
                ).to.eventually.be.rejectedWith(
                    dedent(`
                        Failed to configure Xray client: Jira cloud credentials detected, but the provided Xray credentials are not Xray cloud credentials.

                          You can find all configurations currently supported at: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/
                    `)
                );
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.INFO,
                    "Jira username and API token found. Setting up Jira cloud basic auth credentials."
                );
            });

            it("should detect PAT credentials", async () => {
                const env = {
                    ["JIRA_API_TOKEN"]: "1337",
                };
                const logger = getMockedLogger();
                const httpClients = { jira: getMockedRestClient(), xray: getMockedRestClient() };
                httpClients.jira.get.onFirstCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: { active: true, displayName: "Jeff" } as User,
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                httpClients.xray.get.onFirstCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: {
                        active: true,
                        licenseType: "Demo License",
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                const { jiraClient, xrayClient } = await initClients(jiraOptions, env, httpClients);
                expect(jiraClient).to.be.an.instanceof(BaseJiraClient);
                expect(xrayClient).to.be.an.instanceof(ServerClient);
                expect((jiraClient as BaseJiraClient).getCredentials()).to.be.an.instanceof(
                    PatCredentials
                );
                expect((xrayClient as ServerClient).getCredentials()).to.be.an.instanceof(
                    PatCredentials
                );
                expect(httpClients.jira.get).to.have.been.calledOnce;
                expect(httpClients.xray.get).to.have.been.calledOnce;
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.INFO,
                    "Jira PAT found. Setting up Jira server PAT credentials."
                );
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.INFO,
                    "Jira PAT found. Setting up Xray server PAT credentials."
                );
            });

            it("should detect basic auth credentials", async () => {
                const env = {
                    ["JIRA_PASSWORD"]: "1337",
                    ["JIRA_USERNAME"]: "user",
                };
                const logger = getMockedLogger();
                const httpClients = { jira: getMockedRestClient(), xray: getMockedRestClient() };
                httpClients.jira.get.onFirstCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: { active: true, displayName: "Jeff" } as User,
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                httpClients.xray.get.onFirstCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: {
                        active: true,
                        licenseType: "Demo License",
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                const { jiraClient, xrayClient } = await initClients(jiraOptions, env, httpClients);
                expect(jiraClient).to.be.an.instanceof(BaseJiraClient);
                expect(xrayClient).to.be.an.instanceof(ServerClient);
                expect((jiraClient as BaseJiraClient).getCredentials()).to.be.an.instanceof(
                    BasicAuthCredentials
                );
                expect((xrayClient as ServerClient).getCredentials()).to.be.an.instanceof(
                    BasicAuthCredentials
                );
                expect(httpClients.jira.get).to.have.been.calledOnce;
                expect(httpClients.xray.get).to.have.been.calledOnce;
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.INFO,
                    "Jira username and password found. Setting up Jira server basic auth credentials."
                );
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.INFO,
                    "Jira username and password found. Setting up Xray server basic auth credentials."
                );
            });

            it("should choose cloud credentials over server credentials", async () => {
                const env = {
                    ["JIRA_API_TOKEN"]: "1337",
                    ["JIRA_PASSWORD"]: "xyz",
                    ["JIRA_USERNAME"]: "user",
                    ["XRAY_CLIENT_ID"]: "abc",
                    ["XRAY_CLIENT_SECRET"]: "xyz",
                };
                getMockedLogger({ allowUnstubbedCalls: true });
                const httpClients = { jira: getMockedRestClient(), xray: getMockedRestClient() };
                httpClients.jira.get.onFirstCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: { active: true, displayName: "Jeff" } as User,
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                httpClients.xray.post.onFirstCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                const { jiraClient, xrayClient } = await initClients(jiraOptions, env, httpClients);
                expect(jiraClient).to.be.an.instanceof(BaseJiraClient);
                expect(xrayClient).to.be.an.instanceof(XrayClientCloud);
                expect((jiraClient as BaseJiraClient).getCredentials()).to.be.an.instanceof(
                    BasicAuthCredentials
                );
                expect((xrayClient as XrayClientCloud).getCredentials()).to.be.an.instanceof(
                    JwtCredentials
                );
            });

            it("should throw an error for missing credentials", async () => {
                const httpClients = { jira: getMockedRestClient(), xray: getMockedRestClient() };
                await expect(
                    initClients(jiraOptions, {}, httpClients)
                ).to.eventually.be.rejectedWith(
                    dedent(`
                        Failed to configure Jira client: No viable authentication method was configured.

                          You can find all configurations currently supported at: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/
                    `)
                );
            });

            it("throws if no user details are returned from jira", async () => {
                getMockedLogger();
                const httpClients = { jira: getMockedRestClient(), xray: getMockedRestClient() };
                httpClients.jira.get.resolves({
                    config: { headers: new AxiosHeaders() },
                    data: "<div>Welcome</div>",
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                await expect(
                    initClients(
                        jiraOptions,
                        {
                            ["JIRA_API_TOKEN"]: "1337",
                        },
                        httpClients
                    )
                ).to.eventually.be.rejectedWith(
                    dedent(`
                        Failed to establish communication with Jira: https://example.org

                          Jira did not return a valid response: JSON containing a username was expected, but not received.

                        Make sure you have correctly set up:
                        - Jira base URL: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                        - Jira authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#jira

                        For more information, set the plugin to debug mode: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/plugin/#debug
                    `)
                );
            });

            it("throws if no usernames are returned from jira", async () => {
                getMockedLogger();
                const httpClients = { jira: getMockedRestClient(), xray: getMockedRestClient() };
                httpClients.jira.get.resolves({
                    config: { headers: new AxiosHeaders() },
                    data: {
                        active: true,
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                await expect(
                    initClients(
                        jiraOptions,
                        {
                            ["JIRA_API_TOKEN"]: "1337",
                        },
                        httpClients
                    )
                ).to.eventually.be.rejectedWith(
                    dedent(`
                        Failed to establish communication with Jira: https://example.org

                          Jira did not return a valid response: JSON containing a username was expected, but not received.

                        Make sure you have correctly set up:
                        - Jira base URL: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                        - Jira authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#jira

                        For more information, set the plugin to debug mode: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/plugin/#debug
                    `)
                );
            });

            it("throws if no license data is returned from xray server", async () => {
                getMockedLogger();
                const httpClients = { jira: getMockedRestClient(), xray: getMockedRestClient() };
                httpClients.jira.get.resolves({
                    config: { headers: new AxiosHeaders() },
                    data: {
                        active: true,
                        displayName: "Demo User",
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                httpClients.xray.get.resolves({
                    config: { headers: new AxiosHeaders() },
                    data: "<div>Welcome</div>",
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                await expect(
                    initClients(
                        jiraOptions,
                        {
                            ["JIRA_API_TOKEN"]: "1337",
                        },
                        httpClients
                    )
                ).to.eventually.be.rejectedWith(
                    dedent(`
                        Failed to establish communication with Xray: https://example.org

                          Xray did not return a valid response: JSON containing basic Xray license information was expected, but not received.

                        Make sure you have correctly set up:
                        - Jira base URL: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                        - Xray server authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#xray-server
                        - Xray itself: https://docs.getxray.app/display/XRAY/Installation

                        For more information, set the plugin to debug mode: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/plugin/#debug
                    `)
                );
            });

            it("throws if an inactive license is returned from xray server", async () => {
                getMockedLogger();
                const httpClients = { jira: getMockedRestClient(), xray: getMockedRestClient() };
                httpClients.jira.get.resolves({
                    config: { headers: new AxiosHeaders() },
                    data: {
                        active: true,
                        displayName: "Demo User",
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                httpClients.xray.get.resolves({
                    config: { headers: new AxiosHeaders() },
                    data: {
                        active: false,
                        licenseType: "Basic",
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                await expect(
                    initClients(
                        jiraOptions,
                        {
                            ["JIRA_API_TOKEN"]: "1337",
                        },
                        httpClients
                    )
                ).to.eventually.be.rejectedWith(
                    dedent(`
                        Failed to establish communication with Xray: https://example.org

                          The Xray license is not active

                        Make sure you have correctly set up:
                        - Jira base URL: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                        - Xray server authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#xray-server
                        - Xray itself: https://docs.getxray.app/display/XRAY/Installation

                        For more information, set the plugin to debug mode: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/plugin/#debug
                    `)
                );
            });

            it("throws if the xray credentials are invalid", async () => {
                getMockedLogger();
                const httpClients = { jira: getMockedRestClient(), xray: getMockedRestClient() };
                httpClients.jira.get.resolves({
                    config: { headers: new AxiosHeaders() },
                    data: {
                        active: true,
                        displayName: "Demo User",
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                httpClients.xray.post.rejects(
                    new AxiosError(
                        "Request failed with status code 404",
                        HttpStatusCode.BadRequest.toString(),
                        undefined,
                        null,
                        {
                            config: { headers: new AxiosHeaders() },
                            data: {
                                errorMessages: ["not found"],
                            },
                            headers: {},
                            status: HttpStatusCode.NotFound,
                            statusText: HttpStatusCode[HttpStatusCode.NotFound],
                        }
                    )
                );
                await expect(
                    initClients(
                        jiraOptions,
                        {
                            ["JIRA_API_TOKEN"]: "1337",
                            ["JIRA_USERNAME"]: "user",
                            ["XRAY_CLIENT_ID"]: "abc",
                            ["XRAY_CLIENT_SECRET"]: "xyz",
                        },
                        httpClients
                    )
                ).to.eventually.be.rejectedWith(
                    dedent(`
                        Failed to establish communication with Xray: https://xray.cloud.getxray.app/api/v2/authenticate

                          Failed to authenticate

                        Make sure you have correctly set up:
                        - Xray cloud authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#xray-cloud
                        - Xray itself: https://docs.getxray.app/display/XRAYCLOUD/Installation

                        For more information, set the plugin to debug mode: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/plugin/#debug
                    `)
                );
            });
        });
    });

    describe(SimpleEvidenceCollection.name, () => {
        it("collects evidence for single tests", () => {
            const evidenceCollection = new SimpleEvidenceCollection();
            evidenceCollection.addEvidence("CYP-123", {
                contentType: "application/json",
                data: "WyJoZWxsbyJd",
                filename: "hello.json",
            });
            evidenceCollection.addEvidence("CYP-123", {
                contentType: "application/json",
                data: "WyJnb29kYnllIl0=",
                filename: "goodbye.json",
            });
            expect(evidenceCollection.getEvidence("CYP-123")).to.deep.eq([
                {
                    contentType: "application/json",
                    data: "WyJoZWxsbyJd",
                    filename: "hello.json",
                },
                {
                    contentType: "application/json",
                    data: "WyJnb29kYnllIl0=",
                    filename: "goodbye.json",
                },
            ]);
        });

        it("collects evidence for multiple tests", () => {
            const evidenceCollection = new SimpleEvidenceCollection();
            evidenceCollection.addEvidence("CYP-123", {
                contentType: "application/json",
                data: "WyJoZWxsbyJd",
                filename: "hello.json",
            });
            evidenceCollection.addEvidence("CYP-456", {
                contentType: "application/json",
                data: "WyJnb29kYnllIl0=",
                filename: "goodbye.json",
            });
            expect(evidenceCollection.getEvidence("CYP-123")).to.deep.eq([
                {
                    contentType: "application/json",
                    data: "WyJoZWxsbyJd",
                    filename: "hello.json",
                },
            ]);
            expect(evidenceCollection.getEvidence("CYP-456")).to.deep.eq([
                {
                    contentType: "application/json",
                    data: "WyJnb29kYnllIl0=",
                    filename: "goodbye.json",
                },
            ]);
        });

        it("returns an empty array for unknown tests", () => {
            const evidenceCollection = new SimpleEvidenceCollection();
            evidenceCollection.addEvidence("CYP-123", {
                contentType: "application/json",
                data: "WyJoZWxsbyJd",
                filename: "hello.json",
            });
            expect(evidenceCollection.getEvidence("CYP-456")).to.deep.eq([]);
        });
    });

    describe(PluginContext.name, () => {
        let context: PluginContext;

        beforeEach(() => {
            const jiraClient = new BaseJiraClient(
                "https://example.org",
                new PatCredentials("token"),
                getMockedRestClient()
            );
            const xrayClient = new ServerClient(
                "https://example.org",
                new PatCredentials("token"),
                getMockedRestClient()
            );
            context = new PluginContext(
                {
                    jiraClient: jiraClient,
                    kind: "server",
                    xrayClient: xrayClient,
                },
                {
                    http: {},
                    jira: {
                        attachVideos: false,
                        fields: {},
                        projectKey: "CYP",
                        testExecutionIssueType: "Test Execution",
                        testPlanIssueType: "Test Plan",
                        url: "https://example.org",
                    },
                    plugin: {
                        debug: false,
                        enabled: true,
                        logDirectory: "./logs",
                        normalizeScreenshotNames: false,
                    },
                    xray: {
                        status: {},
                        uploadResults: false,
                        uploadScreenshots: false,
                    },
                },
                {} as Cypress.PluginConfigOptions,
                new SimpleEvidenceCollection(),
                new ExecutableGraph(),
                new CapturingLogger()
            );
        });

        it("collects evidence for single tests", () => {
            context.addEvidence("CYP-123", {
                contentType: "application/json",
                data: "WyJoZWxsbyJd",
                filename: "hello.json",
            });
            context.addEvidence("CYP-123", {
                contentType: "application/json",
                data: "WyJnb29kYnllIl0=",
                filename: "goodbye.json",
            });
            expect(context.getEvidence("CYP-123")).to.deep.eq([
                {
                    contentType: "application/json",
                    data: "WyJoZWxsbyJd",
                    filename: "hello.json",
                },
                {
                    contentType: "application/json",
                    data: "WyJnb29kYnllIl0=",
                    filename: "goodbye.json",
                },
            ]);
        });

        it("collects evidence for multiple tests", () => {
            const evidenceCollection = new SimpleEvidenceCollection();
            evidenceCollection.addEvidence("CYP-123", {
                contentType: "application/json",
                data: "WyJoZWxsbyJd",
                filename: "hello.json",
            });
            evidenceCollection.addEvidence("CYP-456", {
                contentType: "application/json",
                data: "WyJnb29kYnllIl0=",
                filename: "goodbye.json",
            });
            expect(evidenceCollection.getEvidence("CYP-123")).to.deep.eq([
                {
                    contentType: "application/json",
                    data: "WyJoZWxsbyJd",
                    filename: "hello.json",
                },
            ]);
            expect(evidenceCollection.getEvidence("CYP-456")).to.deep.eq([
                {
                    contentType: "application/json",
                    data: "WyJnb29kYnllIl0=",
                    filename: "goodbye.json",
                },
            ]);
        });

        it("returns an empty array for unknown tests", () => {
            const evidenceCollection = new SimpleEvidenceCollection();
            evidenceCollection.addEvidence("CYP-123", {
                contentType: "application/json",
                data: "WyJoZWxsbyJd",
                filename: "hello.json",
            });
            expect(evidenceCollection.getEvidence("CYP-456")).to.deep.eq([]);
        });
    });
});
