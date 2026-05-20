import axios, { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import { stub } from "../../test/mocks";
import {
    BasicAuthCredentials,
    JwtCredentials,
    PatCredentials,
} from "../client/authentication/credentials";
import { AxiosRestClient } from "../client/https/requests";
import { JiraClientCloud } from "../client/jira/jira-client-cloud";
import { JiraClientServer } from "../client/jira/jira-client-server";
import { XrayClientCloud } from "../client/xray/xray-client-cloud";
import { XrayClientServer } from "../client/xray/xray-client-server";
import type {
    InternalCucumberOptions,
    InternalHttpOptions,
    InternalJiraOptions,
    InternalPluginOptions,
    InternalXrayOptions,
    XrayOptions,
} from "../models/plugin";
import globalContext, { SimpleEvidenceCollection } from "../plugin/context";
import { dedent } from "../util/dedent";
import dependencies from "../util/dependencies";
import type { Level } from "../util/logging";
import { LOG } from "../util/logging";

void describe(relative(cwd(), __filename), () => {
    void describe("the plugin context configuration", () => {
        void describe("the option initialization", () => {
            void describe("should have certain default values", () => {
                void describe("jira", () => {
                    const jiraOptions: InternalJiraOptions = globalContext.initJiraOptions(
                        {},
                        {
                            projectKey: "PRJ",
                            url: "http://localhost:1234",
                        }
                    );
                    void it("attachVideos", () => {
                        assert.strictEqual(jiraOptions.attachVideos, false);
                    });
                    void describe("fields", () => {
                        void it("description", () => {
                            assert.strictEqual(jiraOptions.fields.description, undefined);
                        });
                        void it("labels", () => {
                            assert.strictEqual(jiraOptions.fields.labels, undefined);
                        });
                        void it("summary", () => {
                            assert.strictEqual(jiraOptions.fields.summary, undefined);
                        });
                        void it("testEnvironments", () => {
                            assert.strictEqual(jiraOptions.fields.testEnvironments, undefined);
                        });
                        void it("testPlan", () => {
                            assert.strictEqual(jiraOptions.fields.testPlan, undefined);
                        });
                    });
                    void it("testExecutionIssue", () => {
                        assert.strictEqual(jiraOptions.testExecutionIssue, undefined);
                    });
                    void it("testExecutionIssueDescription", () => {
                        assert.strictEqual(jiraOptions.testExecutionIssueDescription, undefined);
                    });
                    void it("testExecutionIssueKey", () => {
                        assert.strictEqual(jiraOptions.testExecutionIssueKey, undefined);
                    });
                    void it("testExecutionIssueSummary", () => {
                        assert.strictEqual(jiraOptions.testExecutionIssueSummary, undefined);
                    });
                    void it("testExecutionIssueType", () => {
                        assert.strictEqual(jiraOptions.testExecutionIssueType, "Test Execution");
                    });
                    void it("testPlanIssueKey", () => {
                        assert.strictEqual(jiraOptions.testPlanIssueKey, undefined);
                    });
                    void it("testPlanIssueType", () => {
                        assert.strictEqual(jiraOptions.testPlanIssueType, "Test Plan");
                    });
                });

                void describe("plugin", () => {
                    const pluginOptions: InternalPluginOptions = globalContext.initPluginOptions(
                        {},
                        {}
                    );
                    void it("debug", () => {
                        assert.strictEqual(pluginOptions.debug, false);
                    });
                    void it("enabled", () => {
                        assert.strictEqual(pluginOptions.enabled, true);
                    });
                    void it("logDirectory", () => {
                        assert.strictEqual(pluginOptions.logDirectory, "logs");
                    });
                    void it("normalizeScreenshotNames", () => {
                        assert.strictEqual(pluginOptions.normalizeScreenshotNames, false);
                    });
                    void it("uploadLastAttempt", () => {
                        assert.strictEqual(pluginOptions.uploadLastAttempt, false);
                    });
                    void it("splitUpload", () => {
                        assert.strictEqual(pluginOptions.splitUpload, false);
                    });
                });

                void describe("xray", () => {
                    const xrayOptions: InternalXrayOptions = globalContext.initXrayOptions({}, {});
                    void describe("status", () => {
                        void it("failed", () => {
                            assert.strictEqual(xrayOptions.status.failed, undefined);
                        });
                        void it("passed", () => {
                            assert.strictEqual(xrayOptions.status.passed, undefined);
                        });
                        void it("pending", () => {
                            assert.strictEqual(xrayOptions.status.pending, undefined);
                        });
                        void it("skipped", () => {
                            assert.strictEqual(xrayOptions.status.skipped, undefined);
                        });
                        void describe("step", () => {
                            void it("failed", () => {
                                assert.strictEqual(xrayOptions.status.step?.failed, undefined);
                            });
                            void it("passed", () => {
                                assert.strictEqual(xrayOptions.status.step?.passed, undefined);
                            });
                            void it("pending", () => {
                                assert.strictEqual(xrayOptions.status.step?.pending, undefined);
                            });
                            void it("skipped", () => {
                                assert.strictEqual(xrayOptions.status.step?.skipped, undefined);
                            });
                        });
                    });
                    void it("testEnvironments", () => {
                        assert.strictEqual(xrayOptions.testEnvironments, undefined);
                    });
                    void it("uploadResults", () => {
                        assert.strictEqual(xrayOptions.uploadResults, true);
                    });
                    void it("uploadScreenshots", () => {
                        assert.strictEqual(xrayOptions.uploadScreenshots, true);
                    });
                });

                void describe("cucumber", () => {
                    let cucumberOptions: InternalCucumberOptions | undefined = undefined;
                    beforeEach(async () => {
                        cucumberOptions = await globalContext.initCucumberOptions(
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
                    void it("downloadFeatures", () => {
                        assert.strictEqual(cucumberOptions?.downloadFeatures, false);
                    });

                    void describe("prefixes", () => {
                        void it("precondition", () => {
                            assert.strictEqual(cucumberOptions?.prefixes.precondition, undefined);
                        });
                        void it("test", () => {
                            assert.strictEqual(cucumberOptions?.prefixes.test, undefined);
                        });
                    });
                    void it("uploadFeatures", () => {
                        assert.strictEqual(cucumberOptions?.uploadFeatures, false);
                    });
                });
            });
            void describe("should prefer provided values over default ones", () => {
                void describe("jira", () => {
                    void it("attachVideos", () => {
                        const jiraOptions = globalContext.initJiraOptions(
                            {},
                            {
                                attachVideos: true,
                                projectKey: "PRJ",
                                url: "http://localhost:1234",
                            }
                        );
                        assert.strictEqual(jiraOptions.attachVideos, true);
                    });
                    void describe("fields", () => {
                        void it("description", () => {
                            const jiraOptions = globalContext.initJiraOptions(
                                {},
                                {
                                    fields: {
                                        description: "Beschreibung",
                                    },
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                }
                            );
                            assert.strictEqual(jiraOptions.fields.description, "Beschreibung");
                        });
                        void it("labels", () => {
                            const jiraOptions = globalContext.initJiraOptions(
                                {},
                                {
                                    fields: {
                                        labels: "Stichworte",
                                    },
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                }
                            );
                            assert.strictEqual(jiraOptions.fields.labels, "Stichworte");
                        });
                        void it("summary", () => {
                            const jiraOptions = globalContext.initJiraOptions(
                                {},
                                {
                                    fields: {
                                        summary: "Résumé",
                                    },
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                }
                            );
                            assert.strictEqual(jiraOptions.fields.summary, "Résumé");
                        });
                        void it("testEnvironments", () => {
                            const jiraOptions = globalContext.initJiraOptions(
                                {},
                                {
                                    fields: {
                                        testEnvironments: "Testumgebungen",
                                    },
                                    projectKey: "PRJ",
                                    url: "http://localhost:1234",
                                }
                            );
                            assert.strictEqual(
                                jiraOptions.fields.testEnvironments,
                                "Testumgebungen"
                            );
                        });
                        void it("testPlan", () => {
                            const jiraOptions = globalContext.initJiraOptions(
                                {},
                                {
                                    fields: {
                                        testPlan: "Plan de Test",
                                    },
                                    projectKey: "PRJ",
                                    url: "http://localhost:1234",
                                }
                            );
                            assert.strictEqual(jiraOptions.fields.testPlan, "Plan de Test");
                        });
                    });
                    void it("testExecutionIssue", () => {
                        const jiraOptions = globalContext.initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                testExecutionIssue: { fields: { summary: "hello" } },
                                url: "http://localhost:1234",
                            }
                        );
                        assert.deepStrictEqual(jiraOptions.testExecutionIssue, {
                            fields: { summary: "hello" },
                        });
                    });
                    void it("testExecutionIssueDescription", () => {
                        const jiraOptions = globalContext.initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                testExecutionIssueDescription: "hello",
                                url: "https://example.org",
                            }
                        );
                        assert.strictEqual(jiraOptions.testExecutionIssueDescription, "hello");
                    });
                    void it("testExecutionIssueKey", () => {
                        const jiraOptions = globalContext.initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                testExecutionIssueKey: "PRJ-123",
                                url: "https://example.org",
                            }
                        );
                        assert.strictEqual(jiraOptions.testExecutionIssueKey, "PRJ-123");
                    });
                    void it("testExecutionIssueSummary", () => {
                        const jiraOptions = globalContext.initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                testExecutionIssueSummary: "Test - Login",
                                url: "https://example.org",
                            }
                        );
                        assert.strictEqual(jiraOptions.testExecutionIssueSummary, "Test - Login");
                    });
                    void it("testExecutionIssueType", () => {
                        const jiraOptions = globalContext.initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                testExecutionIssueType: "Execution Ticket",
                                url: "https://example.org",
                            }
                        );
                        assert.strictEqual(jiraOptions.testExecutionIssueType, "Execution Ticket");
                    });
                    void it("testPlanIssueKey", () => {
                        const jiraOptions = globalContext.initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                testPlanIssueKey: "PRJ-456",
                                url: "http://localhost:1234",
                            }
                        );
                        assert.strictEqual(jiraOptions.testPlanIssueKey, "PRJ-456");
                    });
                    void it("testPlanIssueType", () => {
                        const jiraOptions = globalContext.initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                testPlanIssueType: "Plan Ticket",
                                url: "https://example.org",
                            }
                        );
                        assert.strictEqual(jiraOptions.testPlanIssueType, "Plan Ticket");
                    });
                    void it("url", () => {
                        const jiraOptions = globalContext.initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                url: "http://localhost:1234",
                            }
                        );
                        assert.strictEqual(jiraOptions.url, "http://localhost:1234");
                    });
                });

                void describe("plugin", () => {
                    void it("debug", () => {
                        const pluginOptions = globalContext.initPluginOptions(
                            {},
                            {
                                debug: true,
                            }
                        );
                        assert.strictEqual(pluginOptions.debug, true);
                    });
                    void it("enabled", () => {
                        const pluginOptions = globalContext.initPluginOptions(
                            {},
                            {
                                enabled: false,
                            }
                        );
                        assert.strictEqual(pluginOptions.enabled, false);
                    });
                    void it("logDirectory", () => {
                        const pluginOptions = globalContext.initPluginOptions(
                            {},
                            {
                                logDirectory: "./logs/",
                            }
                        );
                        assert.strictEqual(pluginOptions.logDirectory, "./logs/");
                    });
                    void it("logger", () => {
                        const logger = (level: Level, ...text: string[]) => {
                            console.log(level, ...text);
                        };
                        const pluginOptions = globalContext.initPluginOptions(
                            {},
                            {
                                logger,
                            }
                        );
                        assert.strictEqual(pluginOptions.logger, logger);
                    });
                    void it("normalizeScreenshotNames", () => {
                        const pluginOptions = globalContext.initPluginOptions(
                            {},
                            {
                                normalizeScreenshotNames: true,
                            }
                        );
                        assert.strictEqual(pluginOptions.normalizeScreenshotNames, true);
                    });
                    void it("uploadLastAttempt", () => {
                        const pluginOptions = globalContext.initPluginOptions(
                            {},
                            {
                                uploadLastAttempt: true,
                            }
                        );
                        assert.strictEqual(pluginOptions.uploadLastAttempt, true);
                    });
                    void it("splitUpload", () => {
                        const pluginOptions = globalContext.initPluginOptions(
                            {},
                            {
                                splitUpload: true,
                            }
                        );
                        assert.strictEqual(pluginOptions.splitUpload, true);
                    });
                });

                void describe("xray", () => {
                    void describe("status", () => {
                        void it("aggregate", () => {
                            const aggregateFunction: Exclude<
                                XrayOptions["status"],
                                undefined
                            >["aggregate"] = stub();
                            const xrayOptions = globalContext.initXrayOptions(
                                {},
                                {
                                    status: {
                                        aggregate: aggregateFunction,
                                    },
                                }
                            );
                            assert.strictEqual(xrayOptions.status.aggregate, aggregateFunction);
                        });
                        void it("failed", () => {
                            const xrayOptions = globalContext.initXrayOptions(
                                {},
                                {
                                    status: {
                                        failed: "BAD",
                                    },
                                }
                            );
                            assert.strictEqual(xrayOptions.status.failed, "BAD");
                        });
                        void it("passed", () => {
                            const xrayOptions = globalContext.initXrayOptions(
                                {},
                                {
                                    status: {
                                        passed: "GOOD",
                                    },
                                }
                            );
                            assert.strictEqual(xrayOptions.status.passed, "GOOD");
                        });
                        void it("pending", () => {
                            const xrayOptions = globalContext.initXrayOptions(
                                {},
                                {
                                    status: {
                                        pending: "PENDULUM",
                                    },
                                }
                            );
                            assert.strictEqual(xrayOptions.status.pending, "PENDULUM");
                        });
                        void it("skipped", () => {
                            const xrayOptions = globalContext.initXrayOptions(
                                {},
                                {
                                    status: {
                                        skipped: "SKIPPING STONE",
                                    },
                                }
                            );
                            assert.strictEqual(xrayOptions.status.skipped, "SKIPPING STONE");
                        });
                        void describe("step", () => {
                            void it("failed", () => {
                                const xrayOptions = globalContext.initXrayOptions(
                                    {},
                                    {
                                        status: {
                                            step: {
                                                failed: "BAD",
                                            },
                                        },
                                    }
                                );
                                assert.strictEqual(xrayOptions.status.step?.failed, "BAD");
                            });
                            void it("passed", () => {
                                const xrayOptions = globalContext.initXrayOptions(
                                    {},
                                    {
                                        status: {
                                            step: {
                                                passed: "GOOD",
                                            },
                                        },
                                    }
                                );
                                assert.strictEqual(xrayOptions.status.step?.passed, "GOOD");
                            });
                            void it("pending", () => {
                                const xrayOptions = globalContext.initXrayOptions(
                                    {},
                                    {
                                        status: {
                                            step: {
                                                pending: "PENDULUM",
                                            },
                                        },
                                    }
                                );
                                assert.strictEqual(xrayOptions.status.step?.pending, "PENDULUM");
                            });
                            void it("skipped", () => {
                                const xrayOptions = globalContext.initXrayOptions(
                                    {},
                                    {
                                        status: {
                                            step: {
                                                skipped: "SKIPPING STONE",
                                            },
                                        },
                                    }
                                );
                                assert.strictEqual(
                                    xrayOptions.status.step?.skipped,
                                    "SKIPPING STONE"
                                );
                            });
                        });
                    });

                    void it("testEnvironments", () => {
                        const xrayOptions = globalContext.initXrayOptions(
                            {},
                            {
                                testEnvironments: ["Test", "Prod"],
                            }
                        );
                        assert.deepStrictEqual(xrayOptions.testEnvironments, ["Test", "Prod"]);
                    });

                    void it("uploadResults", () => {
                        const xrayOptions = globalContext.initXrayOptions(
                            {},
                            {
                                uploadResults: false,
                            }
                        );
                        assert.strictEqual(xrayOptions.uploadResults, false);
                    });

                    void it("uploadScreenshots", () => {
                        const xrayOptions = globalContext.initXrayOptions(
                            {},
                            {
                                uploadScreenshots: false,
                            }
                        );
                        assert.strictEqual(xrayOptions.uploadScreenshots, false);
                    });

                    void it("url", () => {
                        const xrayOptions = globalContext.initXrayOptions(
                            {},
                            {
                                url: "https://example.org",
                            }
                        );
                        assert.strictEqual(xrayOptions.url, "https://example.org");
                    });
                });

                void describe("cucumber", () => {
                    void it("downloadFeatures", async () => {
                        const cucumberOptions = await globalContext.initCucumberOptions(
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
                        assert.strictEqual(cucumberOptions?.downloadFeatures, true);
                    });
                    void describe("prefixes", () => {
                        void it("precondition", async () => {
                            const cucumberOptions = await globalContext.initCucumberOptions(
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
                            assert.strictEqual(
                                cucumberOptions?.prefixes.precondition,
                                "PreconditionYeah_"
                            );
                        });
                        void it("test", async () => {
                            const cucumberOptions = await globalContext.initCucumberOptions(
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
                            assert.strictEqual(cucumberOptions?.prefixes.test, "TestSomething_");
                        });
                    });
                    void it("uploadFeatures", async () => {
                        const cucumberOptions = await globalContext.initCucumberOptions(
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
                        assert.strictEqual(cucumberOptions?.uploadFeatures, true);
                    });
                });
            });
            void describe("should prefer environment variables over provided values", () => {
                void describe("jira", () => {
                    void it("JIRA_PROJECT_KEY", () => {
                        const env = {
                            ["JIRA_PROJECT_KEY"]: "ABC",
                        };
                        const jiraOptions = globalContext.initJiraOptions(env, {
                            projectKey: "CYP",
                            url: "http://localhost:1234",
                        });
                        assert.strictEqual(jiraOptions.projectKey, "ABC");
                    });

                    void it("JIRA_ATTACH_VIDEOS", () => {
                        const env = {
                            ["JIRA_ATTACH_VIDEOS"]: "true",
                        };
                        const jiraOptions = globalContext.initJiraOptions(env, {
                            attachVideos: false,
                            projectKey: "CYP",
                            url: "http://localhost:1234",
                        });
                        assert.strictEqual(jiraOptions.attachVideos, true);
                    });

                    void describe("fields", () => {
                        void it("JIRA_FIELDS_DESCRIPTION", () => {
                            const env = {
                                ["JIRA_FIELDS_DESCRIPTION"]: "customfield_98765",
                            };
                            const jiraOptions = globalContext.initJiraOptions(env, {
                                fields: {
                                    description: "customfield_12345",
                                },
                                projectKey: "PRJ",
                                url: "https://example.org",
                            });
                            assert.strictEqual(jiraOptions.fields.description, "customfield_98765");
                        });
                        void it("JIRA_FIELDS_LABELS", () => {
                            const env = {
                                ["JIRA_FIELDS_LABELS"]: "customfield_98765",
                            };
                            const jiraOptions = globalContext.initJiraOptions(env, {
                                fields: {
                                    labels: "customfield_12345",
                                },
                                projectKey: "PRJ",
                                url: "https://example.org",
                            });
                            assert.strictEqual(jiraOptions.fields.labels, "customfield_98765");
                        });
                        void it("JIRA_FIELDS_SUMMARY", () => {
                            const env = {
                                ["JIRA_FIELDS_SUMMARY"]: "customfield_98765",
                            };
                            const jiraOptions = globalContext.initJiraOptions(env, {
                                fields: {
                                    summary: "customfield_12345",
                                },
                                projectKey: "PRJ",
                                url: "https://example.org",
                            });
                            assert.strictEqual(jiraOptions.fields.summary, "customfield_98765");
                        });
                        void it("JIRA_FIELDS_TEST_ENVIRONMENTS", () => {
                            const env = {
                                ["JIRA_FIELDS_TEST_ENVIRONMENTS"]: "customfield_98765",
                            };
                            const jiraOptions = globalContext.initJiraOptions(env, {
                                fields: {
                                    testEnvironments: "customfield_12345",
                                },
                                projectKey: "PRJ",
                                url: "http://localhost:1234",
                            });
                            assert.strictEqual(
                                jiraOptions.fields.testEnvironments,
                                "customfield_98765"
                            );
                        });

                        void it("JIRA_FIELDS_TEST_PLAN", () => {
                            const env = {
                                ["JIRA_FIELDS_TEST_PLAN"]: "customfield_98765",
                            };
                            const jiraOptions = globalContext.initJiraOptions(env, {
                                fields: {
                                    testPlan: "customfield_12345",
                                },
                                projectKey: "PRJ",
                                url: "http://localhost:1234",
                            });
                            assert.strictEqual(jiraOptions.fields.testPlan, "customfield_98765");
                        });
                    });

                    void it("JIRA_TEST_EXECUTION_ISSUE", () => {
                        const env = {
                            ["JIRA_TEST_EXECUTION_ISSUE"]: {
                                fields: {
                                    ["customfield_12345"]: "Jeff",
                                    summary: "Hello bonjour",
                                },
                            },
                        };
                        const jiraOptions = globalContext.initJiraOptions(env, {
                            projectKey: "CYP",
                            testExecutionIssue: {
                                fields: {
                                    description: "hey",
                                },
                            },
                            url: "http://localhost:1234",
                        });
                        assert.deepStrictEqual(jiraOptions.testExecutionIssue, {
                            fields: {
                                ["customfield_12345"]: "Jeff",
                                summary: "Hello bonjour",
                            },
                        });
                    });

                    void it("JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION", () => {
                        const env = {
                            ["JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION"]: "Good morning",
                        };
                        const jiraOptions = globalContext.initJiraOptions(env, {
                            projectKey: "CYP",
                            testExecutionIssueDescription: "Goodbye",
                            url: "https://example.org",
                        });
                        assert.strictEqual(
                            jiraOptions.testExecutionIssueDescription,
                            "Good morning"
                        );
                    });

                    void it("JIRA_TEST_EXECUTION_ISSUE_KEY", () => {
                        const env = {
                            ["JIRA_TEST_EXECUTION_ISSUE_KEY"]: "CYP-123",
                        };
                        const jiraOptions = globalContext.initJiraOptions(env, {
                            projectKey: "CYP",
                            testExecutionIssueKey: "CYP-789",
                            url: "https://example.org",
                        });
                        assert.strictEqual(jiraOptions.testExecutionIssueKey, "CYP-123");
                    });

                    void it("JIRA_TEST_EXECUTION_ISSUE_SUMMARY", () => {
                        const env = {
                            ["JIRA_TEST_EXECUTION_ISSUE_SUMMARY"]: "Some test case",
                        };
                        const jiraOptions = globalContext.initJiraOptions(env, {
                            projectKey: "CYP",
                            testExecutionIssueSummary: "Summarini",
                            url: "https://example.org",
                        });
                        assert.strictEqual(jiraOptions.testExecutionIssueSummary, "Some test case");
                    });

                    void it("JIRA_TEST_EXECUTION_ISSUE_TYPE", () => {
                        const env = {
                            ["JIRA_TEST_EXECUTION_ISSUE_TYPE"]: "Execution Issue",
                        };
                        const jiraOptions = globalContext.initJiraOptions(env, {
                            projectKey: "CYP",
                            testExecutionIssueType: "Execution",
                            url: "https://example.org",
                        });
                        assert.strictEqual(jiraOptions.testExecutionIssueType, "Execution Issue");
                    });

                    void it("JIRA_TEST_PLAN_ISSUE_KEY", () => {
                        const env = {
                            ["JIRA_TEST_PLAN_ISSUE_KEY"]: "CYP-456",
                        };
                        const jiraOptions = globalContext.initJiraOptions(env, {
                            projectKey: "CYP",
                            testPlanIssueKey: "CYP-123",
                            url: "https://example.org",
                        });
                        assert.strictEqual(jiraOptions.testPlanIssueKey, "CYP-456");
                    });

                    void it("JIRA_TEST_PLAN_ISSUE_TYPE", () => {
                        const env = {
                            ["JIRA_TEST_PLAN_ISSUE_TYPE"]: "Plan Issue",
                        };
                        const jiraOptions = globalContext.initJiraOptions(env, {
                            projectKey: "CYP",
                            testExecutionIssueType: "Plan",
                            url: "https://example.org",
                        });
                        assert.strictEqual(jiraOptions.testPlanIssueType, "Plan Issue");
                    });

                    void it("JIRA_TEST_PLAN_ISSUE_KEY", () => {
                        const env = {
                            ["JIRA_TEST_PLAN_ISSUE_KEY"]: "CYP-456",
                        };
                        const jiraOptions = globalContext.initJiraOptions(env, {
                            projectKey: "CYP",
                            testPlanIssueKey: "CYP-123",
                            url: "http://localhost:1234",
                        });
                        assert.strictEqual(jiraOptions.testPlanIssueKey, "CYP-456");
                    });

                    void it("JIRA_URL", () => {
                        const env = {
                            ["JIRA_URL"]: "http://localhost:1234",
                        };
                        const jiraOptions = globalContext.initJiraOptions(env, {
                            projectKey: "CYP",
                            url: "https://some.domain.org",
                        });
                        assert.strictEqual(jiraOptions.url, "http://localhost:1234");
                    });
                });
                void describe("xray", () => {
                    void it("XRAY_STATUS_FAILED", () => {
                        const env = {
                            ["XRAY_STATUS_FAILED"]: "no",
                        };
                        const xrayOptions = globalContext.initXrayOptions(env, {
                            status: {
                                failed: "ERROR",
                            },
                        });
                        assert.strictEqual(xrayOptions.status.failed, "no");
                    });

                    void it("XRAY_STATUS_PASSED", () => {
                        const env = {
                            ["XRAY_STATUS_PASSED"]: "ok",
                        };
                        const xrayOptions = globalContext.initXrayOptions(env, {
                            status: {
                                passed: "FLYBY",
                            },
                        });
                        assert.strictEqual(xrayOptions.status.passed, "ok");
                    });

                    void it("XRAY_STATUS_PENDING", () => {
                        const env = {
                            ["XRAY_STATUS_PENDING"]: "pendulum",
                        };
                        const xrayOptions = globalContext.initXrayOptions(env, {
                            status: {
                                pending: "PENCIL",
                            },
                        });
                        assert.strictEqual(xrayOptions.status.pending, "pendulum");
                    });

                    void it("XRAY_STATUS_SKIPPED", () => {
                        const env = {
                            ["XRAY_STATUS_SKIPPED"]: "ski-ba-bop-ba-dop-bop",
                        };
                        const xrayOptions = globalContext.initXrayOptions(env, {
                            status: {
                                skipped: "HOP",
                            },
                        });
                        assert.strictEqual(xrayOptions.status.skipped, "ski-ba-bop-ba-dop-bop");
                    });

                    void it("XRAY_STATUS_STEP_FAILED", () => {
                        const env = {
                            ["XRAY_STATUS_STEP_FAILED"]: "no",
                        };
                        const xrayOptions = globalContext.initXrayOptions(env, {
                            status: {
                                step: {
                                    failed: "ERROR",
                                },
                            },
                        });
                        assert.strictEqual(xrayOptions.status.step?.failed, "no");
                    });

                    void it("XRAY_STATUS_STEP_PASSED", () => {
                        const env = {
                            ["XRAY_STATUS_STEP_PASSED"]: "ok",
                        };
                        const xrayOptions = globalContext.initXrayOptions(env, {
                            status: {
                                step: { passed: "FLYBY" },
                            },
                        });
                        assert.strictEqual(xrayOptions.status.step?.passed, "ok");
                    });

                    void it("XRAY_STATUS_STEP_PENDING", () => {
                        const env = {
                            ["XRAY_STATUS_STEP_PENDING"]: "pendulum",
                        };
                        const xrayOptions = globalContext.initXrayOptions(env, {
                            status: {
                                step: { pending: "PENCIL" },
                            },
                        });
                        assert.strictEqual(xrayOptions.status.step?.pending, "pendulum");
                    });

                    void it("XRAY_STATUS_STEP_SKIPPED", () => {
                        const env = {
                            ["XRAY_STATUS_STEP_SKIPPED"]: "ski-ba-bop-ba-dop-bop",
                        };
                        const xrayOptions = globalContext.initXrayOptions(env, {
                            status: {
                                step: { skipped: "HOP" },
                            },
                        });
                        assert.strictEqual(
                            xrayOptions.status.step?.skipped,
                            "ski-ba-bop-ba-dop-bop"
                        );
                    });

                    void it("XRAY_TEST_ENVIRONMENTS", () => {
                        const env = {
                            ["XRAY_TEST_ENVIRONMENTS"]: [false, "bonjour", 5],
                        };
                        const xrayOptions = globalContext.initXrayOptions(env, {
                            testEnvironments: ["A", "B", "C"],
                        });
                        assert.deepStrictEqual(xrayOptions.testEnvironments, [
                            "false",
                            "bonjour",
                            "5",
                        ]);
                    });

                    void it("XRAY_UPLOAD_RESULTS", () => {
                        const env = {
                            ["XRAY_UPLOAD_RESULTS"]: "false",
                        };
                        const xrayOptions = globalContext.initXrayOptions(env, {
                            uploadResults: true,
                        });
                        assert.strictEqual(xrayOptions.uploadResults, false);
                    });

                    void it("XRAY_UPLOAD_SCREENSHOTS", () => {
                        const env = {
                            ["XRAY_UPLOAD_SCREENSHOTS"]: "false",
                        };
                        const xrayOptions = globalContext.initXrayOptions(env, {
                            uploadScreenshots: true,
                        });
                        assert.strictEqual(xrayOptions.uploadScreenshots, false);
                    });

                    void it("XRAY_URL", () => {
                        const env = {
                            ["XRAY_URL"]: "https://example.org",
                        };
                        const xrayOptions = globalContext.initXrayOptions(env, {
                            url: "http://localhost",
                        });
                        assert.strictEqual(xrayOptions.url, "https://example.org");
                    });
                });
                void describe("cucumber", () => {
                    void it("CUCUMBER_FEATURE_FILE_EXTENSION", async () => {
                        const cucumberOptions = await globalContext.initCucumberOptions(
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
                        assert.strictEqual(cucumberOptions?.featureFileExtension, ".feature.file");
                    });

                    void it("CUCUMBER_DOWNLOAD_FEATURES", async () => {
                        const cucumberOptions = await globalContext.initCucumberOptions(
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
                        assert.strictEqual(cucumberOptions?.downloadFeatures, true);
                    });

                    void it("CUCUMBER_PREFIXES_PRECONDITION", async () => {
                        const cucumberOptions = await globalContext.initCucumberOptions(
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
                        assert.strictEqual(
                            cucumberOptions?.prefixes.precondition,
                            "BigPrecondition:"
                        );
                    });

                    void it("CUCUMBER_PREFIXES_TEST", async () => {
                        const cucumberOptions = await globalContext.initCucumberOptions(
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
                        assert.strictEqual(cucumberOptions?.prefixes.test, "BigTest:");
                    });

                    void it("CUCUMBER_UPLOAD_FEATURES", async () => {
                        const cucumberOptions = await globalContext.initCucumberOptions(
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
                        assert.strictEqual(cucumberOptions?.uploadFeatures, true);
                    });
                });
                void describe("plugin", () => {
                    void it("PLUGIN_DEBUG", () => {
                        const env = {
                            ["PLUGIN_DEBUG"]: "true",
                        };
                        const pluginOptions = globalContext.initPluginOptions(env, {
                            debug: false,
                        });
                        assert.strictEqual(pluginOptions.debug, true);
                    });

                    void it("PLUGIN_ENABLED", () => {
                        const env = {
                            ["PLUGIN_ENABLED"]: "false",
                        };
                        const pluginOptions = globalContext.initPluginOptions(env, {
                            enabled: true,
                        });
                        assert.strictEqual(pluginOptions.enabled, false);
                    });

                    // https://github.com/csvtuda/cypress-xray-plugin/issues/50
                    // E.g.: npx cypress run --env PLUGIN_ENABLED=false
                    void it("PLUGIN_ENABLED (actual boolean)", () => {
                        const env = {
                            ["PLUGIN_ENABLED"]: false,
                        };
                        const pluginOptions = globalContext.initPluginOptions(env, {
                            enabled: true,
                        });
                        assert.strictEqual(pluginOptions.enabled, false);
                    });

                    void it("PLUGIN_LOG_DIRECTORY", () => {
                        const env = {
                            ["PLUGIN_LOG_DIRECTORY"]: "/home/logs/cypress-xray-plugin",
                        };
                        const pluginOptions = globalContext.initPluginOptions(env, {
                            logDirectory: "./logging/subdirectory",
                        });
                        assert.strictEqual(
                            pluginOptions.logDirectory,
                            "/home/logs/cypress-xray-plugin"
                        );
                    });

                    void it("PLUGIN_NORMALIZE_SCREENSHOT_NAMES", () => {
                        const env = {
                            ["PLUGIN_NORMALIZE_SCREENSHOT_NAMES"]: "true",
                        };
                        const pluginOptions = globalContext.initPluginOptions(env, {
                            normalizeScreenshotNames: false,
                        });
                        assert.strictEqual(pluginOptions.normalizeScreenshotNames, true);
                    });

                    void it("PLUGIN_UPLOAD_LAST_ATTEMPT", () => {
                        const env = {
                            ["PLUGIN_UPLOAD_LAST_ATTEMPT"]: "true",
                        };
                        const pluginOptions = globalContext.initPluginOptions(env, {
                            uploadLastAttempt: false,
                        });
                        assert.strictEqual(pluginOptions.uploadLastAttempt, true);
                    });

                    void it("PLUGIN_SPLIT_UPLOAD", () => {
                        const env = {
                            ["PLUGIN_SPLIT_UPLOAD"]: "true",
                        };
                        const pluginOptions = globalContext.initPluginOptions(env, {
                            splitUpload: false,
                        });
                        assert.strictEqual(pluginOptions.splitUpload, true);
                    });
                });
            });
            void describe("detects invalid configurations", () => {
                void it("detects unset project keys", () => {
                    assert.throws(
                        () =>
                            globalContext.initJiraOptions(
                                {},
                                {
                                    projectKey: undefined as unknown as string,
                                    url: "http://localhost:1234",
                                }
                            ),
                        { message: "Plugin misconfiguration: Jira project key was not set" }
                    );
                });
                void it("throws if the cucumber preprocessor is not installed", async (context) => {
                    context.mock.method(dependencies, "_import", () => {
                        throw new Error("Failed to import package");
                    });
                    await assert.rejects(
                        globalContext.initCucumberOptions(
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
                        ),
                        {
                            message: dedent(`
                                Plugin dependency misconfigured: @badeball/cypress-cucumber-preprocessor

                                Failed to import package

                                The plugin depends on the package and should automatically download it during installation, but might have failed to do so because of conflicting Node versions

                                Make sure to install the package manually using: npm install @badeball/cypress-cucumber-preprocessor --save-dev
                            `),
                        }
                    );
                });
                void it("detects if the cucumber preprocessor json report is not enabled", async () => {
                    await assert.rejects(
                        globalContext.initCucumberOptions(
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
                        ),
                        {
                            message: dedent(`
                                Plugin misconfiguration: Cucumber preprocessor JSON report disabled

                                Make sure to enable the JSON report as described in https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md
                            `),
                        }
                    );
                });
                void it("detects if the cucumber preprocessor json report path was not set", async () => {
                    await assert.rejects(
                        globalContext.initCucumberOptions(
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
                        ),
                        {
                            message: dedent(`
                                Plugin misconfiguration: Cucumber preprocessor JSON report path was not set

                                Make sure to configure the JSON report path as described in https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md
                            `),
                        }
                    );
                });
            });
        });

        void describe("the http clients instantiation", () => {
            void it("creates a single client by default", (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const httpClients = globalContext.initHttpClients(undefined, undefined);
                assert.strictEqual(httpClients.jira, httpClients.xray);
                assert.deepStrictEqual(
                    httpClients.jira,
                    new AxiosRestClient(axios, { debug: undefined })
                );
            });
            void it("sets debugging to true if enabled", (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const httpClients = globalContext.initHttpClients({ debug: true }, undefined);
                assert.strictEqual(httpClients.jira, httpClients.xray);
                assert.deepStrictEqual(
                    httpClients.jira,
                    new AxiosRestClient(axios, { debug: true })
                );
            });
            void it("sets debugging to false if disabled", (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const httpClients = globalContext.initHttpClients({ debug: false }, undefined);
                assert.strictEqual(httpClients.jira, httpClients.xray);
                assert.deepStrictEqual(
                    httpClients.jira,
                    new AxiosRestClient(axios, { debug: false })
                );
            });
            void it("creates a single client if empty options are passed", (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const httpClients = globalContext.initHttpClients(undefined, {});
                assert.strictEqual(httpClients.jira, httpClients.xray);
                assert.deepStrictEqual(
                    httpClients.jira,
                    new AxiosRestClient(axios, {
                        debug: undefined,
                        http: {},
                        rateLimiting: undefined,
                    })
                );
            });
            void it("creates a single client using a single config", (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const httpOptions: InternalHttpOptions = {
                    proxy: {
                        host: "http://localhost:1234",
                        port: 12345,
                    },
                };
                const httpClients = globalContext.initHttpClients(undefined, httpOptions);
                assert.strictEqual(httpClients.jira, httpClients.xray);
                assert.deepStrictEqual(
                    httpClients.jira,
                    new AxiosRestClient(axios, {
                        debug: undefined,
                        http: {
                            proxy: {
                                host: "http://localhost:1234",
                                port: 12345,
                            },
                        },
                        rateLimiting: undefined,
                    })
                );
            });
            void it("creates a different jira client if a jira config is passed", (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const httpOptions: InternalHttpOptions = {
                    jira: {
                        proxy: {
                            host: "http://localhost:1234",
                            port: 12345,
                        },
                    },
                };
                const httpClients = globalContext.initHttpClients(undefined, httpOptions);
                assert.notStrictEqual(httpClients.jira, httpClients.xray);
                assert.deepStrictEqual(
                    httpClients.jira,
                    new AxiosRestClient(axios, {
                        debug: undefined,
                        http: {
                            proxy: {
                                host: "http://localhost:1234",
                                port: 12345,
                            },
                        },
                        rateLimiting: undefined,
                    })
                );
                assert.deepStrictEqual(
                    httpClients.xray,
                    new AxiosRestClient(axios, {
                        debug: undefined,
                        http: {},
                        rateLimiting: undefined,
                    })
                );
            });
            void it("creates a different xray client if an xray config is passed", (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const httpOptions: InternalHttpOptions = {
                    xray: {
                        proxy: {
                            host: "http://localhost:1234",
                            port: 12345,
                        },
                    },
                };
                const httpClients = globalContext.initHttpClients(undefined, httpOptions);
                assert.notStrictEqual(httpClients.jira, httpClients.xray);
                assert.deepStrictEqual(
                    httpClients.jira,
                    new AxiosRestClient(axios, {
                        debug: undefined,
                        http: {},
                        rateLimiting: undefined,
                    })
                );
                assert.deepStrictEqual(
                    httpClients.xray,
                    new AxiosRestClient(axios, {
                        debug: undefined,
                        http: {
                            proxy: {
                                host: "http://localhost:1234",
                                port: 12345,
                            },
                        },
                        rateLimiting: undefined,
                    })
                );
            });
            void it("creates different clients if individual configs are passed", (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const httpOptions: InternalHttpOptions = {
                    jira: {
                        proxy: {
                            host: "http://localhost",
                            port: 98765,
                        },
                    },
                    xray: {
                        proxy: {
                            host: "http://localhost:1234",
                            port: 12345,
                        },
                    },
                };
                const httpClients = globalContext.initHttpClients(undefined, httpOptions);
                assert.notStrictEqual(httpClients.jira, httpClients.xray);
                assert.deepStrictEqual(
                    httpClients.jira,
                    new AxiosRestClient(axios, {
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
                assert.deepStrictEqual(
                    httpClients.xray,
                    new AxiosRestClient(axios, {
                        debug: undefined,
                        http: {
                            proxy: {
                                host: "http://localhost:1234",
                                port: 12345,
                            },
                        },
                        rateLimiting: undefined,
                    })
                );
            });
            void it("passes common http options to both clients", (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
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
                            host: "http://localhost:1234",
                            port: 12345,
                        },
                    },
                };
                const httpClients = globalContext.initHttpClients(undefined, httpOptions);
                assert.notStrictEqual(httpClients.jira, httpClients.xray);
                assert.deepStrictEqual(
                    httpClients.jira,
                    new AxiosRestClient(axios, {
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
                assert.deepStrictEqual(
                    httpClients.xray,
                    new AxiosRestClient(axios, {
                        debug: undefined,
                        http: {
                            proxy: {
                                host: "http://localhost:1234",
                                port: 12345,
                            },
                            timeout: 42,
                        },
                        rateLimiting: { requestsPerSecond: 5 },
                    })
                );
            });
            void it("prefers individual http options to common ones", (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
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
                const httpClients = globalContext.initHttpClients(undefined, httpOptions);
                assert.deepStrictEqual(
                    httpClients.jira,
                    new AxiosRestClient(axios, {
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
                assert.deepStrictEqual(
                    httpClients.xray,
                    new AxiosRestClient(axios, {
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

        void describe("the clients instantiation", () => {
            let jiraOptions: InternalJiraOptions;
            let xrayOptions: InternalXrayOptions;
            beforeEach(() => {
                jiraOptions = globalContext.initJiraOptions(
                    {},
                    {
                        projectKey: "CYP",
                        url: "http://localhost:1234",
                    }
                );
                xrayOptions = globalContext.initXrayOptions({}, {});
            });

            void it("detects cloud credentials", async (context) => {
                const env = {
                    ["JIRA_API_TOKEN"]: "1337",
                    ["JIRA_USERNAME"]: "user@somewhere.xyz",
                    ["XRAY_CLIENT_ID"]: "abc",
                    ["XRAY_CLIENT_SECRET"]: "xyz",
                };
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const httpClients = {
                    jira: new AxiosRestClient(axios),
                    xray: new AxiosRestClient(axios),
                };
                const get = context.mock.method(httpClients.jira, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: { active: true, displayName: "Jeff" },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const post = context.mock.method(httpClients.xray, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const { jiraClient, xrayClient } = await globalContext.initClients(
                    jiraOptions,
                    xrayOptions,
                    env,
                    httpClients
                );
                assert.strictEqual(jiraClient instanceof JiraClientCloud, true);
                assert.strictEqual(xrayClient instanceof XrayClientCloud, true);
                assert.strictEqual(
                    jiraClient.getCredentials() instanceof BasicAuthCredentials,
                    true
                );
                assert.strictEqual(
                    (xrayClient as XrayClientCloud).getCredentials() instanceof JwtCredentials,
                    true
                );
                assert.strictEqual(get.mock.callCount(), 1);
                assert.strictEqual(post.mock.callCount(), 1);
                assert.deepStrictEqual(message.mock.calls[0].arguments, [
                    "info",
                    "Jira username and API token found. Setting up Jira cloud basic auth credentials.",
                ]);
                assert.deepStrictEqual(message.mock.calls[4].arguments, [
                    "info",
                    "Xray client ID and client secret found. Setting up Xray cloud JWT credentials.",
                ]);
            });

            void it("passes the xray url to cloud instances", async (context) => {
                const env = {
                    ["JIRA_API_TOKEN"]: "1337",
                    ["JIRA_USERNAME"]: "user@somewhere.xyz",
                    ["XRAY_CLIENT_ID"]: "abc",
                    ["XRAY_CLIENT_SECRET"]: "xyz",
                };
                context.mock.method(LOG, "message", context.mock.fn());
                const httpClients = {
                    jira: new AxiosRestClient(axios),
                    xray: new AxiosRestClient(axios),
                };
                context.mock.method(httpClients.jira, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: { active: true, displayName: "Jeff" },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const post = context.mock.method(httpClients.xray, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                xrayOptions.url = "https://eu.xray.cloud.getxray.app/";
                await globalContext.initClients(jiraOptions, xrayOptions, env, httpClients);
                assert.deepStrictEqual(post.mock.calls[0].arguments, [
                    "https://eu.xray.cloud.getxray.app/api/v2/authenticate",
                    { ["client_id"]: "abc", ["client_secret"]: "xyz" },
                ]);
            });

            void it("should throw for missing xray cloud credentials", async (context) => {
                const env = {
                    ["JIRA_API_TOKEN"]: "1337",
                    ["JIRA_USERNAME"]: "user@somewhere.xyz",
                };
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const httpClients = {
                    jira: new AxiosRestClient(axios),
                    xray: new AxiosRestClient(axios),
                };
                context.mock.method(httpClients.jira, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: { active: true, displayName: "Jeff" },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                await assert.rejects(
                    globalContext.initClients(jiraOptions, xrayOptions, env, httpClients),
                    {
                        message: dedent(`
                        Failed to configure Xray client: Jira cloud credentials detected, but the provided Xray credentials are not Xray cloud credentials.

                          You can find all configurations currently supported at: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/authentication/
                    `),
                    }
                );
                assert.deepStrictEqual(message.mock.calls[0].arguments, [
                    "info",
                    "Jira username and API token found. Setting up Jira cloud basic auth credentials.",
                ]);
            });

            void it("detects PAT credentials", async (context) => {
                const env = {
                    ["JIRA_API_TOKEN"]: "1337",
                };
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const httpClients = {
                    jira: new AxiosRestClient(axios),
                    xray: new AxiosRestClient(axios),
                };
                const getJira = context.mock.method(httpClients.jira, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: { active: true, displayName: "Jeff" },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const getXray = context.mock.method(httpClients.xray, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            active: true,
                            licenseType: "Demo License",
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const { jiraClient, xrayClient } = await globalContext.initClients(
                    jiraOptions,
                    xrayOptions,
                    env,
                    httpClients
                );
                assert.strictEqual(jiraClient instanceof JiraClientServer, true);
                assert.strictEqual(xrayClient instanceof XrayClientServer, true);
                assert.strictEqual(jiraClient.getCredentials() instanceof PatCredentials, true);
                assert.strictEqual(
                    (xrayClient as XrayClientServer).getCredentials() instanceof PatCredentials,
                    true
                );
                assert.strictEqual(getJira.mock.callCount(), 1);
                assert.strictEqual(getXray.mock.callCount(), 1);
                assert.deepStrictEqual(message.mock.calls[0].arguments, [
                    "info",
                    "Jira PAT found. Setting up Jira server PAT credentials.",
                ]);
                assert.deepStrictEqual(message.mock.calls[4].arguments, [
                    "info",
                    "Jira PAT found. Setting up Xray server PAT credentials.",
                ]);
            });

            void it("detects basic auth credentials", async (context) => {
                const env = {
                    ["JIRA_PASSWORD"]: "1337",
                    ["JIRA_USERNAME"]: "user",
                };
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const httpClients = {
                    jira: new AxiosRestClient(axios),
                    xray: new AxiosRestClient(axios),
                };
                const getJira = context.mock.method(httpClients.jira, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: { active: true, displayName: "Jeff" },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const getXray = context.mock.method(httpClients.xray, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            active: true,
                            licenseType: "Demo License",
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const { jiraClient, xrayClient } = await globalContext.initClients(
                    jiraOptions,
                    xrayOptions,
                    env,
                    httpClients
                );
                assert.strictEqual(jiraClient instanceof JiraClientServer, true);
                assert.strictEqual(xrayClient instanceof XrayClientServer, true);
                assert.strictEqual(
                    jiraClient.getCredentials() instanceof BasicAuthCredentials,
                    true
                );
                assert.strictEqual(
                    (xrayClient as XrayClientServer).getCredentials() instanceof
                        BasicAuthCredentials,
                    true
                );
                assert.strictEqual(getJira.mock.callCount(), 1);
                assert.strictEqual(getXray.mock.callCount(), 1);
                assert.deepStrictEqual(message.mock.calls[0].arguments, [
                    "info",
                    "Jira username and password found. Setting up Jira server basic auth credentials.",
                ]);
                assert.deepStrictEqual(message.mock.calls[4].arguments, [
                    "info",
                    "Jira username and password found. Setting up Xray server basic auth credentials.",
                ]);
            });

            void it("should choose cloud credentials over server credentials", async (context) => {
                const env = {
                    ["JIRA_API_TOKEN"]: "1337",
                    ["JIRA_PASSWORD"]: "xyz",
                    ["JIRA_USERNAME"]: "user",
                    ["XRAY_CLIENT_ID"]: "abc",
                    ["XRAY_CLIENT_SECRET"]: "xyz",
                };
                context.mock.method(LOG, "message", context.mock.fn());
                const httpClients = {
                    jira: new AxiosRestClient(axios),
                    xray: new AxiosRestClient(axios),
                };
                context.mock.method(httpClients.jira, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: { active: true, displayName: "Jeff" },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                context.mock.method(httpClients.xray, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const { jiraClient, xrayClient } = await globalContext.initClients(
                    jiraOptions,
                    xrayOptions,
                    env,
                    httpClients
                );
                assert.strictEqual(jiraClient instanceof JiraClientCloud, true);
                assert.strictEqual(xrayClient instanceof XrayClientCloud, true);
                assert.strictEqual(
                    jiraClient.getCredentials() instanceof BasicAuthCredentials,
                    true
                );
                assert.strictEqual(
                    (xrayClient as XrayClientCloud).getCredentials() instanceof JwtCredentials,
                    true
                );
            });

            void it("should throw an error for missing credentials", async () => {
                const httpClients = {
                    jira: new AxiosRestClient(axios),
                    xray: new AxiosRestClient(axios),
                };
                await assert.rejects(
                    globalContext.initClients(jiraOptions, xrayOptions, {}, httpClients),
                    {
                        message: dedent(`
                            Failed to configure Jira client: No viable authentication method was configured.

                              You can find all configurations currently supported at: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/authentication/
                        `),
                    }
                );
            });

            void it("throws if no user details are returned from jira", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const httpClients = {
                    jira: new AxiosRestClient(axios),
                    xray: new AxiosRestClient(axios),
                };
                context.mock.method(httpClients.jira, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: "<div>Welcome</div>",
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                await assert.rejects(
                    globalContext.initClients(
                        jiraOptions,
                        xrayOptions,
                        {
                            ["JIRA_API_TOKEN"]: "1337",
                        },
                        httpClients
                    ),
                    {
                        message: dedent(`
                            Failed to establish communication with Jira: http://localhost:1234

                              Jira did not return a valid response: JSON containing a username was expected, but not received.

                            Make sure you have correctly set up:
                            - Jira base URL: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/jira/#url
                            - Jira authentication: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/authentication/#jira

                            For more information, set the plugin to debug mode: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/plugin/#debug
                        `),
                    }
                );
            });

            void it("throws if no usernames are returned from jira", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const httpClients = {
                    jira: new AxiosRestClient(axios),
                    xray: new AxiosRestClient(axios),
                };
                context.mock.method(httpClients.jira, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            active: true,
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                await assert.rejects(
                    globalContext.initClients(
                        jiraOptions,
                        xrayOptions,
                        {
                            ["JIRA_API_TOKEN"]: "1337",
                        },
                        httpClients
                    ),
                    {
                        message: dedent(`
                            Failed to establish communication with Jira: http://localhost:1234

                              Jira did not return a valid response: JSON containing a username was expected, but not received.

                            Make sure you have correctly set up:
                            - Jira base URL: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/jira/#url
                            - Jira authentication: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/authentication/#jira

                            For more information, set the plugin to debug mode: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/plugin/#debug
                        `),
                    }
                );
            });

            void it("throws if no license data is returned from xray server", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const httpClients = {
                    jira: new AxiosRestClient(axios),
                    xray: new AxiosRestClient(axios),
                };
                context.mock.method(httpClients.jira, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            active: true,
                            displayName: "Demo User",
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                context.mock.method(httpClients.xray, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: "<div>Welcome</div>",
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                await assert.rejects(
                    globalContext.initClients(
                        jiraOptions,
                        xrayOptions,
                        {
                            ["JIRA_API_TOKEN"]: "1337",
                        },
                        httpClients
                    ),
                    {
                        message: dedent(`
                            Failed to establish communication with Xray: http://localhost:1234

                              Xray did not return a valid response: JSON containing basic Xray license information was expected, but not received.

                            Make sure you have correctly set up:
                            - Jira base URL: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/jira/#url
                            - Xray server authentication: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/authentication/#xray-server
                            - Xray itself: https://docs.getxray.app/display/XRAY/Installation

                            For more information, set the plugin to debug mode: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/plugin/#debug
                        `),
                    }
                );
            });

            void it("throws if an inactive license is returned from xray server", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const httpClients = {
                    jira: new AxiosRestClient(axios),
                    xray: new AxiosRestClient(axios),
                };
                context.mock.method(httpClients.jira, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            active: true,
                            displayName: "Demo User",
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                context.mock.method(httpClients.xray, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            active: false,
                            licenseType: "Basic",
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                await assert.rejects(
                    globalContext.initClients(
                        jiraOptions,
                        xrayOptions,
                        {
                            ["JIRA_API_TOKEN"]: "1337",
                        },
                        httpClients
                    ),
                    {
                        message: dedent(`
                            Failed to establish communication with Xray: http://localhost:1234

                              The Xray license is not active

                            Make sure you have correctly set up:
                            - Jira base URL: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/jira/#url
                            - Xray server authentication: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/authentication/#xray-server
                            - Xray itself: https://docs.getxray.app/display/XRAY/Installation

                            For more information, set the plugin to debug mode: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/plugin/#debug
                        `),
                    }
                );
            });

            void it("throws if the xray credentials are invalid", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                context.mock.method(LOG, "logErrorToFile", context.mock.fn());
                const httpClients = {
                    jira: new AxiosRestClient(axios),
                    xray: new AxiosRestClient(axios),
                };
                context.mock.method(httpClients.jira, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            active: true,
                            displayName: "Demo User",
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                context.mock.method(httpClients.xray, "post", () => {
                    throw new AxiosError(
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
                    );
                });
                await assert.rejects(
                    globalContext.initClients(
                        jiraOptions,
                        xrayOptions,
                        {
                            ["JIRA_API_TOKEN"]: "1337",
                            ["JIRA_USERNAME"]: "user",
                            ["XRAY_CLIENT_ID"]: "abc",
                            ["XRAY_CLIENT_SECRET"]: "xyz",
                        },
                        httpClients
                    ),
                    {
                        message: dedent(`
                            Failed to establish communication with Xray: https://xray.cloud.getxray.app/api/v2/authenticate

                              Failed to authenticate

                            Make sure you have correctly set up:
                            - Xray cloud authentication: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/authentication/#xray-cloud
                            - Xray itself: https://docs.getxray.app/display/XRAYCLOUD/Installation

                            For more information, set the plugin to debug mode: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/plugin/#debug
                        `),
                    }
                );
            });
        });
    });

    void describe(SimpleEvidenceCollection.name, () => {
        void it("collects evidence for single tests", () => {
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
            assert.deepStrictEqual(evidenceCollection.getEvidence("CYP-123"), [
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

        void it("collects evidence for multiple tests", () => {
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
            assert.deepStrictEqual(evidenceCollection.getEvidence("CYP-123"), [
                {
                    contentType: "application/json",
                    data: "WyJoZWxsbyJd",
                    filename: "hello.json",
                },
            ]);
            assert.deepStrictEqual(evidenceCollection.getEvidence("CYP-456"), [
                {
                    contentType: "application/json",
                    data: "WyJnb29kYnllIl0=",
                    filename: "goodbye.json",
                },
            ]);
        });

        void it("returns an empty array for unknown tests", () => {
            const evidenceCollection = new SimpleEvidenceCollection();
            evidenceCollection.addEvidence("CYP-123", {
                contentType: "application/json",
                data: "WyJoZWxsbyJd",
                filename: "hello.json",
            });
            assert.deepStrictEqual(evidenceCollection.getEvidence("CYP-456"), []);
        });
    });
});
