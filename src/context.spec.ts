import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { stub } from "sinon";
import { stubLogging } from "../test/util";
import { BasicAuthCredentials, JWTCredentials, PATCredentials } from "./authentication/credentials";
import { JiraClientCloud } from "./client/jira/jiraClientCloud";
import { JiraClientServer } from "./client/jira/jiraClientServer";
import { XrayClientCloud } from "./client/xray/xrayClientCloud";
import { XrayClientServer } from "./client/xray/xrayClientServer";
import {
    initClients,
    initCucumberOptions,
    initJiraOptions,
    initOpenSSLOptions,
    initPluginOptions,
    initXrayOptions,
} from "./context";
import * as dependencies from "./dependencies";
import {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalOpenSSLOptions,
    InternalPluginOptions,
    InternalXrayOptions,
} from "./types/plugin";
import { dedent } from "./util/dedent";
import * as ping from "./util/ping";

chai.use(chaiAsPromised);

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
                    it("testType", () => {
                        expect(jiraOptions.fields.testType).to.eq(undefined);
                    });
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

            describe("cucumber", async () => {
                const cucumberOptions: InternalCucumberOptions | undefined =
                    await initCucumberOptions(
                        {
                            testingType: "e2e",
                            projectRoot: "",
                            reporter: "",
                            specPattern: "",
                            excludeSpecPattern: "",
                            env: {},
                        },
                        { featureFileExtension: ".feature" }
                    );
                it("downloadFeatures", () => {
                    expect(cucumberOptions?.downloadFeatures).to.eq(false);
                });
                it("uploadFeatures", () => {
                    expect(cucumberOptions?.uploadFeatures).to.eq(false);
                });
            });

            describe("openSSL", () => {
                const openSSLOptions: InternalOpenSSLOptions = initOpenSSLOptions({}, {});
                it("openSSL", () => {
                    expect(openSSLOptions.rootCAPath).to.eq(undefined);
                });
                it("secureOptions", () => {
                    expect(openSSLOptions.secureOptions).to.eq(undefined);
                });
            });
        });
        describe("should prefer provided values over default ones", () => {
            describe("jira", () => {
                it("attachVideos", () => {
                    const jiraOptions = initJiraOptions(
                        {},
                        {
                            projectKey: "PRJ",
                            attachVideos: true,
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
                                projectKey: "PRJ",
                                url: "https://example.org",
                                fields: {
                                    description: "Beschreibung",
                                },
                            }
                        );
                        expect(jiraOptions.fields.description).to.eq("Beschreibung");
                    });
                    it("labels", () => {
                        const jiraOptions = initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                url: "https://example.org",
                                fields: {
                                    labels: "Stichworte",
                                },
                            }
                        );
                        expect(jiraOptions.fields.labels).to.eq("Stichworte");
                    });
                    it("summary", () => {
                        const jiraOptions = initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                url: "https://example.org",
                                fields: {
                                    summary: "Résumé",
                                },
                            }
                        );
                        expect(jiraOptions.fields.summary).to.eq("Résumé");
                    });
                    it("testEnvironments", () => {
                        const jiraOptions = initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                url: "https://example.org",
                                fields: {
                                    testEnvironments: "Testumgebungen",
                                },
                            }
                        );
                        expect(jiraOptions.fields.testEnvironments).to.eq("Testumgebungen");
                    });
                    it("testPlan", () => {
                        const jiraOptions = initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                url: "https://example.org",
                                fields: {
                                    testPlan: "Plan de Test",
                                },
                            }
                        );
                        expect(jiraOptions.fields.testPlan).to.eq("Plan de Test");
                    });
                    it("testType", () => {
                        const jiraOptions = initJiraOptions(
                            {},
                            {
                                projectKey: "PRJ",
                                url: "https://example.org",
                                fields: {
                                    testType: "Xray Test Type",
                                },
                            }
                        );
                        expect(jiraOptions.fields.testType).to.eq("Xray Test Type");
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
                            testingType: "component",
                            projectRoot: "",
                            reporter: "",
                            specPattern: "",
                            excludeSpecPattern: "",
                            env: { jsonEnabled: true, jsonOutput: "hello" },
                        },
                        {
                            featureFileExtension: ".feature",
                            downloadFeatures: true,
                        }
                    );
                    expect(cucumberOptions?.downloadFeatures).to.eq(true);
                });
                it("uploadFeatures", async () => {
                    const cucumberOptions = await initCucumberOptions(
                        {
                            testingType: "component",
                            projectRoot: "",
                            reporter: "",
                            specPattern: "",
                            excludeSpecPattern: "",
                            env: { jsonEnabled: true, jsonOutput: "hello" },
                        },
                        {
                            featureFileExtension: ".feature",
                            uploadFeatures: true,
                        }
                    );
                    expect(cucumberOptions?.uploadFeatures).to.eq(true);
                });
            });

            describe("openSSL", () => {
                it("rootCAPath", () => {
                    const openSSLOptions = initOpenSSLOptions(
                        {},
                        {
                            rootCAPath: "/path/to/cert.pem",
                        }
                    );
                    expect(openSSLOptions.rootCAPath).to.eq("/path/to/cert.pem");
                });
                it("secureOptions", () => {
                    const openSSLOptions = initOpenSSLOptions(
                        {},
                        {
                            secureOptions: 42,
                        }
                    );
                    expect(openSSLOptions.secureOptions).to.eq(42);
                });
            });
        });
        describe("should prefer environment variables over provided values", () => {
            describe("jira", () => {
                it("JIRA_PROJECT_KEY", () => {
                    const env = {
                        JIRA_PROJECT_KEY: "ABC",
                    };
                    const jiraOptions = initJiraOptions(env, {
                        projectKey: "CYP",
                        url: "https://example.org",
                    });
                    expect(jiraOptions.projectKey).to.eq("ABC");
                });

                it("JIRA_ATTACH_VIDEOS", () => {
                    const env = {
                        JIRA_ATTACH_VIDEOS: "true",
                    };
                    const jiraOptions = initJiraOptions(env, {
                        projectKey: "CYP",
                        attachVideos: false,
                        url: "https://example.org",
                    });
                    expect(jiraOptions.attachVideos).to.be.true;
                });

                describe("fields", () => {
                    it("JIRA_FIELDS_DESCRIPTION", () => {
                        const env = {
                            JIRA_FIELDS_DESCRIPTION: "customfield_98765",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "PRJ",
                            url: "https://example.org",
                            fields: {
                                description: "customfield_12345",
                            },
                        });
                        expect(jiraOptions.fields.description).to.eq("customfield_98765");
                    });
                    it("JIRA_FIELDS_LABELS", () => {
                        const env = {
                            JIRA_FIELDS_LABELS: "customfield_98765",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "PRJ",
                            url: "https://example.org",
                            fields: {
                                labels: "customfield_12345",
                            },
                        });
                        expect(jiraOptions.fields.labels).to.eq("customfield_98765");
                    });
                    it("JIRA_FIELDS_SUMMARY", () => {
                        const env = {
                            JIRA_FIELDS_SUMMARY: "customfield_98765",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "PRJ",
                            url: "https://example.org",
                            fields: {
                                summary: "customfield_12345",
                            },
                        });
                        expect(jiraOptions.fields.summary).to.eq("customfield_98765");
                    });
                    it("JIRA_FIELDS_TEST_ENVIRONMENTS", () => {
                        const env = {
                            JIRA_FIELDS_TEST_ENVIRONMENTS: "customfield_98765",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "PRJ",
                            url: "https://example.org",
                            fields: {
                                testEnvironments: "customfield_12345",
                            },
                        });
                        expect(jiraOptions.fields.testEnvironments).to.eq("customfield_98765");
                    });
                    it("JIRA_FIELDS_TEST_PLAN", () => {
                        const env = {
                            JIRA_FIELDS_TEST_PLAN: "customfield_98765",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "PRJ",
                            url: "https://example.org",
                            fields: {
                                testPlan: "customfield_12345",
                            },
                        });
                        expect(jiraOptions.fields.testPlan).to.eq("customfield_98765");
                    });
                    it("JIRA_FIELDS_TEST_TYPE", () => {
                        const env = {
                            JIRA_FIELDS_TEST_TYPE: "customfield_98765",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "PRJ",
                            url: "https://example.org",
                            fields: {
                                testType: "customfield_12345",
                            },
                        });
                        expect(jiraOptions.fields.testType).to.eq("customfield_98765");
                    });
                });
                it("JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION", () => {
                    const env = {
                        JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION: "Good morning",
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
                        JIRA_TEST_EXECUTION_ISSUE_KEY: "CYP-123",
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
                        JIRA_TEST_EXECUTION_ISSUE_SUMMARY: "Some test case",
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
                        JIRA_TEST_EXECUTION_ISSUE_TYPE: "Execution Issue",
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
                        JIRA_TEST_PLAN_ISSUE_KEY: "CYP-456",
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
                        JIRA_TEST_PLAN_ISSUE_TYPE: "Plan Issue",
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
                        JIRA_URL: "https://example.org",
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
                        XRAY_STATUS_FAILED: "no",
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
                        XRAY_STATUS_PASSED: "ok",
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
                        XRAY_STATUS_PENDING: "pendulum",
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
                        XRAY_STATUS_SKIPPED: "ski-ba-bop-ba-dop-bop",
                    };
                    const xrayOptions = initXrayOptions(env, {
                        status: {
                            skipped: "HOP",
                        },
                    });
                    expect(xrayOptions.status.skipped).to.eq("ski-ba-bop-ba-dop-bop");
                });

                it("XRAY_TEST_ENVIRONMENTS", () => {
                    const env = {
                        XRAY_TEST_ENVIRONMENTS: [false, "bonjour", 5],
                    };
                    const xrayOptions = initXrayOptions(env, {
                        testEnvironments: ["A", "B", "C"],
                    });
                    expect(xrayOptions.testEnvironments).to.deep.eq(["false", "bonjour", "5"]);
                });

                it("XRAY_UPLOAD_RESULTS", () => {
                    const env = {
                        XRAY_UPLOAD_RESULTS: "false",
                    };
                    const xrayOptions = initXrayOptions(env, {
                        uploadResults: true,
                    });
                    expect(xrayOptions.uploadResults).to.be.false;
                });

                it("XRAY_UPLOAD_SCREENSHOTS", () => {
                    const env = {
                        XRAY_UPLOAD_SCREENSHOTS: "false",
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
                            testingType: "e2e",
                            projectRoot: "",
                            reporter: "",
                            specPattern: "",
                            excludeSpecPattern: "",
                            env: {
                                CUCUMBER_FEATURE_FILE_EXTENSION: ".feature.file",
                                jsonEnabled: true,
                                jsonOutput: "hello",
                            },
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
                            testingType: "e2e",
                            projectRoot: "",
                            reporter: "",
                            specPattern: "",
                            excludeSpecPattern: "",
                            env: {
                                CUCUMBER_DOWNLOAD_FEATURES: "true",
                                jsonEnabled: true,
                                jsonOutput: "hello",
                            },
                        },
                        {
                            featureFileExtension: ".feature",
                            downloadFeatures: false,
                        }
                    );
                    expect(cucumberOptions?.downloadFeatures).to.be.true;
                });

                it("CUCUMBER_UPLOAD_FEATURES", async () => {
                    const cucumberOptions = await initCucumberOptions(
                        {
                            testingType: "e2e",
                            projectRoot: "",
                            reporter: "",
                            specPattern: "",
                            excludeSpecPattern: "",
                            env: {
                                CUCUMBER_UPLOAD_FEATURES: "true",
                                jsonEnabled: true,
                                jsonOutput: "hello",
                            },
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
                        PLUGIN_DEBUG: "true",
                    };
                    const pluginOptions = initPluginOptions(env, {
                        debug: false,
                    });
                    expect(pluginOptions.debug).to.be.true;
                });

                it("PLUGIN_ENABLED", () => {
                    const env = {
                        PLUGIN_ENABLED: "false",
                    };
                    const pluginOptions = initPluginOptions(env, {
                        enabled: true,
                    });
                    expect(pluginOptions.enabled).to.be.false;
                });

                it("PLUGIN_LOG_DIRECTORY", () => {
                    const env = {
                        PLUGIN_LOG_DIRECTORY: "/home/logs/cypress-xray-plugin",
                    };
                    const pluginOptions = initPluginOptions(env, {
                        logDirectory: "./logging/subdirectory",
                    });
                    expect(pluginOptions.logDirectory).to.eq("/home/logs/cypress-xray-plugin");
                });

                it("PLUGIN_NORMALIZE_SCREENSHOT_NAMES", () => {
                    const env = {
                        PLUGIN_NORMALIZE_SCREENSHOT_NAMES: "true",
                    };
                    const pluginOptions = initPluginOptions(env, {
                        normalizeScreenshotNames: false,
                    });
                    expect(pluginOptions.normalizeScreenshotNames).to.be.true;
                });
            });
            describe("openSSL", () => {
                it("OPENSSL_ROOT_CA_PATH ", () => {
                    const env = {
                        OPENSSL_ROOT_CA_PATH: "/home/ssl/ca.pem",
                    };
                    const openSSLOptions = initOpenSSLOptions(env, {
                        rootCAPath: "/a/b/c.pem",
                    });
                    expect(openSSLOptions.rootCAPath).to.eq("/home/ssl/ca.pem");
                });

                it("OPENSSL_SECURE_OPTIONS ", () => {
                    const env = {
                        OPENSSL_SECURE_OPTIONS: 415,
                    };
                    const openSSLOptions = initOpenSSLOptions(env, {
                        secureOptions: 42,
                    });
                    expect(openSSLOptions.secureOptions).to.eq(415);
                });
            });
        });
        describe("detects invalid configurations", () => {
            it("detects unset project keys", async () => {
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
            it("detect mismatched test execution issue keys", () => {
                expect(() =>
                    initJiraOptions(
                        {},
                        {
                            projectKey: "CYP",
                            testExecutionIssueKey: "ABC-123",
                            url: "https://example.org",
                        }
                    )
                ).to.throw(
                    "Plugin misconfiguration: test execution issue key ABC-123 does not belong to project CYP"
                );
            });
            it("detects mismatched test plan issue keys", () => {
                expect(() =>
                    initJiraOptions(
                        {},
                        {
                            projectKey: "CYP",
                            testPlanIssueKey: "ABC-456",
                            url: "https://example.org",
                        }
                    )
                ).to.throw(
                    "Plugin misconfiguration: test plan issue key ABC-456 does not belong to project CYP"
                );
            });
            it("throws if the cucumber preprocessor is not installed", async () => {
                stub(dependencies, "importModule").rejects(new Error("Failed to import package"));
                await expect(
                    initCucumberOptions(
                        {
                            testingType: "e2e",
                            projectRoot: "",
                            reporter: "",
                            specPattern: "",
                            excludeSpecPattern: "",
                            env: {},
                        },
                        {
                            featureFileExtension: ".feature",
                        }
                    )
                ).to.eventually.be.rejectedWith(
                    dedent(`
                        Plugin dependency misconfigured: @badeball/cypress-cucumber-preprocessor

                        Error: Failed to import package

                        The plugin depends on the package and should automatically download it during installation, but might have failed to do so because of conflicting Node versions

                        Make sure to install the package manually using: npm install @badeball/cypress-cucumber-preprocessor --save-dev
                    `)
                );
            });
            it("detects if the cucumber preprocessor json report is not enabled", async () => {
                await expect(
                    initCucumberOptions(
                        {
                            testingType: "e2e",
                            projectRoot: "",
                            reporter: "",
                            specPattern: "",
                            excludeSpecPattern: "",
                            env: { jsonEnabled: false },
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
                            testingType: "e2e",
                            projectRoot: "",
                            reporter: "",
                            specPattern: "",
                            excludeSpecPattern: "",
                            env: { jsonEnabled: true, jsonOutput: "" },
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
                JIRA_USERNAME: "user@somewhere.xyz",
                JIRA_API_TOKEN: "1337",
                XRAY_CLIENT_ID: "abc",
                XRAY_CLIENT_SECRET: "xyz",
            };
            const { stubbedInfo } = stubLogging();
            const stubbedJiraPing = stub(ping, "pingJiraInstance");
            const stubbedXrayPing = stub(ping, "pingXrayCloud");
            stubbedJiraPing.onFirstCall().resolves();
            stubbedXrayPing.onFirstCall().resolves();
            const { jiraClient, xrayClient } = await initClients(jiraOptions, env);
            expect(jiraClient).to.be.an.instanceof(JiraClientCloud);
            expect(xrayClient).to.be.an.instanceof(XrayClientCloud);
            expect((jiraClient as JiraClientCloud).getCredentials()).to.be.an.instanceof(
                BasicAuthCredentials
            );
            expect((xrayClient as XrayClientCloud).getCredentials()).to.be.an.instanceof(
                JWTCredentials
            );
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira username and API token found. Setting up Jira cloud basic auth credentials"
            );
            expect(stubbedInfo).to.have.been.calledWith(
                "Xray client ID and client secret found. Setting up Xray cloud JWT credentials"
            );
            expect(stubbedJiraPing).to.have.been.calledOnce;
            expect(stubbedXrayPing).to.have.been.calledOnce;
        });

        it("should throw for missing xray cloud credentials", async () => {
            const env = {
                JIRA_USERNAME: "user@somewhere.xyz",
                JIRA_API_TOKEN: "1337",
            };
            const { stubbedInfo } = stubLogging();
            const stubbedJiraPing = stub(ping, "pingJiraInstance");
            stubbedJiraPing.onFirstCall().resolves();
            await expect(initClients(jiraOptions, env)).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to configure Xray client: Jira cloud credentials detected, but the provided Xray credentials are not Xray cloud credentials
                    You can find all configurations currently supported at: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/
                `)
            );
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira username and API token found. Setting up Jira cloud basic auth credentials"
            );
        });

        it("should detect PAT credentials", async () => {
            const env = {
                JIRA_API_TOKEN: "1337",
            };
            const { stubbedInfo } = stubLogging();
            const stubbedJiraPing = stub(ping, "pingJiraInstance");
            const stubbedXrayPing = stub(ping, "pingXrayServer");
            stubbedJiraPing.onFirstCall().resolves();
            stubbedXrayPing.onFirstCall().resolves();
            const { jiraClient, xrayClient } = await initClients(jiraOptions, env);
            expect(jiraClient).to.be.an.instanceof(JiraClientServer);
            expect(xrayClient).to.be.an.instanceof(XrayClientServer);
            expect((jiraClient as JiraClientServer).getCredentials()).to.be.an.instanceof(
                PATCredentials
            );
            expect((xrayClient as XrayClientServer).getCredentials()).to.be.an.instanceof(
                PATCredentials
            );
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira PAT found. Setting up Jira server PAT credentials"
            );
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira PAT found. Setting up Xray server PAT credentials"
            );
            expect(stubbedJiraPing).to.have.been.calledOnce;
            expect(stubbedXrayPing).to.have.been.calledOnce;
        });

        it("should detect basic auth credentials", async () => {
            const env = {
                JIRA_USERNAME: "user",
                JIRA_PASSWORD: "1337",
            };
            const { stubbedInfo } = stubLogging();
            const stubbedJiraPing = stub(ping, "pingJiraInstance");
            const stubbedXrayPing = stub(ping, "pingXrayServer");
            stubbedJiraPing.onFirstCall().resolves();
            stubbedXrayPing.onFirstCall().resolves();
            const { jiraClient, xrayClient } = await initClients(jiraOptions, env);
            expect(jiraClient).to.be.an.instanceof(JiraClientServer);
            expect(xrayClient).to.be.an.instanceof(XrayClientServer);
            expect((jiraClient as JiraClientServer).getCredentials()).to.be.an.instanceof(
                BasicAuthCredentials
            );
            expect((xrayClient as XrayClientServer).getCredentials()).to.be.an.instanceof(
                BasicAuthCredentials
            );
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira username and password found. Setting up Jira server basic auth credentials"
            );
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira username and password found. Setting up Xray server basic auth credentials"
            );
            expect(stubbedJiraPing).to.have.been.calledOnce;
            expect(stubbedXrayPing).to.have.been.calledOnce;
        });

        it("should choose cloud credentials over server credentials", async () => {
            const env = {
                JIRA_USERNAME: "user",
                JIRA_PASSWORD: "xyz",
                JIRA_API_TOKEN: "1337",
                XRAY_CLIENT_ID: "abc",
                XRAY_CLIENT_SECRET: "xyz",
            };
            stubLogging();
            const stubbedJiraPing = stub(ping, "pingJiraInstance");
            const stubbedXrayPing = stub(ping, "pingXrayCloud");
            stubbedJiraPing.onFirstCall().resolves();
            stubbedXrayPing.onFirstCall().resolves();
            const { jiraClient, xrayClient } = await initClients(jiraOptions, env);
            expect(jiraClient).to.be.an.instanceof(JiraClientCloud);
            expect(xrayClient).to.be.an.instanceof(XrayClientCloud);
            expect((jiraClient as JiraClientCloud).getCredentials()).to.be.an.instanceof(
                BasicAuthCredentials
            );
            expect((xrayClient as XrayClientCloud).getCredentials()).to.be.an.instanceof(
                JWTCredentials
            );
        });
        it("should throw an error for missing jira urls", async () => {
            jiraOptions.url = undefined as unknown as string;
            await expect(initClients(jiraOptions, {})).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to configure Jira client: no Jira URL was provided
                    Make sure Jira was configured correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#jira
                `)
            );
        });

        it("should throw an error for missing credentials", async () => {
            await expect(initClients(jiraOptions, {})).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to configure Jira client: no viable authentication method was configured
                    You can find all configurations currently supported at: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/
                `)
            );
        });
    });
});
