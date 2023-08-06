import { expect } from "chai";
import { stubLogging } from "../test/util";
import { BasicAuthCredentials, JWTCredentials, PATCredentials } from "./authentication/credentials";
import { JiraClientCloud } from "./client/jira/jiraClientCloud";
import { JiraClientServer } from "./client/jira/jiraClientServer";
import { XrayClientCloud } from "./client/xray/xrayClientCloud";
import { XrayClientServer } from "./client/xray/xrayClientServer";
import { initClients, initOptions, verifyOptions } from "./context";
import { InternalOptions } from "./types/plugin";
import { dedent } from "./util/dedent";

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
                describe("fields", () => {
                    describe("description", () => {
                        it("id", () => {
                            expect(options.jira.fields.description.id).to.eq(undefined);
                        });
                        it("name", () => {
                            expect(options.jira.fields.description.name).to.eq("description");
                        });
                    });
                    describe("labels", () => {
                        it("id", () => {
                            expect(options.jira.fields.labels.id).to.eq(undefined);
                        });
                        it("name", () => {
                            expect(options.jira.fields.labels.name).to.eq("labels");
                        });
                    });
                    describe("summary", () => {
                        it("id", () => {
                            expect(options.jira.fields.summary.id).to.eq(undefined);
                        });
                        it("name", () => {
                            expect(options.jira.fields.summary.name).to.eq("summary");
                        });
                    });
                    describe("testPlan", () => {
                        it("id", () => {
                            expect(options.jira.fields.testPlan.id).to.eq(undefined);
                        });
                        it("name", () => {
                            expect(options.jira.fields.testPlan.name).to.eq("test plan");
                        });
                    });
                    describe("testType", () => {
                        it("id", () => {
                            expect(options.jira.fields.testType.id).to.eq(undefined);
                        });
                        it("name", () => {
                            expect(options.jira.fields.testType.name).to.eq("test type");
                        });
                    });
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
                        expect(options.xray.steps.update).to.eq(false);
                    });
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
                describe("fields", () => {
                    describe("description", () => {
                        it("name", () => {
                            const options = initOptions(
                                {},
                                {
                                    jira: {
                                        projectKey: "PRJ",
                                        url: "https://example.org",
                                        fields: {
                                            description: {
                                                name: "Beschreibung",
                                            },
                                        },
                                    },
                                }
                            );
                            expect(options.jira.fields.description.name).to.eq("Beschreibung");
                        });
                    });
                    describe("labels", () => {
                        it("name", () => {
                            const options = initOptions(
                                {},
                                {
                                    jira: {
                                        projectKey: "PRJ",
                                        url: "https://example.org",
                                        fields: {
                                            labels: {
                                                name: "Stichworte",
                                            },
                                        },
                                    },
                                }
                            );
                            expect(options.jira.fields.labels.name).to.eq("Stichworte");
                        });
                    });
                    describe("summary", () => {
                        it("name", () => {
                            const options = initOptions(
                                {},
                                {
                                    jira: {
                                        projectKey: "PRJ",
                                        url: "https://example.org",
                                        fields: {
                                            summary: {
                                                name: "Résumé",
                                            },
                                        },
                                    },
                                }
                            );
                            expect(options.jira.fields.summary.name).to.eq("Résumé");
                        });
                    });
                    describe("testPlan", () => {
                        it("name", () => {
                            const options = initOptions(
                                {},
                                {
                                    jira: {
                                        projectKey: "PRJ",
                                        url: "https://example.org",
                                        fields: {
                                            testPlan: {
                                                name: "Plan de Test",
                                            },
                                        },
                                    },
                                }
                            );
                            expect(options.jira.fields.testPlan.name).to.eq("Plan de Test");
                        });
                    });
                    describe("testType", () => {
                        it("name", () => {
                            const options = initOptions(
                                {},
                                {
                                    jira: {
                                        projectKey: "PRJ",
                                        url: "https://example.org",
                                        fields: {
                                            testType: {
                                                name: "Xray Test Type",
                                            },
                                        },
                                    },
                                }
                            );
                            expect(options.jira.fields.testType.name).to.eq("Xray Test Type");
                        });
                    });
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
                it("testPlanIssueType", () => {
                    const options = initOptions(
                        {},
                        {
                            jira: {
                                projectKey: "PRJ",
                                testPlanIssueType: "Plan Ticket",
                                url: "https://example.org",
                            },
                        }
                    );
                    expect(options.jira.testPlanIssueType).to.eq("Plan Ticket");
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
        describe("should prefer environment variables over provided values", () => {
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

                describe("fields", () => {
                    describe("description", () => {
                        it("JIRA_FIELDS_DESCRIPTION_ID", () => {
                            const env = {
                                JIRA_FIELDS_DESCRIPTION_ID: "customfield_98765",
                            };
                            const options = initOptions(env, {
                                jira: {
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                    fields: {
                                        description: {
                                            id: "customfield_12345",
                                        },
                                    },
                                },
                            });
                            expect(options.jira.fields.description.id).to.eq("customfield_98765");
                        });
                        it("JIRA_FIELDS_DESCRIPTION_NAME", () => {
                            const env = {
                                JIRA_FIELDS_DESCRIPTION_NAME: "Beschreibung",
                            };
                            const options = initOptions(env, {
                                jira: {
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                    fields: {
                                        description: {
                                            name: "Issue Description",
                                        },
                                    },
                                },
                            });
                            expect(options.jira.fields.description.name).to.eq("Beschreibung");
                        });
                    });
                    describe("labels", () => {
                        it("JIRA_FIELDS_LABELS_ID", () => {
                            const env = {
                                JIRA_FIELDS_LABELS_ID: "customfield_98765",
                            };
                            const options = initOptions(env, {
                                jira: {
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                    fields: {
                                        labels: {
                                            id: "customfield_12345",
                                        },
                                    },
                                },
                            });
                            expect(options.jira.fields.labels.id).to.eq("customfield_98765");
                        });
                        it("JIRA_FIELDS_LABELS_NAME", () => {
                            const env = {
                                JIRA_FIELDS_LABELS_NAME: "Stichworte",
                            };
                            const options = initOptions(env, {
                                jira: {
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                    fields: {
                                        labels: {
                                            name: "Issue Labels",
                                        },
                                    },
                                },
                            });
                            expect(options.jira.fields.labels.name).to.eq("Stichworte");
                        });
                    });
                    describe("summary", () => {
                        it("JIRA_FIELDS_SUMMARY_ID", () => {
                            const env = {
                                JIRA_FIELDS_SUMMARY_ID: "customfield_98765",
                            };
                            const options = initOptions(env, {
                                jira: {
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                    fields: {
                                        summary: {
                                            id: "customfield_12345",
                                        },
                                    },
                                },
                            });
                            expect(options.jira.fields.summary.id).to.eq("customfield_98765");
                        });
                        it("JIRA_FIELDS_SUMMARY_NAME", () => {
                            const env = {
                                JIRA_FIELDS_SUMMARY_NAME: "Résumé",
                            };
                            const options = initOptions(env, {
                                jira: {
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                    fields: {
                                        summary: {
                                            name: "Issue Summary",
                                        },
                                    },
                                },
                            });
                            expect(options.jira.fields.summary.name).to.eq("Résumé");
                        });
                    });
                    describe("testPlan", () => {
                        it("JIRA_FIELDS_TEST_PLAN_ID", () => {
                            const env = {
                                JIRA_FIELDS_TEST_PLAN_ID: "customfield_98765",
                            };
                            const options = initOptions(env, {
                                jira: {
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                    fields: {
                                        testPlan: {
                                            id: "customfield_12345",
                                        },
                                    },
                                },
                            });
                            expect(options.jira.fields.testPlan.id).to.eq("customfield_98765");
                        });
                        it("JIRA_FIELDS_TEST_PLAN_NAME", () => {
                            const env = {
                                JIRA_FIELDS_TEST_PLAN_NAME: "Plan de Test",
                            };
                            const options = initOptions(env, {
                                jira: {
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                    fields: {
                                        testPlan: {
                                            name: "Issue Test Plan",
                                        },
                                    },
                                },
                            });
                            expect(options.jira.fields.testPlan.name).to.eq("Plan de Test");
                        });
                    });
                    describe("testType", () => {
                        it("JIRA_FIELDS_TEST_TYPE_ID", () => {
                            const env = {
                                JIRA_FIELDS_TEST_TYPE_ID: "customfield_98765",
                            };
                            const options = initOptions(env, {
                                jira: {
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                    fields: {
                                        testType: {
                                            id: "customfield_12345",
                                        },
                                    },
                                },
                            });
                            expect(options.jira.fields.testType.id).to.eq("customfield_98765");
                        });
                        it("JIRA_FIELDS_TEST_TYPE_NAME", () => {
                            const env = {
                                JIRA_FIELDS_TEST_TYPE_NAME: "Xray Test Type",
                            };
                            const options = initOptions(env, {
                                jira: {
                                    projectKey: "PRJ",
                                    url: "https://example.org",
                                    fields: {
                                        testType: {
                                            name: "Issue Test Type",
                                        },
                                    },
                                },
                            });
                            expect(options.jira.fields.testType.name).to.eq("Xray Test Type");
                        });
                    });
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

                it("JIRA_TEST_EXECUTION_ISSUE_TYPE", () => {
                    const env = {
                        JIRA_TEST_EXECUTION_ISSUE_TYPE: "Execution Issue",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            testExecutionIssueType: "Execution",
                            url: "https://example.org",
                        },
                    });
                    expect(options.jira.testExecutionIssueType).to.eq("Execution Issue");
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

                it("JIRA_TEST_PLAN_ISSUE_TYPE", () => {
                    const env = {
                        JIRA_TEST_PLAN_ISSUE_TYPE: "Plan Issue",
                    };
                    const options = initOptions(env, {
                        jira: {
                            projectKey: "CYP",
                            testExecutionIssueType: "Plan",
                            url: "https://example.org",
                        },
                    });
                    expect(options.jira.testPlanIssueType).to.eq("Plan Issue");
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
        it("should detect unset project keys", async () => {
            expect(() =>
                verifyOptions({
                    jira: {
                        projectKey: undefined,
                        url: "https://example.org",
                    },
                })
            ).to.throw("Plugin misconfiguration: Jira project key was not set");
        });
        it("should detect mismatched test execution issue keys", async () => {
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
        it("should detect mismatched test plan issue keys", async () => {
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
    describe("the clients instantiation", () => {
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

        it("should detect cloud credentials", () => {
            const env = {
                JIRA_USERNAME: "user@somewhere.xyz",
                JIRA_API_TOKEN: "1337",
                XRAY_CLIENT_ID: "abc",
                XRAY_CLIENT_SECRET: "xyz",
            };
            const { stubbedInfo } = stubLogging();
            const { jiraClient, xrayClient } = initClients(options, env);
            expect(jiraClient.getCredentials()).to.be.an.instanceof(BasicAuthCredentials);
            expect(xrayClient.getCredentials()).to.be.an.instanceof(JWTCredentials);
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira username and API token found. Setting up Jira cloud basic auth credentials"
            );
            expect(stubbedInfo).to.have.been.calledWith(
                "Xray client ID and client secret found. Setting up Xray cloud JWT credentials"
            );
        });

        it("should throw for missing xray cloud credentials", () => {
            const env = {
                JIRA_USERNAME: "user@somewhere.xyz",
                JIRA_API_TOKEN: "1337",
            };
            const { stubbedInfo } = stubLogging();
            expect(() => initClients(options, env)).to.throw(
                dedent(`
                    Failed to configure Xray client: Jira cloud credentials detected, but the provided Xray credentials are not Xray cloud credentials
                    You can find all configurations currently supported at: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/
                `)
            );
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira username and API token found. Setting up Jira cloud basic auth credentials"
            );
        });

        it("should detect PAT credentials", () => {
            const env = {
                JIRA_API_TOKEN: "1337",
            };
            const { stubbedInfo } = stubLogging();
            const { jiraClient, xrayClient } = initClients(options, env);
            expect(jiraClient).to.be.an.instanceof(JiraClientServer);
            expect(xrayClient).to.be.an.instanceof(XrayClientServer);
            expect(jiraClient.getCredentials()).to.be.an.instanceof(PATCredentials);
            expect(xrayClient.getCredentials()).to.be.an.instanceof(PATCredentials);
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira PAT found. Setting up Jira server PAT credentials"
            );
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira PAT found. Setting up Xray server PAT credentials"
            );
        });

        it("should detect basic auth credentials", () => {
            const env = {
                JIRA_USERNAME: "user",
                JIRA_PASSWORD: "1337",
            };
            const { stubbedInfo } = stubLogging();
            const { jiraClient, xrayClient } = initClients(options, env);
            expect(jiraClient).to.be.an.instanceof(JiraClientServer);
            expect(xrayClient).to.be.an.instanceof(XrayClientServer);
            expect(jiraClient.getCredentials()).to.be.an.instanceof(BasicAuthCredentials);
            expect(xrayClient.getCredentials()).to.be.an.instanceof(BasicAuthCredentials);
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira username and password found. Setting up Jira server basic auth credentials"
            );
            expect(stubbedInfo).to.have.been.calledWith(
                "Jira username and password found. Setting up Xray server basic auth credentials"
            );
        });

        it("should choose cloud credentials over server credentials", () => {
            const env = {
                JIRA_USERNAME: "user",
                JIRA_PASSWORD: "xyz",
                JIRA_API_TOKEN: "1337",
                XRAY_CLIENT_ID: "abc",
                XRAY_CLIENT_SECRET: "xyz",
            };
            stubLogging();
            const { jiraClient, xrayClient } = initClients(options, env);
            expect(jiraClient).to.be.an.instanceof(JiraClientCloud);
            expect(xrayClient).to.be.an.instanceof(XrayClientCloud);
            expect(jiraClient.getCredentials()).to.be.an.instanceof(BasicAuthCredentials);
            expect(xrayClient.getCredentials()).to.be.an.instanceof(JWTCredentials);
        });
        it("should throw an error for missing jira urls", () => {
            options.jira.url = undefined;
            expect(() => initClients(options, {})).to.throw(
                dedent(`
                    Failed to configure Jira client: no Jira URL was provided
                    Make sure Jira was configured correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#jira
                `)
            );
        });

        it("should throw an error for missing credentials", () => {
            expect(() => initClients(options, {})).to.throw(
                dedent(`
                    Failed to configure Jira client: no viable authentication method was configured
                    You can find all configurations currently supported at: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/
                `)
            );
        });
    });
});
