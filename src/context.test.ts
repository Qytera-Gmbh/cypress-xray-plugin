import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import { stub } from "sinon";
import { getMockedLogger, getMockedRestClient } from "../test/mocks.js";
import {
    BasicAuthCredentials,
    JwtCredentials,
    PatCredentials,
} from "./client/authentication/credentials.js";
import { BaseJiraClient } from "./client/jira/jira-client.js";
import { XrayClientCloud } from "./client/xray/xray-client-cloud.js";
import { ServerClient } from "./client/xray/xray-client-server.js";
import {
    PluginContext,
    SimpleEvidenceCollection,
    initClients,
    initCucumberOptions,
    initHttpClients,
    initJiraOptions,
    initPluginOptions,
    initXrayOptions,
} from "./context.js";

import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import { relative } from "node:path";
import { AxiosRestClient } from "./client/https/https.js";
import type { User } from "./types/jira/responses/user.js";
import type {
    InternalCucumberOptions,
    InternalHttpOptions,
    InternalJiraOptions,
    InternalPluginOptions,
    InternalXrayOptions,
} from "./types/plugin.js";
import { dedent } from "./util/dedent.js";
import * as dependencies from "./util/dependencies.js";
import { ExecutableGraph } from "./util/graph/executable-graph.js";
import { CapturingLogger, Level } from "./util/logging.js";

chai.use(chaiAsPromised);

