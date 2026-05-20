import assert from "node:assert";
import fs from "node:fs";
import { relative, resolve } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import {
    faker,
    generateFakeClientCombination,
    generateFakeExternalPluginOptions,
    generateFakeFileObject,
    generateFakeInternalPluginOptions,
    generateFakeIssueKey,
    generateFakePluginIssueUpdate,
} from "../test/faker";
import { stub } from "../test/mocks";
import { mockedCypressEventEmitter } from "../test/util";
import { configureXrayPlugin, syncFeatureFile } from "./main";
import type {
    CypressFailedRunResult,
    CypressRunResult,
    PluginConfigOptions,
} from "./models/cypress";
import type { PluginOptions } from "./models/plugin";
import globalContext, { PluginContext } from "./plugin/context";
import cypressXrayPlugin from "./plugin/cypress-xray-plugin";
import { dedent } from "./util/dedent";
import { LOG } from "./util/logging";

void describe(relative(cwd(), __filename), () => {
    let config: PluginConfigOptions<">=14">;

    beforeEach(() => {
        config = JSON.parse(
            fs.readFileSync("./test/resources/cypress.config.json", "utf-8")
        ) as PluginConfigOptions<">=14">;
    });

    void describe(configureXrayPlugin.name, () => {
        void it("registers tasks only if disabled", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const mockedOn = context.mock.fn();
            await configureXrayPlugin(mockedOn, config, {
                jira: {
                    projectKey: "ABC",
                    url: "http://localhost:1234",
                },
                plugin: {
                    enabled: false,
                },
            });
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "info",
                "Plugin disabled. Skipping further configuration.",
            ]);
            assert.strictEqual(mockedOn.mock.callCount(), 1);
            assert.strictEqual(mockedOn.mock.calls[0].arguments[0], "task");
        });

        void it("registers tasks only if run in interactive mode", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const mockedOn = context.mock.fn();
            config.isTextTerminal = false;
            await configureXrayPlugin(mockedOn, config, {
                jira: {
                    projectKey: "ABC",
                    url: "http://localhost:1234",
                },
            });
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "info",
                "Interactive mode detected, disabling plugin.",
            ]);
            assert.strictEqual(mockedOn.mock.callCount(), 1);
            assert.strictEqual(mockedOn.mock.calls[0].arguments[0], "task");
        });

        void it("initializes the plugin context with the provided options", async (context) => {
            const { clients, httpClients } = generateFakeClientCombination();
            const externalOptions = generateFakeExternalPluginOptions({
                plugin: {
                    enabled: true,
                    listenerDefault:
                        context.mock.fn<Exclude<PluginOptions["listener"], undefined>>(),
                },
            });
            const internalOptions = generateFakeInternalPluginOptions(externalOptions);
            const pluginContext = new PluginContext(internalOptions);
            context.mock.method(LOG, "message", context.mock.fn());
            const initPluginOptionsMock = context.mock.method(
                globalContext,
                "initPluginOptions",
                () => internalOptions.plugin
            );
            const initCucumberOptionsMock = context.mock.method(
                globalContext,
                "initCucumberOptions",
                () => internalOptions.cucumber
            );
            const initJiraOptionsMock = context.mock.method(
                globalContext,
                "initJiraOptions",
                () => internalOptions.jira
            );
            const initXrayOptionsMock = context.mock.method(
                globalContext,
                "initXrayOptions",
                () => internalOptions.xray
            );
            const initHttpClientsMock = context.mock.method(
                globalContext,
                "initHttpClients",
                () => httpClients
            );
            const initClientsMock = context.mock.method(
                globalContext,
                "initClients",
                () => clients
            );
            const initGlobalContextMock = context.mock.method(
                globalContext,
                "initGlobalContext",
                () => pluginContext
            );
            await configureXrayPlugin(context.mock.fn(), config, externalOptions);
            assert.deepStrictEqual(
                initPluginOptionsMock.mock.calls.map((call) => call.arguments),
                [[config.env, externalOptions.plugin]]
            );
            assert.deepStrictEqual(
                initCucumberOptionsMock.mock.calls.map((call) => call.arguments),
                [[config, externalOptions.cucumber]]
            );
            assert.deepStrictEqual(
                initJiraOptionsMock.mock.calls.map((call) => call.arguments),
                [[config.env, externalOptions.jira]]
            );
            assert.deepStrictEqual(
                initXrayOptionsMock.mock.calls.map((call) => call.arguments),
                [[config.env, externalOptions.xray]]
            );
            assert.deepStrictEqual(
                initHttpClientsMock.mock.calls.map((call) => call.arguments),
                [[internalOptions.plugin, internalOptions.http]]
            );
            assert.deepStrictEqual(
                initClientsMock.mock.calls.map((call) => call.arguments),
                [[internalOptions.jira, internalOptions.xray, config.env, httpClients]]
            );
            assert.deepStrictEqual(
                initGlobalContextMock.mock.calls.map((call) => call.arguments),
                [[internalOptions]]
            );
        });

        void it("initializes the logging module", async (context) => {
            const { clients, httpClients } = generateFakeClientCombination();
            const externalOptions = generateFakeExternalPluginOptions({
                plugin: {
                    enabled: true,
                    listenerDefault:
                        context.mock.fn<Exclude<PluginOptions["listener"], undefined>>(),
                },
            });
            const internalOptions = generateFakeInternalPluginOptions(externalOptions);
            context.mock.method(LOG, "message", context.mock.fn());
            const configureMock = context.mock.method(LOG, "configure", context.mock.fn());
            context.mock.method(globalContext, "initPluginOptions", () => internalOptions.plugin);
            context.mock.method(
                globalContext,
                "initCucumberOptions",
                () => internalOptions.cucumber
            );
            context.mock.method(globalContext, "initJiraOptions", () => internalOptions.jira);
            context.mock.method(globalContext, "initXrayOptions", () => internalOptions.xray);
            context.mock.method(globalContext, "initHttpClients", () => httpClients);
            context.mock.method(globalContext, "initClients", () => clients);
            await configureXrayPlugin(context.mock.fn(), config, externalOptions);
            assert.deepStrictEqual(
                configureMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        {
                            debug: internalOptions.plugin.debug,
                            logDirectory: internalOptions.plugin.logDirectory,
                            logger: internalOptions.plugin.logger,
                        },
                    ],
                ]
            );
        });

        void it("initializes the logging module with resolved relative paths", async (context) => {
            const { clients, httpClients } = generateFakeClientCombination();
            const logDirectory = `.${faker().system.directoryPath()}`;
            const externalOptions = generateFakeExternalPluginOptions({
                plugin: {
                    enabled: true,
                    listenerDefault:
                        context.mock.fn<Exclude<PluginOptions["listener"], undefined>>(),
                    logDirectory: logDirectory,
                },
            });
            const internalOptions = generateFakeInternalPluginOptions(externalOptions);
            context.mock.method(LOG, "message", context.mock.fn());
            const configureMock = context.mock.method(LOG, "configure", context.mock.fn());
            context.mock.method(globalContext, "initPluginOptions", () => internalOptions.plugin);
            context.mock.method(
                globalContext,
                "initCucumberOptions",
                () => internalOptions.cucumber
            );
            context.mock.method(globalContext, "initJiraOptions", () => internalOptions.jira);
            context.mock.method(globalContext, "initXrayOptions", () => internalOptions.xray);
            context.mock.method(globalContext, "initHttpClients", () => httpClients);
            context.mock.method(globalContext, "initClients", () => clients);
            await configureXrayPlugin(context.mock.fn(), config, externalOptions);
            assert.deepStrictEqual(
                configureMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        {
                            debug: internalOptions.plugin.debug,
                            logDirectory: resolve(config.projectRoot, logDirectory),
                            logger: internalOptions.plugin.logger,
                        },
                    ],
                ]
            );
        });

        void it("initializes the logging module without changing absolute paths", async (context) => {
            const { clients, httpClients } = generateFakeClientCombination();
            const logDirectory = faker().system.directoryPath();
            const externalOptions = generateFakeExternalPluginOptions({
                plugin: {
                    enabled: true,
                    listenerDefault:
                        context.mock.fn<Exclude<PluginOptions["listener"], undefined>>(),
                    logDirectory: logDirectory,
                },
            });
            const internalOptions = generateFakeInternalPluginOptions(externalOptions);
            context.mock.method(LOG, "message", context.mock.fn());
            const configureMock = context.mock.method(LOG, "configure", context.mock.fn());
            context.mock.method(globalContext, "initPluginOptions", () => internalOptions.plugin);
            context.mock.method(
                globalContext,
                "initCucumberOptions",
                () => internalOptions.cucumber
            );
            context.mock.method(globalContext, "initJiraOptions", () => internalOptions.jira);
            context.mock.method(globalContext, "initXrayOptions", () => internalOptions.xray);
            context.mock.method(globalContext, "initHttpClients", () => httpClients);
            context.mock.method(globalContext, "initClients", () => clients);
            await configureXrayPlugin(context.mock.fn(), config, externalOptions);
            assert.deepStrictEqual(
                configureMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        {
                            debug: internalOptions.plugin.debug,
                            logDirectory: logDirectory,
                            logger: internalOptions.plugin.logger,
                        },
                    ],
                ]
            );
        });

        void it("initializes the logging module with custom loggers", async (context) => {
            const { clients, httpClients } = generateFakeClientCombination();
            const logger = context.mock.fn();
            const externalOptions = generateFakeExternalPluginOptions({
                plugin: {
                    enabled: true,
                    listenerDefault:
                        context.mock.fn<Exclude<PluginOptions["listener"], undefined>>(),
                    logger: logger,
                },
            });
            const internalOptions = generateFakeInternalPluginOptions(externalOptions);
            context.mock.method(LOG, "message", context.mock.fn());
            const configureMock = context.mock.method(LOG, "configure", context.mock.fn());
            context.mock.method(globalContext, "initPluginOptions", () => internalOptions.plugin);
            context.mock.method(
                globalContext,
                "initCucumberOptions",
                () => internalOptions.cucumber
            );
            context.mock.method(globalContext, "initJiraOptions", () => internalOptions.jira);
            context.mock.method(globalContext, "initXrayOptions", () => internalOptions.xray);
            context.mock.method(globalContext, "initHttpClients", () => httpClients);
            context.mock.method(globalContext, "initClients", () => clients);
            await configureXrayPlugin(context.mock.fn(), config, externalOptions);
            assert.deepStrictEqual(
                configureMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        {
                            debug: internalOptions.plugin.debug,
                            logDirectory: internalOptions.plugin.logDirectory,
                            logger: logger,
                        },
                    ],
                ]
            );
        });

        void describe("runs the plugin with the correct arguments", () => {
            void it("without function parameters", async (context) => {
                const afterRunResult = JSON.parse(
                    fs.readFileSync("./test/resources/runResult.json", "utf-8")
                ) as CypressCommandLine.CypressRunResult;
                const { clients, httpClients } = generateFakeClientCombination();
                const testExecutionIssue = generateFakePluginIssueUpdate();
                const externalOptions = generateFakeExternalPluginOptions({
                    jira: { testExecutionIssue: testExecutionIssue },
                    plugin: {
                        enabled: true,
                        listenerDefault:
                            context.mock.fn<Exclude<PluginOptions["listener"], undefined>>(),
                    },
                });
                const internalOptions = generateFakeInternalPluginOptions(externalOptions);
                const pluginContext = new PluginContext(internalOptions);
                context.mock.method(LOG, "message", context.mock.fn());
                context.mock.method(
                    globalContext,
                    "initPluginOptions",
                    () => internalOptions.plugin
                );
                context.mock.method(
                    globalContext,
                    "initCucumberOptions",
                    () => internalOptions.cucumber
                );
                context.mock.method(globalContext, "initJiraOptions", () => internalOptions.jira);
                context.mock.method(globalContext, "initXrayOptions", () => internalOptions.xray);
                context.mock.method(globalContext, "initHttpClients", () => httpClients);
                context.mock.method(globalContext, "initClients", () => clients);
                const runPluginMock = context.mock.method(
                    cypressXrayPlugin,
                    "runPlugin",
                    context.mock.fn()
                );
                const mockedOn = context.mock.fn();
                await configureXrayPlugin(mockedOn, config, externalOptions);
                await (
                    mockedOn.mock.calls[2].arguments[1] as (
                        results: CypressFailedRunResult | CypressRunResult
                    ) => Promise<void>
                )(afterRunResult);
                assert.deepStrictEqual(
                    runPluginMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                clients: { jira: clients.jiraClient, xray: clients.xrayClient },
                                context: {
                                    emitter: pluginContext.getEventEmitter(),
                                    evidence: pluginContext.getEvidenceCollection(),
                                    featureFilePaths: pluginContext.getFeatureFiles(),
                                    iterationParameters:
                                        pluginContext.getIterationParameterCollection(),
                                    screenshots: pluginContext
                                        .getScreenshotCollection()
                                        .getScreenshots(),
                                },
                                cypress: { config: config, results: afterRunResult },
                                isCloudEnvironment: clients.kind === "cloud",
                                logger: pluginContext.getLogger(),
                                options: {
                                    cucumber: {
                                        featureFileExtension:
                                            internalOptions.cucumber?.featureFileExtension,
                                        prefixes: internalOptions.cucumber?.prefixes,
                                        preprocessor: internalOptions.cucumber?.preprocessor,
                                    },
                                    jira: {
                                        attachVideos: internalOptions.jira.attachVideos,
                                        fields: {
                                            testEnvironments:
                                                internalOptions.jira.fields.testEnvironments,
                                            testPlan: internalOptions.jira.fields.testPlan,
                                        },
                                        projectKey: internalOptions.jira.projectKey,
                                        testExecutionIssue: {
                                            ...testExecutionIssue,
                                            fields: {
                                                issuetype: {
                                                    name: internalOptions.jira
                                                        .testExecutionIssueType,
                                                },
                                                summary:
                                                    internalOptions.jira.testExecutionIssueSummary,
                                                ...testExecutionIssue.fields,
                                            },
                                            key:
                                                testExecutionIssue.key ??
                                                internalOptions.jira.testExecutionIssueKey,
                                            testEnvironments: internalOptions.xray.testEnvironments,
                                            testPlan: internalOptions.jira.testPlanIssueKey,
                                        },
                                        url: internalOptions.jira.url,
                                    },
                                    plugin: {
                                        normalizeScreenshotNames:
                                            internalOptions.plugin.normalizeScreenshotNames,
                                        splitUpload: internalOptions.plugin.splitUpload,
                                        uploadLastAttempt: internalOptions.plugin.uploadLastAttempt,
                                    },
                                    xray: {
                                        status: internalOptions.xray.status,
                                        uploadResults: internalOptions.xray.uploadResults,
                                        uploadScreenshots: internalOptions.xray.uploadScreenshots,
                                    },
                                },
                            },
                        ],
                    ]
                );
            });

            void it("resolves test execution issue data", async (context) => {
                const afterRunResult = JSON.parse(
                    fs.readFileSync("./test/resources/runResult.json", "utf-8")
                ) as CypressCommandLine.CypressRunResult;
                const { clients, httpClients } = generateFakeClientCombination();
                const testExecutionIssue = generateFakePluginIssueUpdate();
                const testExecutionIssueMock = context.mock.fn(() =>
                    Promise.resolve(testExecutionIssue)
                );
                const externalOptions = generateFakeExternalPluginOptions({
                    jira: { testExecutionIssue: testExecutionIssueMock },
                    plugin: {
                        enabled: true,
                        listenerDefault:
                            context.mock.fn<Exclude<PluginOptions["listener"], undefined>>(),
                    },
                });
                const internalOptions = generateFakeInternalPluginOptions(externalOptions);
                const pluginContext = new PluginContext(internalOptions);
                context.mock.method(LOG, "message", context.mock.fn());
                context.mock.method(
                    globalContext,
                    "initPluginOptions",
                    () => internalOptions.plugin
                );
                context.mock.method(
                    globalContext,
                    "initCucumberOptions",
                    () => internalOptions.cucumber
                );
                context.mock.method(globalContext, "initJiraOptions", () => internalOptions.jira);
                context.mock.method(globalContext, "initXrayOptions", () => internalOptions.xray);
                context.mock.method(globalContext, "initHttpClients", () => httpClients);
                context.mock.method(globalContext, "initClients", () => clients);
                const runPluginMock = context.mock.method(
                    cypressXrayPlugin,
                    "runPlugin",
                    context.mock.fn()
                );
                const mockedOn = context.mock.fn();
                await configureXrayPlugin(mockedOn, config, externalOptions);
                await (
                    mockedOn.mock.calls[2].arguments[1] as (
                        results: CypressFailedRunResult | CypressRunResult
                    ) => Promise<void>
                )(afterRunResult);
                assert.deepStrictEqual(
                    testExecutionIssueMock.mock.calls.map((call) => call.arguments),
                    [[{ results: afterRunResult }]]
                );
                assert.deepStrictEqual(
                    runPluginMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                clients: { jira: clients.jiraClient, xray: clients.xrayClient },
                                context: {
                                    emitter: pluginContext.getEventEmitter(),
                                    evidence: pluginContext.getEvidenceCollection(),
                                    featureFilePaths: pluginContext.getFeatureFiles(),
                                    iterationParameters:
                                        pluginContext.getIterationParameterCollection(),
                                    screenshots: pluginContext
                                        .getScreenshotCollection()
                                        .getScreenshots(),
                                },
                                cypress: { config: config, results: afterRunResult },
                                isCloudEnvironment: clients.kind === "cloud",
                                logger: pluginContext.getLogger(),
                                options: {
                                    cucumber: {
                                        featureFileExtension:
                                            internalOptions.cucumber?.featureFileExtension,
                                        prefixes: internalOptions.cucumber?.prefixes,
                                        preprocessor: internalOptions.cucumber?.preprocessor,
                                    },
                                    jira: {
                                        attachVideos: internalOptions.jira.attachVideos,
                                        fields: {
                                            testEnvironments:
                                                internalOptions.jira.fields.testEnvironments,
                                            testPlan: internalOptions.jira.fields.testPlan,
                                        },
                                        projectKey: internalOptions.jira.projectKey,
                                        testExecutionIssue: {
                                            ...testExecutionIssue,
                                            fields: {
                                                issuetype: {
                                                    name: internalOptions.jira
                                                        .testExecutionIssueType,
                                                },
                                                summary:
                                                    internalOptions.jira.testExecutionIssueSummary,
                                                ...testExecutionIssue.fields,
                                            },
                                            key:
                                                testExecutionIssue.key ??
                                                internalOptions.jira.testExecutionIssueKey,
                                            testEnvironments: internalOptions.xray.testEnvironments,
                                            testPlan: internalOptions.jira.testPlanIssueKey,
                                        },
                                        url: internalOptions.jira.url,
                                    },
                                    plugin: {
                                        normalizeScreenshotNames:
                                            internalOptions.plugin.normalizeScreenshotNames,
                                        splitUpload: internalOptions.plugin.splitUpload,
                                        uploadLastAttempt: internalOptions.plugin.uploadLastAttempt,
                                    },
                                    xray: {
                                        status: internalOptions.xray.status,
                                        uploadResults: internalOptions.xray.uploadResults,
                                        uploadScreenshots: internalOptions.xray.uploadScreenshots,
                                    },
                                },
                            },
                        ],
                    ]
                );
            });

            void it("resolves test plan issue keys", async (context) => {
                const afterRunResult = JSON.parse(
                    fs.readFileSync("./test/resources/runResult.json", "utf-8")
                ) as CypressCommandLine.CypressRunResult;
                const { clients, httpClients } = generateFakeClientCombination();
                const testPlanIssueKey = generateFakeIssueKey();
                const testPlanIssueKeyMock = context.mock.fn(() => testPlanIssueKey);
                const externalOptions = generateFakeExternalPluginOptions({
                    jira: { testExecutionIssue: null, testPlanIssueKey: testPlanIssueKeyMock },
                    plugin: {
                        enabled: true,
                        listenerDefault:
                            context.mock.fn<Exclude<PluginOptions["listener"], undefined>>(),
                    },
                });
                const internalOptions = generateFakeInternalPluginOptions(externalOptions);
                const pluginContext = new PluginContext(internalOptions);
                context.mock.method(LOG, "message", context.mock.fn());
                context.mock.method(
                    globalContext,
                    "initPluginOptions",
                    () => internalOptions.plugin
                );
                context.mock.method(
                    globalContext,
                    "initCucumberOptions",
                    () => internalOptions.cucumber
                );
                context.mock.method(globalContext, "initJiraOptions", () => internalOptions.jira);
                context.mock.method(globalContext, "initXrayOptions", () => internalOptions.xray);
                context.mock.method(globalContext, "initHttpClients", () => httpClients);
                context.mock.method(globalContext, "initClients", () => clients);
                const runPluginMock = context.mock.method(
                    cypressXrayPlugin,
                    "runPlugin",
                    context.mock.fn()
                );
                const mockedOn = context.mock.fn();
                await configureXrayPlugin(mockedOn, config, externalOptions);
                await (
                    mockedOn.mock.calls[2].arguments[1] as (
                        results: CypressFailedRunResult | CypressRunResult
                    ) => Promise<void>
                )(afterRunResult);
                assert.deepStrictEqual(
                    testPlanIssueKeyMock.mock.calls.map((call) => call.arguments),
                    [[{ results: afterRunResult }]]
                );
                assert.deepStrictEqual(
                    runPluginMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                clients: { jira: clients.jiraClient, xray: clients.xrayClient },
                                context: {
                                    emitter: pluginContext.getEventEmitter(),
                                    evidence: pluginContext.getEvidenceCollection(),
                                    featureFilePaths: pluginContext.getFeatureFiles(),
                                    iterationParameters:
                                        pluginContext.getIterationParameterCollection(),
                                    screenshots: pluginContext
                                        .getScreenshotCollection()
                                        .getScreenshots(),
                                },
                                cypress: { config: config, results: afterRunResult },
                                isCloudEnvironment: clients.kind === "cloud",
                                logger: pluginContext.getLogger(),
                                options: {
                                    cucumber: {
                                        featureFileExtension:
                                            internalOptions.cucumber?.featureFileExtension,
                                        prefixes: internalOptions.cucumber?.prefixes,
                                        preprocessor: internalOptions.cucumber?.preprocessor,
                                    },
                                    jira: {
                                        attachVideos: internalOptions.jira.attachVideos,
                                        fields: {
                                            testEnvironments:
                                                internalOptions.jira.fields.testEnvironments,
                                            testPlan: internalOptions.jira.fields.testPlan,
                                        },
                                        projectKey: internalOptions.jira.projectKey,
                                        testExecutionIssue: {
                                            fields: {
                                                issuetype: {
                                                    name: internalOptions.jira
                                                        .testExecutionIssueType,
                                                },
                                                summary:
                                                    internalOptions.jira.testExecutionIssueSummary,
                                            },
                                            key: internalOptions.jira.testExecutionIssueKey,
                                            testEnvironments: internalOptions.xray.testEnvironments,
                                            testPlan: testPlanIssueKey,
                                        },
                                        url: internalOptions.jira.url,
                                    },
                                    plugin: {
                                        normalizeScreenshotNames:
                                            internalOptions.plugin.normalizeScreenshotNames,
                                        splitUpload: internalOptions.plugin.splitUpload,
                                        uploadLastAttempt: internalOptions.plugin.uploadLastAttempt,
                                    },
                                    xray: {
                                        status: internalOptions.xray.status,
                                        uploadResults: internalOptions.xray.uploadResults,
                                        uploadScreenshots: internalOptions.xray.uploadScreenshots,
                                    },
                                },
                            },
                        ],
                    ]
                );
            });

            void it("forwards test plan issue keys from environment variables", async (context) => {
                const afterRunResult = JSON.parse(
                    fs.readFileSync("./test/resources/runResult.json", "utf-8")
                ) as CypressCommandLine.CypressRunResult;
                const { clients, httpClients } = generateFakeClientCombination();
                const testPlanIssueKey = generateFakeIssueKey();
                const externalOptions = generateFakeExternalPluginOptions({
                    plugin: { enabled: true },
                });
                const internalOptions = generateFakeInternalPluginOptions(externalOptions);
                context.mock.method(LOG, "message", context.mock.fn());
                context.mock.method(
                    globalContext,
                    "initPluginOptions",
                    () => internalOptions.plugin
                );
                context.mock.method(
                    globalContext,
                    "initCucumberOptions",
                    () => internalOptions.cucumber
                );
                context.mock.method(globalContext, "initJiraOptions", () => {
                    return { ...internalOptions.jira, testPlanIssueKey: testPlanIssueKey };
                });
                context.mock.method(globalContext, "initXrayOptions", () => internalOptions.xray);
                context.mock.method(globalContext, "initHttpClients", () => httpClients);
                context.mock.method(globalContext, "initClients", () => clients);
                const runPluginMock = context.mock.method(
                    cypressXrayPlugin,
                    "runPlugin",
                    context.mock.fn()
                );
                const mockedOn = context.mock.fn();
                await configureXrayPlugin(mockedOn, config, externalOptions);
                await (
                    mockedOn.mock.calls[2].arguments[1] as (
                        results: CypressFailedRunResult | CypressRunResult
                    ) => Promise<void>
                )(afterRunResult);
                assert.partialDeepStrictEqual(
                    runPluginMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                options: {
                                    jira: {
                                        testExecutionIssue: {
                                            testPlan: testPlanIssueKey,
                                        },
                                    },
                                },
                            },
                        ],
                    ]
                );
            });
        });

        void it("displays an error for failed runs", async (context) => {
            const { clients, httpClients } = generateFakeClientCombination();
            const externalOptions = generateFakeExternalPluginOptions({
                plugin: {
                    enabled: true,
                    listenerDefault:
                        context.mock.fn<Exclude<PluginOptions["listener"], undefined>>(),
                },
            });
            const internalOptions = generateFakeInternalPluginOptions(externalOptions);
            const failedResults: CypressFailedRunResult = {
                failures: faker().number.int(),
                message: faker().book.title(),
                status: "failed",
            };
            context.mock.method(globalContext, "initPluginOptions", () => internalOptions.plugin);
            context.mock.method(
                globalContext,
                "initCucumberOptions",
                () => internalOptions.cucumber
            );
            context.mock.method(globalContext, "initJiraOptions", () => internalOptions.jira);
            context.mock.method(globalContext, "initXrayOptions", () => internalOptions.xray);
            context.mock.method(globalContext, "initHttpClients", () => httpClients);
            context.mock.method(globalContext, "initClients", () => clients);
            const runPluginMock = context.mock.method(
                cypressXrayPlugin,
                "runPlugin",
                context.mock.fn()
            );
            const messageMock = context.mock.method(LOG, "message", context.mock.fn());
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", failedResults),
                config,
                externalOptions
            );
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    ["warning", "Encountered problems during plugin execution!"],
                    [
                        "error",
                        dedent(`
                            Skipping plugin execution: Failed to run ${failedResults.failures.toString()} tests.

                              ${failedResults.message}
                        `),
                    ],
                ]
            );
            assert.deepStrictEqual(
                runPluginMock.mock.calls.map((call) => call.arguments),
                []
            );
        });

        void it("does not display a warning if the plugin was configured but disabled", async (context) => {
            const externalOptions = generateFakeExternalPluginOptions({
                plugin: { enabled: false },
            });
            const messageMock = context.mock.method(LOG, "message", context.mock.fn());
            await configureXrayPlugin(mockedCypressEventEmitter, config, externalOptions);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [["info", "Plugin disabled. Skipping further configuration."]]
            );
        });

        void it("does not display an error for failed runs if disabled", async (context) => {
            const externalOptions = generateFakeExternalPluginOptions({
                plugin: { enabled: false },
            });
            const failedResults: CypressFailedRunResult = {
                failures: faker().number.int(),
                message: faker().book.title(),
                status: "failed",
            };
            const messageMock = context.mock.method(LOG, "message", context.mock.fn());
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", failedResults),
                config,
                externalOptions
            );
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [["info", "Plugin disabled. Skipping further configuration."]]
            );
        });

        void it("should skip the results upload if disabled", async (context) => {
            const externalOptions = generateFakeExternalPluginOptions({
                plugin: { enabled: false },
            });
            const failedResults: CypressFailedRunResult = {
                failures: faker().number.int(),
                message: faker().book.title(),
                status: "failed",
            };
            const messageMock = context.mock.method(LOG, "message", context.mock.fn());
            const runPluginMock = context.mock.method(cypressXrayPlugin, "runPlugin", stub());
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", failedResults),
                config,
                externalOptions
            );
            assert.deepStrictEqual(
                runPluginMock.mock.calls.map((call) => call.arguments),
                []
            );
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [["info", "Plugin disabled. Skipping further configuration."]]
            );
        });
    });

    void describe(syncFeatureFile.name, () => {
        void it("displays warnings if the plugin was not configured", (context) => {
            const file = generateFakeFileObject();
            const messageMock = context.mock.method(LOG, "message", context.mock.fn());
            context.mock.method(globalContext, "getGlobalContext", () => undefined);
            syncFeatureFile(file);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "warning",
                        dedent(`
                            ${file.filePath}

                              Skipping file:preprocessor hook: Plugin misconfigured: configureXrayPlugin() was not called.

                              Make sure your project is set up correctly: https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/introduction/
                        `),
                    ],
                ]
            );
        });

        void it("does not display a warning if the plugin was configured but disabled", (context) => {
            const file = generateFakeFileObject();
            const messageMock = context.mock.method(LOG, "message", context.mock.fn());
            const externalOptions = generateFakeExternalPluginOptions({
                plugin: { enabled: false },
            });
            const internalOptions = generateFakeInternalPluginOptions(externalOptions);
            const pluginContext = new PluginContext(internalOptions);
            context.mock.method(globalContext, "getGlobalContext", () => pluginContext);
            syncFeatureFile(file);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "info",
                        dedent(`
                            ${file.filePath}

                              Plugin disabled. Skipping feature file synchronization.
                        `),
                    ],
                ]
            );
        });

        void it("does not do anything if disabled", (context) => {
            const file = generateFakeFileObject();
            context.mock.method(LOG, "message", context.mock.fn());
            const externalOptions = generateFakeExternalPluginOptions({
                plugin: { enabled: false },
            });
            const internalOptions = generateFakeInternalPluginOptions(externalOptions);
            const pluginContext = new PluginContext(internalOptions);
            context.mock.method(globalContext, "getGlobalContext", () => pluginContext);
            syncFeatureFile(file);
            assert.deepStrictEqual(pluginContext.getFeatureFiles(), new Set());
        });

        void it("adds feature files to synchronize if enabled and the extension matches", (context) => {
            const fileExtension = faker().system.fileExt();
            const files = faker().helpers.multiple(
                () => generateFakeFileObject({ fileExtension: fileExtension }),
                { count: { max: 5, min: 1 } }
            );
            context.mock.method(LOG, "message", context.mock.fn());
            const externalOptions = generateFakeExternalPluginOptions({
                cucumber: { featureFileExtension: fileExtension, uploadFeatures: true },
                plugin: { enabled: true },
            });
            const internalOptions = generateFakeInternalPluginOptions(externalOptions);
            const pluginContext = new PluginContext(internalOptions);
            context.mock.method(globalContext, "getGlobalContext", () => pluginContext);
            for (const file of files) {
                syncFeatureFile(file);
            }
            assert.deepStrictEqual(
                pluginContext.getFeatureFiles(),
                new Set([...files.map((file) => file.filePath)])
            );
        });

        void it("does not add feature files to synchronize if disabled even if the extension matches", (context) => {
            const fileExtension = faker().system.fileExt();
            const files = faker().helpers.multiple(
                () => generateFakeFileObject({ fileExtension: fileExtension }),
                { count: { max: 5, min: 0 } }
            );
            context.mock.method(LOG, "message", context.mock.fn());
            const externalOptions = generateFakeExternalPluginOptions({
                cucumber: { featureFileExtension: fileExtension, uploadFeatures: false },
                plugin: { enabled: true },
            });
            const internalOptions = generateFakeInternalPluginOptions(externalOptions);
            const pluginContext = new PluginContext(internalOptions);
            context.mock.method(globalContext, "getGlobalContext", () => pluginContext);
            for (const file of files) {
                syncFeatureFile(file);
            }
            assert.deepStrictEqual(pluginContext.getFeatureFiles(), new Set());
        });

        void it("does not add feature files to synchronize if enabled but the extension does not match", (context) => {
            const fileExtension = faker().system.fileExt();
            const files = faker().helpers.multiple(
                () => generateFakeFileObject({ fileExtension: fileExtension }),
                { count: { max: 5, min: 0 } }
            );
            context.mock.method(LOG, "message", context.mock.fn());
            const externalOptions = generateFakeExternalPluginOptions({
                cucumber: { featureFileExtension: ".cy.js", uploadFeatures: true },
                plugin: { enabled: true },
            });
            const internalOptions = generateFakeInternalPluginOptions(externalOptions);
            const pluginContext = new PluginContext(internalOptions);
            context.mock.method(globalContext, "getGlobalContext", () => pluginContext);
            for (const file of files) {
                syncFeatureFile(file);
            }
            assert.deepStrictEqual(pluginContext.getFeatureFiles(), new Set());
        });
    });
});
