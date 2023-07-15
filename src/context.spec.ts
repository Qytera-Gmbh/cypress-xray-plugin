import { expect } from "chai";
import { stubLogging } from "../test/util";
import { BasicAuthCredentials, PATCredentials } from "./authentication/credentials";
import { XrayClientCloud } from "./client/xray/xrayClientCloud";
import { XrayClientServer } from "./client/xray/xrayClientServer";
import { initJiraClient, initOptions, initXrayClient, verifyOptions } from "./context";
import { InternalOptions } from "./types/plugin";

describe("the plugin context configuration", () => {
    describe("the option initialization", () => {
        describe("should have certain default values", () => {
            const options: InternalOptions = initOptions(
                {},
                {
                    jira: {
                        projectKey: "PRJ",
                        url: "https://example.org",
                    },
                }
            );
            describe("jira", () => {
                it("attachVideos", () => {
                    expect(options.jira.attachVideos).to.eq(false);
                });
                it("attachCreateTestIssues", () => {
                    expect(options.jira.createTestIssues).to.eq(true);
                });
                it("testExecutionIssueDescription", () => {
                    expect(options.jira.testExecutionIssueDescription).to.eq(undefined);
                });
                it("testExecutionIssueKey", () => {
                    expect(options.jira.testExecutionIssueKey).to.eq(undefined);
                });
                it("testExecutionIssueSummary", () => {
                    expect(options.jira.testExecutionIssueSummary).to.eq(undefined);
                });
                it("testExecutionIssueType", () => {
                    expect(options.jira.testExecutionIssueType).to.eq("Test Execution");
                });
                it("testPlanIssueKey", () => {
                    expect(options.jira.testPlanIssueKey).to.eq(undefined);
                });
                it("testPlanIssueType", () => {
                    expect(options.jira.testPlanIssueType).to.eq("Test Plan");
                });
            });

            describe("plugin", () => {
                it("debug", () => {
                    expect(options.plugin.debug).to.eq(false);
                });
                it("enabled", () => {
                    expect(options.plugin.enabled).to.eq(true);
                });
                it("logDirectory", () => {
                    expect(options.plugin.logDirectory).to.eq("logs");
                });
                it("normalizeScreenshotNames", () => {
                    expect(options.plugin.normalizeScreenshotNames).to.eq(false);
                });
                it("overwriteIssueSummary", () => {
                    expect(options.plugin.overwriteIssueSummary).to.eq(false);
                });
            });

            describe("xray", () => {
                it("statusFailed", () => {
                    expect(options.xray.statusFailed).to.eq(undefined);
                });
                it("statusPassed", () => {
                    expect(options.xray.statusPassed).to.eq(undefined);
                });
                it("statusPending", () => {
                    expect(options.xray.statusPending).to.eq(undefined);
                });
                it("statusSkipped", () => {
                    expect(options.xray.statusSkipped).to.eq(undefined);
                });
                describe("steps", () => {
                    it("maxLengthAction", () => {
                        expect(options.xray.steps.maxLengthAction).to.eq(8000);
                    });
                    it("update", () => {
                        expect(options.xray.steps.update).to.eq(true);
                    });
                });
                it("testType", () => {
                    expect(options.xray.testType).to.eq("Manual");
                });
                it("uploadResults", () => {
                    expect(options.xray.uploadResults).to.eq(true);
                });
                it("uploadScreenshots", () => {
                    expect(options.xray.uploadScreenshots).to.eq(true);
                });
            });

            describe("cucumber", () => {
                it("downloadFeatures", () => {
                    expect(options.cucumber.downloadFeatures).to.eq(false);
                });
                it("uploadFeatures", () => {
                    expect(options.cucumber.uploadFeatures).to.eq(false);
                });
            });

            describe("openSSL", () => {
                it("openSSL", () => {
                    expect(options.openSSL.rootCAPath).to.eq(undefined);
                });
                it("secureOptions", () => {
                    expect(options.openSSL.secureOptions).to.eq(undefined);
                });
            });
        });
        describe("should prefer provided values over default ones", () => {
            describe("jira", () => {
                it("attachVideos", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                attachVideos: true,
                                url: "https://example.org",
                            },
                        }
                    );
                    expect(options.jira.attachVideos).to.eq(true);
                });
                it("createTestIssues", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                createTestIssues: false,
                                url: "https://example.org",
                            },
                        }
                    );
                    expect(options.jira.createTestIssues).to.eq(false);
                });
                it("testExecutionIssueDescription", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                testExecutionIssueDescription: "hello",
                                url: "https://example.org",
                            },
                        }
                    );
                    expect(options.jira.testExecutionIssueDescription).to.eq("hello");
                });
                it("testExecutionIssueKey", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                testExecutionIssueKey: "PRJ-123",
                                url: "https://example.org",
                            },
                        }
                    );
                    expect(options.jira.testExecutionIssueKey).to.eq("PRJ-123");
                });
                it("testExecutionIssueSummary", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                testExecutionIssueSummary: "Test - Login",
                                url: "https://example.org",
                            },
                        }
                    );
                    expect(options.jira.testExecutionIssueSummary).to.eq("Test - Login");
                });
                it("testExecutionIssueType", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                testExecutionIssueType: "Execution Ticket",
                                url: "https://example.org",
                            },
                        }
                    );
                    expect(options.jira.testExecutionIssueType).to.eq("Execution Ticket");
                });
                it("testPlanIssueKey", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                testPlanIssueKey: "PRJ-456",
                                url: "https://example.org",
                            },
                        }
                    );
                    expect(options.jira.testPlanIssueKey).to.eq("PRJ-456");
                });
                it("url", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                        }
                    );
                    expect(options.jira.url).to.eq("https://example.org");
                });
            });

            describe("plugin", () => {
                it("debug", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            plugin: {
                                debug: true,
                            },
                        }
                    );
                    expect(options.plugin.debug).to.eq(true);
                });
                it("enabled", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            plugin: {
                                enabled: false,
                            },
                        }
                    );
                    expect(options.plugin.enabled).to.eq(false);
                });
                it("logDirectory", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            plugin: {
                                logDirectory: "./logs/",
                            },
                        }
                    );
                    expect(options.plugin.logDirectory).to.eq("./logs/");
                });
                it("normalizeScreenshotNames", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            plugin: {
                                normalizeScreenshotNames: true,
                            },
                        }
                    );
                    expect(options.plugin.normalizeScreenshotNames).to.eq(true);
                });
                it("overwriteIssueSummary", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            plugin: {
                                overwriteIssueSummary: true,
                            },
                        }
                    );
                    expect(options.plugin.overwriteIssueSummary).to.eq(true);
                });
            });

            describe("xray", () => {
                it("statusFailed", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            xray: {
                                statusFailed: "BAD",
                            },
                        }
                    );
                    expect(options.xray.statusFailed).to.eq("BAD");
                });
                it("statusPassed", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            xray: {
                                statusPassed: "GOOD",
                            },
                        }
                    );
                    expect(options.xray.statusPassed).to.eq("GOOD");
                });
                it("statusPending", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            xray: {
                                statusPending: "PENDULUM",
                            },
                        }
                    );
                    expect(options.xray.statusPending).to.eq("PENDULUM");
                });
                it("statusSkipped", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            xray: {
                                statusSkipped: "SKIPPING STONE",
                            },
                        }
                    );
                    expect(options.xray.statusSkipped).to.eq("SKIPPING STONE");
                });

                describe("steps", () => {
                    it("maxLengthAction", () => {
                        const options = initOptions(
                            {},
                            {
                                jira: {
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                },
                                xray: {
                                    steps: {
                                        maxLengthAction: 42,
                                    },
                                },
                            }
                        );
                        expect(options.xray.steps.maxLengthAction).to.eq(42);
                    });
                    it("update", () => {
                        const options = initOptions(
                            {},
                            {
                                jira: {
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                },
                                xray: {
                                    steps: {
                                        update: false,
                                    },
                                },
                            }
                        );
                        expect(options.xray.steps.update).to.eq(false);
                    });
                });
                it("testType", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            xray: {
                                testType: "Cucumber",
                            },
                        }
                    );
                    expect(options.xray.testType).to.eq("Cucumber");
                });
                it("uploadResults", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            xray: {
                                uploadResults: false,
                            },
                        }
                    );
                    expect(options.xray.uploadResults).to.eq(false);
                });
                it("uploadScreenshots", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            xray: {
                                uploadScreenshots: false,
                            },
                        }
                    );
                    expect(options.xray.uploadScreenshots).to.eq(false);
                });
            });

            describe("cucumber", () => {
                it("downloadFeatures", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            cucumber: {
                                featureFileExtension: ".feature",
                                downloadFeatures: true,
                            },
                        }
                    );
                    expect(options.cucumber.downloadFeatures).to.eq(true);
                });
                it("uploadFeatures", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            cucumber: {
                                featureFileExtension: ".feature",
                                uploadFeatures: true,
                            },
                        }
                    );
                    expect(options.cucumber.uploadFeatures).to.eq(true);
                });
            });

            describe("openSSL", () => {
                it("rootCAPath", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            openSSL: {
                                rootCAPath: "/path/to/cert.pem",
                            },
                        }
                    );
                    expect(options.openSSL.rootCAPath).to.eq("/path/to/cert.pem");
                });
                it("secureOptions", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                url: "https://example.org",
                            },
                            openSSL: {
                                secureOptions: 42,
                            },
                        }
                    );
                    expect(options.openSSL.secureOptions).to.eq(42);
                });
            });
        });
        describe("should be able to prefer environment variables over provided values", () => {
            describe("jira", () => {
                it("JIRA_PROJECT_KEY", () => {
                    const env = {
                        JIRA_PROJECT_KEY: "ABC",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                    });
                    expect(options.jira.projectKey).to.eq("ABC");
                });

                it("JIRA_ATTACH_VIDEOS", () => {
                    const env = {
                        JIRA_ATTACH_VIDEOS: "true",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            attachVideos: false,
                            url: "https://example.org",
                        },
                    });
                    expect(options.jira.attachVideos).to.be.true;
                });

                it("JIRA_CREATE_TEST_ISSUES", () => {
                    const env = {
                        JIRA_CREATE_TEST_ISSUES: "false",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            createTestIssues: true,
                            url: "https://example.org",
                        },
                    });
                    expect(options.jira.createTestIssues).to.be.false;
                });

                it("JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION", () => {
                    const env = {
                        JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION: "Good morning",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            testExecutionIssueDescription: "Goodbye",
                            url: "https://example.org",
                        },
                    });
                    expect(options.jira.testExecutionIssueDescription).to.eq("Good morning");
                });

                it("JIRA_TEST_EXECUTION_ISSUE_KEY", () => {
                    const env = {
                        JIRA_TEST_EXECUTION_ISSUE_KEY: "CYP-123",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            testExecutionIssueKey: "CYP-789",
                            url: "https://example.org",
                        },
                    });
                    expect(options.jira.testExecutionIssueKey).to.eq("CYP-123");
                });

                it("JIRA_TEST_EXECUTION_ISSUE_SUMMARY", () => {
                    const env = {
                        JIRA_TEST_EXECUTION_ISSUE_SUMMARY: "Some test case",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            testExecutionIssueSummary: "Summarini",
                            url: "https://example.org",
                        },
                    });
                    expect(options.jira.testExecutionIssueSummary).to.eq("Some test case");
                });

                it("JIRA_TEST_PLAN_ISSUE_KEY", () => {
                    const env = {
                        JIRA_TEST_PLAN_ISSUE_KEY: "CYP-456",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            testPlanIssueKey: "CYP-123",
                            url: "https://example.org",
                        },
                    });
                    expect(options.jira.testPlanIssueKey).to.eq("CYP-456");
                });

                it("JIRA_URL", () => {
                    const env = {
                        JIRA_URL: "https://example.org",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://some.domain.org",
                        },
                    });
                    expect(options.jira.url).to.eq("https://example.org");
                });
            });
            describe("xray", () => {
                it("XRAY_STATUS_FAILED", () => {
                    const env = {
                        XRAY_STATUS_FAILED: "no",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        xray: {
                            statusFailed: "ERROR",
                        },
                    });
                    expect(options.xray?.statusFailed).to.eq("no");
                });

                it("XRAY_STATUS_PASSED", () => {
                    const env = {
                        XRAY_STATUS_PASSED: "ok",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        xray: {
                            statusPassed: "FLYBY",
                        },
                    });
                    expect(options.xray?.statusPassed).to.eq("ok");
                });

                it("XRAY_STATUS_PENDING", () => {
                    const env = {
                        XRAY_STATUS_PENDING: "pendulum",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        xray: {
                            statusPending: "PENCIL",
                        },
                    });
                    expect(options.xray?.statusPending).to.eq("pendulum");
                });

                it("XRAY_STATUS_SKIPPED", () => {
                    const env = {
                        XRAY_STATUS_SKIPPED: "ski-ba-bop-ba-dop-bop",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        xray: {
                            statusSkipped: "HOP",
                        },
                    });
                    expect(options.xray?.statusSkipped).to.eq("ski-ba-bop-ba-dop-bop");
                });

                it("XRAY_STEPS_MAX_LENGTH_ACTION", () => {
                    const env = {
                        XRAY_STEPS_MAX_LENGTH_ACTION: "12345",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        xray: {
                            steps: {
                                maxLengthAction: 500,
                            },
                        },
                    });
                    expect(options.xray?.steps?.maxLengthAction).to.eq(12345);
                });

                it("XRAY_STEPS_UPDATE", () => {
                    const env = {
                        XRAY_STEPS_UPDATE: "false",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        xray: {
                            steps: {
                                update: true,
                            },
                        },
                    });
                    expect(options.xray?.steps?.update).to.be.false;
                });

                it("XRAY_TEST_TYPE", () => {
                    const env = {
                        XRAY_TEST_TYPE: "Automated",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        xray: {
                            testType: "Gherkin",
                        },
                    });
                    expect(options.xray?.testType).to.eq("Automated");
                });

                it("XRAY_UPLOAD_RESULTS", () => {
                    const env = {
                        XRAY_UPLOAD_RESULTS: "false",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        xray: {
                            uploadResults: true,
                        },
                    });
                    expect(options.xray?.uploadResults).to.be.false;
                });

                it("XRAY_UPLOAD_SCREENSHOTS", () => {
                    const env = {
                        XRAY_UPLOAD_SCREENSHOTS: "false",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        xray: {
                            uploadScreenshots: true,
                        },
                    });
                    expect(options.xray?.uploadScreenshots).to.be.false;
                });
            });
            describe("cucumber", () => {
                it("CUCUMBER_FEATURE_FILE_EXTENSION", () => {
                    const env = {
                        CUCUMBER_FEATURE_FILE_EXTENSION: ".feature.file",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        cucumber: {
                            featureFileExtension: ".feature",
                        },
                    });
                    expect(options.cucumber.featureFileExtension).to.eq(".feature.file");
                });

                it("CUCUMBER_DOWNLOAD_FEATURES", () => {
                    const env = {
                        CUCUMBER_DOWNLOAD_FEATURES: "true",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        cucumber: {
                            featureFileExtension: ".feature",
                            downloadFeatures: false,
                        },
                    });
                    expect(options.cucumber?.downloadFeatures).to.be.true;
                });

                it("CUCUMBER_UPLOAD_FEATURES", () => {
                    const env = {
                        CUCUMBER_UPLOAD_FEATURES: "true",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        cucumber: {
                            featureFileExtension: ".feature",
                            uploadFeatures: false,
                        },
                    });
                    expect(options.cucumber?.uploadFeatures).to.be.true;
                });
            });
            describe("plugin", () => {
                it("PLUGIN_DEBUG", () => {
                    const env = {
                        PLUGIN_DEBUG: "true",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        plugin: {
                            debug: false,
                        },
                    });
                    expect(options.plugin?.debug).to.be.true;
                });

                it("PLUGIN_ENABLED", () => {
                    const env = {
                        PLUGIN_ENABLED: "false",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        plugin: {
                            enabled: true,
                        },
                    });
                    expect(options.plugin?.enabled).to.be.false;
                });

                it("PLUGIN_LOG_DIRECTORY", () => {
                    const env = {
                        PLUGIN_LOG_DIRECTORY: "/home/logs/cypress-xray-plugin",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        plugin: {
                            logDirectory: "./logging/subdirectory",
                        },
                    });
                    expect(options.plugin?.logDirectory).to.eq("/home/logs/cypress-xray-plugin");
                });

                it("PLUGIN_NORMALIZE_SCREENSHOT_NAMES", () => {
                    const env = {
                        PLUGIN_NORMALIZE_SCREENSHOT_NAMES: "true",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        plugin: {
                            normalizeScreenshotNames: false,
                        },
                    });
                    expect(options.plugin?.normalizeScreenshotNames).to.be.true;
                });

                it("PLUGIN_OVERWRITE_ISSUE_SUMMARY", () => {
                    const env = {
                        PLUGIN_OVERWRITE_ISSUE_SUMMARY: "true",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        plugin: {
                            overwriteIssueSummary: false,
                        },
                    });
                    expect(options.plugin?.overwriteIssueSummary).to.be.true;
                });
            });
            describe("openSSL", () => {
                it("OPENSSL_ROOT_CA_PATH ", () => {
                    const env = {
                        OPENSSL_ROOT_CA_PATH: "/home/ssl/ca.pem",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        openSSL: {
                            rootCAPath: "/a/b/c.pem",
                        },
                    });
                    expect(options.openSSL?.rootCAPath).to.eq("/home/ssl/ca.pem");
                });

                it("OPENSSL_SECURE_OPTIONS ", () => {
                    const env = {
                        OPENSSL_SECURE_OPTIONS: 415,
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        openSSL: {
                            secureOptions: 42,
                        },
                    });
                    expect(options.openSSL?.secureOptions).to.eq(415);
                });
            });
        });
    });
    describe("the options verifier", () => {
        it("should be able to detect unset project keys", async () => {
            expect(() =>
                verifyOptions({
                    jira: {
                        projectKey: undefined,
                        url: "https://example.org",
                    },
                })
            ).to.throw("Plugin misconfiguration: Jira project key was not set");
        });
        it("should be able to detect mismatched test execution issue keys", async () => {
            expect(() =>
                verifyOptions({
                    jira: {
                        projectKey: "CYP",
                        testExecutionIssueKey: "ABC-123",
                        url: "https://example.org",
                    },
                })
            ).to.throw(
                "Plugin misconfiguration: test execution issue key ABC-123 does not belong to project CYP"
            );
        });
        it("should be able to detect mismatched test plan issue keys", async () => {
            expect(() =>
                verifyOptions({
                    jira: {
                        projectKey: "CYP",
                        testPlanIssueKey: "ABC-456",
                        url: "https://example.org",
                    },
                })
            ).to.throw(
                "Plugin misconfiguration: test plan issue key ABC-456 does not belong to project CYP"
            );
        });
        it("should not allow step lengths of length zero", async () => {
            expect(() =>
                verifyOptions({
                    jira: {
                        projectKey: "CYP",
                        url: "https://example.org",
                    },
                    xray: {
                        steps: {
                            maxLengthAction: 0,
                        },
                    },
                })
            ).to.throw(
                "Plugin misconfiguration: max length of step actions must be a positive number: 0"
            );
        });
        it("should not allow negative step action lengths", async () => {
            expect(() =>
                verifyOptions({
                    jira: {
                        projectKey: "CYP",
                        url: "https://example.org",
                    },
                    xray: {
                        steps: {
                            maxLengthAction: -5,
                        },
                    },
                })
            ).to.throw(
                "Plugin misconfiguration: max length of step actions must be a positive number: -5"
            );
        });
    });
    describe("the Jira client instantiation", () => {
        let options: InternalOptions;
        beforeEach(() => {
            options = initOptions(
                {},
                {
                    jira: {
                        projectKey: "CYP",
                        url: "https://example.org",
                    },
                }
            );
            // Make Jira client instantiation mandatory.
            options.jira.attachVideos = true;
        });

        it("should be able to detect Jira Cloud credentials", () => {
            const env = {
                JIRA_USERNAME: "user@somewhere.xyz",
                JIRA_API_TOKEN: "1337",
            };
            const { stubbedInfo } = stubLogging();
            const client = initJiraClient(options, env);
            const credentials = client.getCredentials();
            expect(credentials).to.be.an.instanceof(BasicAuthCredentials);
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira username and API token found. Setting up basic auth credentials for Jira Cloud."
            );
        });

        it("should be able to detect Jira Server PAT credentials", () => {
            const env = {
                JIRA_API_TOKEN: "1337",
            };
            const { stubbedInfo } = stubLogging();
            const client = initJiraClient(options, env);
            const credentials = client.getCredentials();
            expect(credentials).to.be.an.instanceof(PATCredentials);
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira PAT found. Setting up PAT credentials for Jira Server."
            );
        });

        it("should be able to detect Jira Server basic auth credentials", () => {
            const env = {
                JIRA_USERNAME: "user",
                JIRA_PASSWORD: "1337",
            };
            const { stubbedInfo } = stubLogging();
            const client = initJiraClient(options, env);
            const credentials = client.getCredentials();
            expect(credentials).to.be.an.instanceof(BasicAuthCredentials);
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira username and password found. Setting up basic auth credentials for Jira Server."
            );
        });

        it("should be able to choose Jira Cloud credentials over server credentials", () => {
            const env = {
                JIRA_USERNAME: "user",
                JIRA_PASSWORD: "xyz",
                JIRA_API_TOKEN: "1337",
            };
            const { stubbedInfo } = stubLogging();
            const client = initJiraClient(options, env);
            const credentials = client.getCredentials();
            expect(credentials).to.be.an.instanceof(BasicAuthCredentials);
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira username and API token found. Setting up basic auth credentials for Jira Cloud."
            );
        });

        describe("the error handling", () => {
            beforeEach(() => {
                // We're not interested in informative log messages here.
                stubLogging();
            });

            it("should throw an error for missing Jira URLs", () => {
                options.jira.url = undefined;
                expect(() => initJiraClient(options, {})).to.throw(
                    "Failed to configure Jira client: no Jira URL was provided.\nMake sure Jira was configured correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#jira"
                );
            });

            it("should throw an error for missing credentials", () => {
                expect(() => initJiraClient(options, {})).to.throw(
                    "Failed to configure Jira client: no viable authentication method was configured.\nYou can find all configurations currently supported at https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/"
                );
            });
        });
    });

    describe("the Xray client instantiation", () => {
        let options: InternalOptions;
        beforeEach(() => {
            options = initOptions(
                {},
                {
                    jira: {
                        projectKey: "CYP",
                        url: "https://example.org",
                    },
                }
            );
        });

        it("should be able to detect cloud credentials", () => {
            const env = {
                XRAY_CLIENT_ID: "user",
                XRAY_CLIENT_SECRET: "xyz",
            };
            const { stubbedInfo } = stubLogging();
            const client = initXrayClient(options, env);
            expect(client).to.be.an.instanceof(XrayClientCloud);
            expect(stubbedInfo).to.have.been.calledWith(
                "Xray client ID and client secret found. Setting up Xray cloud credentials."
            );
        });

        it("should be able to detect basic server credentials", () => {
            const env = {
                JIRA_USERNAME: "user",
                JIRA_PASSWORD: "xyz",
            };
            options.jira.url = "https://example.org";
            const { stubbedInfo } = stubLogging();
            const client = initXrayClient(options, env);
            expect(client).to.be.an.instanceof(XrayClientServer);
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira username and password found. Setting up Xray basic auth credentials."
            );
        });

        it("should be able to detect PAT server credentials", () => {
            const env = {
                JIRA_API_TOKEN: "1337",
            };
            options.jira.url = "https://example.org";
            const { stubbedInfo } = stubLogging();
            const client = initXrayClient(options, env);
            expect(client).to.be.an.instanceof(XrayClientServer);
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira PAT found. Setting up Xray PAT credentials."
            );
        });

        it("should be able to choose cloud credentials over server credentials", () => {
            const env = {
                JIRA_USERNAME: "user",
                JIRA_API_TOKEN: "1337",
                JIRA_PASSWORD: "xyz",
                XRAY_CLIENT_ID: "id",
                XRAY_CLIENT_SECRET: "secret",
            };
            const { stubbedInfo } = stubLogging();
            const client = initXrayClient(options, env);
            expect(client).to.be.an.instanceof(XrayClientCloud);
            expect(stubbedInfo).to.have.been.calledWith(
                "Xray client ID and client secret found. Setting up Xray cloud credentials."
            );
        });

        describe("the error handling", () => {
            beforeEach(() => {
                // We're not interested in informative log messages here.
                stubLogging();
            });

            it("should throw an error for missing credentials", () => {
                expect(() => initXrayClient(options, {})).to.throw(
                    "Failed to configure Xray uploader: no viable Xray configuration was found or the configuration you provided is not supported.\nYou can find all configurations currently supported at https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/"
                );
            });
        });
    });
});