await describe(relative(cwd(), import.meta.filename), async () => {
    await describe("the plugin context configuration", async () => {
        await describe("the option initialization", async () => {
            await describe("should have certain default values", async () => {
                await describe("jira", async () => {
                    const jiraOptions: InternalJiraOptions = initJiraOptions(
                        {},
                        {
                            projectKey: "PRJ",
                            url: "https://example.org",
                        }
                    );
                    await it("attachVideos", () => {
                        expect(jiraOptions.attachVideos).to.eq(false);
                    });
                    await describe("fields", async () => {
                        await it("testEnvironments", () => {
                            expect(jiraOptions.fields.testEnvironments).to.eq(undefined);
                        });
                        await it("testPlan", () => {
                            expect(jiraOptions.fields.testPlan).to.eq(undefined);
                        });
                    });
                    await it("testExecutionIssue", () => {
                        expect(jiraOptions.testExecutionIssue).to.eq(undefined);
                    });
                    await it("testPlanIssueKey", () => {
                        expect(jiraOptions.testPlanIssueKey).to.eq(undefined);
                    });
                });

                await describe("plugin", async () => {
                    const pluginOptions: InternalPluginOptions = initPluginOptions({}, {});
                    await it("debug", () => {
                        expect(pluginOptions.debug).to.eq(false);
                    });
                    await it("enabled", () => {
                        expect(pluginOptions.enabled).to.eq(true);
                    });
                    await it("logDirectory", () => {
                        expect(pluginOptions.logDirectory).to.eq("logs");
                    });
                    await it("normalizeScreenshotNames", () => {
                        expect(pluginOptions.normalizeScreenshotNames).to.eq(false);
                    });
                });

                await describe("xray", async () => {
                    const xrayOptions: InternalXrayOptions = initXrayOptions({}, {});
                    await describe("status", async () => {
                        await it("failed", () => {
                            expect(xrayOptions.status.failed).to.eq(undefined);
                        });
                        await it("passed", () => {
                            expect(xrayOptions.status.passed).to.eq(undefined);
                        });
                        await it("pending", () => {
                            expect(xrayOptions.status.pending).to.eq(undefined);
                        });
                        await it("skipped", () => {
                            expect(xrayOptions.status.skipped).to.eq(undefined);
                        });
                        await describe("step", async () => {
                            await it("failed", () => {
                                expect(xrayOptions.status.step?.failed).to.eq(undefined);
                            });
                            await it("passed", () => {
                                expect(xrayOptions.status.step?.passed).to.eq(undefined);
                            });
                            await it("pending", () => {
                                expect(xrayOptions.status.step?.pending).to.eq(undefined);
                            });
                            await it("skipped", () => {
                                expect(xrayOptions.status.step?.skipped).to.eq(undefined);
                            });
                        });
                    });
                    await it("testEnvironments", () => {
                        expect(xrayOptions.testEnvironments).to.eq(undefined);
                    });
                    await it("uploadResults", () => {
                        expect(xrayOptions.uploadResults).to.eq(true);
                    });
                    await it("uploadScreenshots", () => {
                        expect(xrayOptions.uploadScreenshots).to.eq(true);
                    });
                });

                await describe("cucumber", async () => {
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
                    await it("downloadFeatures", () => {
                        expect(cucumberOptions?.downloadFeatures).to.eq(false);
                    });

                    await describe("prefixes", async () => {
                        await it("precondition", () => {
                            expect(cucumberOptions?.prefixes.precondition).to.eq(undefined);
                        });
                        await it("test", () => {
                            expect(cucumberOptions?.prefixes.test).to.eq(undefined);
                        });
                    });
                    await it("uploadFeatures", () => {
                        expect(cucumberOptions?.uploadFeatures).to.eq(false);
                    });
                });
            });
            await describe("should prefer provided values over default ones", async () => {
                await describe("jira", async () => {
                    await it("attachVideos", () => {
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
                    await describe("fields", async () => {
                        await it("testEnvironments", () => {
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
                        await it("testPlan", () => {
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
                    await it("testExecutionIssue", () => {
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
                    await it("testPlanIssueKey", () => {
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
                    await it("url", () => {
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

                await describe("plugin", async () => {
                    await it("debug", () => {
                        const pluginOptions = initPluginOptions(
                            {},
                            {
                                debug: true,
                            }
                        );
                        expect(pluginOptions.debug).to.eq(true);
                    });
                    await it("enabled", () => {
                        const pluginOptions = initPluginOptions(
                            {},
                            {
                                enabled: false,
                            }
                        );
                        expect(pluginOptions.enabled).to.eq(false);
                    });
                    await it("logDirectory", () => {
                        const pluginOptions = initPluginOptions(
                            {},
                            {
                                logDirectory: "./logs/",
                            }
                        );
                        expect(pluginOptions.logDirectory).to.eq("./logs/");
                    });
                    await it("normalizeScreenshotNames", () => {
                        const pluginOptions = initPluginOptions(
                            {},
                            {
                                normalizeScreenshotNames: true,
                            }
                        );
                        expect(pluginOptions.normalizeScreenshotNames).to.eq(true);
                    });
                });

                await describe("xray", async () => {
                    await describe("status", async () => {
                        await it("failed", () => {
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
                        await it("passed", () => {
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
                        await it("pending", () => {
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
                        await it("skipped", () => {
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
                        await describe("step", async () => {
                            await it("failed", () => {
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
                            await it("passed", () => {
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
                            await it("pending", () => {
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
                            await it("skipped", () => {
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

                    await it("testEnvironments", () => {
                        const xrayOptions = initXrayOptions(
                            {},
                            {
                                testEnvironments: ["Test", "Prod"],
                            }
                        );
                        expect(xrayOptions.testEnvironments).to.deep.eq(["Test", "Prod"]);
                    });

                    await it("uploadResults", () => {
                        const xrayOptions = initXrayOptions(
                            {},
                            {
                                uploadResults: false,
                            }
                        );
                        expect(xrayOptions.uploadResults).to.eq(false);
                    });

                    await it("uploadScreenshots", () => {
                        const xrayOptions = initXrayOptions(
                            {},
                            {
                                uploadScreenshots: false,
                            }
                        );
                        expect(xrayOptions.uploadScreenshots).to.eq(false);
                    });
                });

                await describe("cucumber", async () => {
                    await it("downloadFeatures", async () => {
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
                    await describe("prefixes", async () => {
                        await it("precondition", async () => {
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
                        await it("test", async () => {
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
                    await it("uploadFeatures", async () => {
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
            await describe("should prefer environment variables over provided values", async () => {
                await describe("jira", async () => {
                    await it("JIRA_PROJECT_KEY", () => {
                        const env = {
                            ["JIRA_PROJECT_KEY"]: "ABC",
                        };
                        const jiraOptions = initJiraOptions(env, {
                            projectKey: "CYP",
                            url: "https://example.org",
                        });
                        expect(jiraOptions.projectKey).to.eq("ABC");
                    });

                    await it("JIRA_ATTACH_VIDEOS", () => {
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

                    await describe("fields", async () => {
                        await it("JIRA_FIELDS_TEST_ENVIRONMENTS", () => {
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

                        await it("JIRA_FIELDS_TEST_PLAN", () => {
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

                    await it("JIRA_TEST_EXECUTION_ISSUE", () => {
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

                    await it("JIRA_TEST_PLAN_ISSUE_KEY", () => {
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

                    await it("JIRA_URL", () => {
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
                await describe("xray", async () => {
                    await it("XRAY_STATUS_FAILED", () => {
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

                    await it("XRAY_STATUS_PASSED", () => {
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

                    await it("XRAY_STATUS_PENDING", () => {
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

                    await it("XRAY_STATUS_SKIPPED", () => {
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

                    await it("XRAY_STATUS_STEP_FAILED", () => {
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

                    await it("XRAY_STATUS_STEP_PASSED", () => {
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

                    await it("XRAY_STATUS_STEP_PENDING", () => {
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

                    await it("XRAY_STATUS_STEP_SKIPPED", () => {
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

                    await it("XRAY_TEST_ENVIRONMENTS", () => {
                        const env = {
                            ["XRAY_TEST_ENVIRONMENTS"]: [false, "bonjour", 5],
                        };
                        const xrayOptions = initXrayOptions(env, {
                            testEnvironments: ["A", "B", "C"],
                        });
                        expect(xrayOptions.testEnvironments).to.deep.eq(["false", "bonjour", "5"]);
                    });

                    await it("XRAY_UPLOAD_RESULTS", () => {
                        const env = {
                            ["XRAY_UPLOAD_RESULTS"]: "false",
                        };
                        const xrayOptions = initXrayOptions(env, {
                            uploadResults: true,
                        });
                        expect(xrayOptions.uploadResults).to.be.false;
                    });

                    await it("XRAY_UPLOAD_SCREENSHOTS", () => {
                        const env = {
                            ["XRAY_UPLOAD_SCREENSHOTS"]: "false",
                        };
                        const xrayOptions = initXrayOptions(env, {
                            uploadScreenshots: true,
                        });
                        expect(xrayOptions.uploadScreenshots).to.be.false;
                    });
                });
                await describe("cucumber", async () => {
                    await it("CUCUMBER_FEATURE_FILE_EXTENSION", async () => {
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

                    await it("CUCUMBER_DOWNLOAD_FEATURES", async () => {
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

                    await it("CUCUMBER_PREFIXES_PRECONDITION", async () => {
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

                    await it("CUCUMBER_PREFIXES_TEST", async () => {
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

                    await it("CUCUMBER_UPLOAD_FEATURES", async () => {
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
                await describe("plugin", async () => {
                    await it("PLUGIN_DEBUG", () => {
                        const env = {
                            ["PLUGIN_DEBUG"]: "true",
                        };
                        const pluginOptions = initPluginOptions(env, {
                            debug: false,
                        });
                        expect(pluginOptions.debug).to.be.true;
                    });

                    await it("PLUGIN_ENABLED", () => {
                        const env = {
                            ["PLUGIN_ENABLED"]: "false",
                        };
                        const pluginOptions = initPluginOptions(env, {
                            enabled: true,
                        });
                        expect(pluginOptions.enabled).to.be.false;
                    });

                    await it("PLUGIN_LOG_DIRECTORY", () => {
                        const env = {
                            ["PLUGIN_LOG_DIRECTORY"]: "/home/logs/cypress-xray-plugin",
                        };
                        const pluginOptions = initPluginOptions(env, {
                            logDirectory: "./logging/subdirectory",
                        });
                        expect(pluginOptions.logDirectory).to.eq("/home/logs/cypress-xray-plugin");
                    });

                    await it("PLUGIN_NORMALIZE_SCREENSHOT_NAMES", () => {
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
            await describe("detects invalid configurations", async () => {
                await it("detects unset project keys", () => {
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
                await it("throws if the cucumber preprocessor is not installed", async () => {
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
                await it("detects if the cucumber preprocessor json report is not enabled", async () => {
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
                await it("detects if the cucumber preprocessor json report path was not set", async () => {
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

        await describe("the http clients instantiation", async () => {
            await it("creates a single client by default", () => {
                const httpClients = initHttpClients(undefined, undefined);
                expect(httpClients.jira).to.eq(httpClients.xray);
                expect(httpClients.jira).to.deep.eq(new AxiosRestClient({ debug: undefined }));
            });
            await it("sets debugging to true if enabled", () => {
                const httpClients = initHttpClients({ debug: true }, undefined);
                expect(httpClients.jira).to.eq(httpClients.xray);
                expect(httpClients.jira).to.deep.eq(new AxiosRestClient({ debug: true }));
            });
            await it("sets debugging to false if disabled", () => {
                const httpClients = initHttpClients({ debug: false }, undefined);
                expect(httpClients.jira).to.eq(httpClients.xray);
                expect(httpClients.jira).to.deep.eq(new AxiosRestClient({ debug: false }));
            });
            await it("creates a single client if empty options are passed", () => {
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
            await it("creates a single client using a single config", () => {
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
            await it("creates a different jira client if a jira config is passed", () => {
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
            await it("creates a different xray client if an xray config is passed", () => {
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
            await it("creates different clients if individual configs are passed", () => {
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
            await it("passes common http options to both clients", () => {
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
            await it("prefers individual http options to common ones", () => {
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

        await describe("the clients instantiation", async () => {
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

            await it("should detect cloud credentials", async () => {
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

            await it("should throw for missing xray cloud credentials", async () => {
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

            await it("should detect PAT credentials", async () => {
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

            await it("should detect basic auth credentials", async () => {
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

            await it("should choose cloud credentials over server credentials", async () => {
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

            await it("should throw an error for missing credentials", async () => {
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

            await it("throws if no user details are returned from jira", async () => {
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

            await it("throws if no usernames are returned from jira", async () => {
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

            await it("throws if no license data is returned from xray server", async () => {
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

            await it("throws if an inactive license is returned from xray server", async () => {
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

            await it("throws if the xray credentials are invalid", async () => {
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

    await describe(SimpleEvidenceCollection.name, async () => {
        await it("collects evidence for single tests", () => {
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

        await it("collects evidence for multiple tests", () => {
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

        await it("returns an empty array for unknown tests", () => {
            const evidenceCollection = new SimpleEvidenceCollection();
            evidenceCollection.addEvidence("CYP-123", {
                contentType: "application/json",
                data: "WyJoZWxsbyJd",
                filename: "hello.json",
            });
            expect(evidenceCollection.getEvidence("CYP-456")).to.deep.eq([]);
        });
    });

    await describe(PluginContext.name, async () => {
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

        await it("collects evidence for single tests", () => {
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

        await it("collects evidence for multiple tests", () => {
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

        await it("returns an empty array for unknown tests", () => {
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
