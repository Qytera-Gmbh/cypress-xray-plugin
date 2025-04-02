import axios from "axios";
import assert from "node:assert";
import fs from "node:fs";
import { relative, resolve } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import { mockedCypressEventEmitter } from "../test/util";
import { PatCredentials } from "./client/authentication/credentials";
import { AxiosRestClient } from "./client/https/requests";
import { BaseJiraClient, type JiraClient } from "./client/jira/jira-client";
import { ServerClient } from "./client/xray/xray-client-server";
import globalContext, {
    PluginContext,
    SimpleEvidenceCollection,
    SimpleIterationParameterCollection,
    SimpleScreenshotCollection,
} from "./context";
import afterRun from "./hooks/after/after-run";
import filePreprocessor from "./hooks/preprocessor/file-preprocessor";
import { configureXrayPlugin, resetPlugin, syncFeatureFile } from "./plugin";
import type {
    CypressFailedRunResult,
    CypressRunResult,
    FileObject,
    PluginConfigOptions,
} from "./types/cypress";
import type { CypressXrayPluginOptions } from "./types/plugin";
import { dedent } from "./util/dedent";
import { ExecutableGraph } from "./util/graph/executable-graph";
import { CapturingLogger, LOG } from "./util/logging";

describe(relative(cwd(), __filename), async () => {
    let jiraClient: JiraClient;
    let config: PluginConfigOptions<"14">;
    let pluginContext: PluginContext;

    beforeEach(() => {
        config = JSON.parse(
            fs.readFileSync("./test/resources/cypress.config.json", "utf-8")
        ) as PluginConfigOptions<"14">;
        jiraClient = new BaseJiraClient(
            "http://localhost:1234",
            new PatCredentials("token"),
            new AxiosRestClient(axios)
        );
        const xrayClient = new ServerClient(
            "http://localhost:1234",
            new PatCredentials("token"),
            new AxiosRestClient(axios)
        );
        const jiraOptions = globalContext.initJiraOptions(
            {},
            {
                projectKey: "CYP",
                url: "http://localhost:1234",
            }
        );
        pluginContext = new PluginContext(
            {
                jiraClient: jiraClient,
                kind: "server",
                xrayClient: xrayClient,
            },
            {
                cucumber: undefined,
                http: {},
                jira: jiraOptions,
                plugin: globalContext.initPluginOptions({}, {}),
                xray: globalContext.initXrayOptions({}, {}),
            },
            config,
            new SimpleEvidenceCollection(),
            new SimpleIterationParameterCollection(),
            new SimpleScreenshotCollection(),
            new ExecutableGraph(),
            new CapturingLogger()
        );
        resetPlugin();
    });

    await describe(configureXrayPlugin.name, async () => {
        await it("registers tasks only if disabled", async (context) => {
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

        await it("registers tasks only if run in interactive mode", async (context) => {
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

        await it("initializes the plugin context with the provided options", async (context) => {
            config.env = {
                ["JIRA_API_TOKEN"]: "token",
                jsonEnabled: true,
                jsonOutput: "somewhere",
            };
            const setGlobalContext = context.mock.method(globalContext, "setGlobalContext");
            context.mock.method(globalContext, "initClients", () => pluginContext.getClients());
            const options: CypressXrayPluginOptions = {
                cucumber: {
                    downloadFeatures: false,
                    featureFileExtension: ".cucumber",
                    uploadFeatures: false,
                },
                http: {},
                jira: {
                    attachVideos: true,
                    fields: {
                        testEnvironments: "field_123",
                        testPlan: "there",
                    },
                    projectKey: "ABC",
                    testExecutionIssue: {
                        fields: {
                            description: "somewhere",
                            issuetype: { name: "QA-1" },
                            labels: "out",
                            summary: "my summary",
                        },
                        key: "ABC-2",
                    },
                    testPlanIssueKey: "ABC-3",
                    url: "http://localhost:1234",
                },
                plugin: {
                    debug: false,
                    enabled: true,
                    logDirectory: "xyz",
                    normalizeScreenshotNames: true,
                    splitUpload: false,
                    uploadLastAttempt: false,
                },
                xray: {
                    status: {
                        failed: "FAILURE",
                        passed: "OK",
                        pending: "WAITING",
                        skipped: "OMITTED",
                    },
                    testEnvironments: ["A", "B"],
                    uploadResults: false,
                    uploadScreenshots: false,
                },
            };
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            assert.strictEqual(
                setGlobalContext.mock.calls[0].arguments[0]?.getCypressOptions(),
                config
            );
            assert.deepStrictEqual(setGlobalContext.mock.calls[0].arguments[0].getOptions().jira, {
                attachVideos: true,
                fields: {
                    description: undefined,
                    labels: undefined,
                    summary: undefined,
                    testEnvironments: "field_123",
                    testPlan: "there",
                },
                projectKey: "ABC",
                testExecutionIssue: {
                    fields: {
                        description: "somewhere",
                        issuetype: { name: "QA-1" },
                        labels: "out",
                        summary: "my summary",
                    },
                    key: "ABC-2",
                },
                testExecutionIssueDescription: undefined,
                testExecutionIssueKey: undefined,
                testExecutionIssueSummary: undefined,
                testExecutionIssueType: "Test Execution",
                testPlanIssueKey: "ABC-3",
                testPlanIssueType: "Test Plan",
                url: "http://localhost:1234",
            });
            assert.deepStrictEqual(
                setGlobalContext.mock.calls[0].arguments[0].getOptions().plugin,
                {
                    ...options.plugin,
                    listener: undefined,
                    logDirectory: resolve(config.projectRoot, "xyz"),
                    logger: undefined,
                }
            );
            assert.deepStrictEqual(setGlobalContext.mock.calls[0].arguments[0].getOptions().xray, {
                status: {
                    failed: "FAILURE",
                    passed: "OK",
                    pending: "WAITING",
                    skipped: "OMITTED",
                    step: {
                        failed: undefined,
                        passed: undefined,
                        pending: undefined,
                        skipped: undefined,
                    },
                },
                testEnvironments: ["A", "B"],
                uploadRequests: false,
                uploadResults: false,
                uploadScreenshots: false,
            });
            assert.strictEqual(
                setGlobalContext.mock.calls[0].arguments[0].getOptions().cucumber
                    ?.featureFileExtension,
                ".cucumber"
            );
            assert.strictEqual(
                setGlobalContext.mock.calls[0].arguments[0].getOptions().cucumber?.downloadFeatures,
                false
            );
            assert.strictEqual(
                setGlobalContext.mock.calls[0].arguments[0].getOptions().cucumber?.uploadFeatures,
                false
            );
            assert.deepStrictEqual(
                setGlobalContext.mock.calls[0].arguments[0].getOptions().cucumber?.preprocessor
                    ?.json,
                {
                    enabled: true,
                    output: "somewhere",
                }
            );
            assert.deepStrictEqual(
                setGlobalContext.mock.calls[0].arguments[0].getOptions().http,
                options.http
            );
            assert.strictEqual(
                setGlobalContext.mock.calls[0].arguments[0].getClients(),
                pluginContext.getClients()
            );
        });

        await it("initializes the clients with different http configurations", async (context) => {
            const options: CypressXrayPluginOptions = {
                http: {
                    jira: {
                        proxy: {
                            host: "http://localhost:1234",
                            port: 1234,
                        },
                    },
                    xray: {
                        proxy: {
                            host: "http://localhost",
                            port: 5678,
                        },
                    },
                },
                jira: {
                    projectKey: "ABC",
                    url: "http://localhost:1234",
                },
            };
            const initClients = context.mock.method(globalContext, "initClients", () =>
                pluginContext.getClients()
            );
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            assert.strictEqual(initClients.mock.callCount(), 1);
            assert.deepStrictEqual(initClients.mock.calls[0].arguments[2], {
                jira: new AxiosRestClient(axios, {
                    debug: false,
                    http: {
                        proxy: {
                            host: "http://localhost:1234",
                            port: 1234,
                        },
                    },
                    rateLimiting: undefined,
                }),
                xray: new AxiosRestClient(axios, {
                    debug: false,
                    http: {
                        proxy: {
                            host: "http://localhost",
                            port: 5678,
                        },
                    },
                    rateLimiting: undefined,
                }),
            });
        });

        await it("initializes the logging module", async (context) => {
            const configure = context.mock.method(LOG, "configure", context.mock.fn());
            context.mock.method(globalContext, "initClients", () => pluginContext.getClients());
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "ABC",
                    url: "http://localhost:1234",
                },
            };
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            assert.deepStrictEqual(configure.mock.calls[0].arguments, [
                {
                    debug: pluginContext.getOptions().plugin.debug,
                    logDirectory: resolve(config.projectRoot, "logs"),
                    logger: undefined,
                },
            ]);
        });

        await it("initializes the logging module with resolved relative paths", async (context) => {
            const configure = context.mock.method(LOG, "configure", context.mock.fn());
            context.mock.method(globalContext, "initClients", () => pluginContext.getClients());
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "ABC",
                    url: "http://localhost:1234",
                },
                plugin: {
                    logDirectory: "log-directory",
                },
            };
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            assert.deepStrictEqual(configure.mock.calls[0].arguments, [
                {
                    debug: pluginContext.getOptions().plugin.debug,
                    logDirectory: resolve(config.projectRoot, "log-directory"),
                    logger: undefined,
                },
            ]);
        });

        await it("initializes the logging module without changing absolute paths", async (context) => {
            const configure = context.mock.method(LOG, "configure", context.mock.fn());
            context.mock.method(globalContext, "initClients", () => pluginContext.getClients());
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "ABC",
                    url: "http://localhost:1234",
                },
                plugin: {
                    logDirectory: resolve("."),
                },
            };
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            assert.deepStrictEqual(configure.mock.calls[0].arguments, [
                {
                    debug: pluginContext.getOptions().plugin.debug,
                    logDirectory: resolve("."),
                    logger: undefined,
                },
            ]);
        });

        await it("initializes the logging module with custom loggers", async (context) => {
            const configure = context.mock.method(LOG, "configure", context.mock.fn());
            context.mock.method(globalContext, "initClients", () => pluginContext.getClients());
            const logger = () => {
                console.log("hello");
            };
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "ABC",
                    url: "http://localhost:1234",
                },
                plugin: {
                    logger,
                },
            };
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            assert.deepStrictEqual(configure.mock.calls[0].arguments, [
                {
                    debug: pluginContext.getOptions().plugin.debug,
                    logDirectory: resolve(config.projectRoot, "logs"),
                    logger: logger,
                },
            ]);
        });

        await it("adds upload commands", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            context.mock.method(globalContext, "initClients", () => pluginContext.getClients());
            const addUploadCommands = context.mock.method(
                afterRun,
                "addUploadCommands",
                context.mock.fn()
            );
            const afterRunResult: CypressRunResult = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResult;
            const mockedOn = context.mock.fn();
            await configureXrayPlugin(mockedOn, config, pluginContext.getOptions());
            await (
                mockedOn.mock.calls[2].arguments[1] as (
                    results: CypressFailedRunResult | CypressRunResult
                ) => Promise<void>
            )(afterRunResult);
            const expectedContext = new PluginContext(
                pluginContext.getClients(),
                {
                    ...pluginContext.getOptions(),
                    plugin: {
                        ...pluginContext.getOptions().plugin,
                        logDirectory: resolve(config.projectRoot, "logs"),
                    },
                },
                pluginContext.getCypressOptions(),
                new SimpleEvidenceCollection(),
                new SimpleIterationParameterCollection(),
                new SimpleScreenshotCollection(),
                new ExecutableGraph(),
                new CapturingLogger()
            );
            assert.deepStrictEqual(addUploadCommands.mock.calls[0].arguments[0], afterRunResult);
            assert.deepStrictEqual(
                addUploadCommands.mock.calls[0].arguments[1],
                pluginContext.getCypressOptions().projectRoot
            );
            assert.deepStrictEqual(addUploadCommands.mock.calls[0].arguments[2], {
                ...pluginContext.getOptions(),
                plugin: {
                    ...pluginContext.getOptions().plugin,
                    logDirectory: resolve(config.projectRoot, "logs"),
                },
            });
            assert.deepStrictEqual(
                addUploadCommands.mock.calls[0].arguments[3],
                pluginContext.getClients()
            );
            assert.deepStrictEqual(addUploadCommands.mock.calls[0].arguments[4], expectedContext);
            assert.deepStrictEqual(addUploadCommands.mock.calls[0].arguments[5], expectedContext);
            assert.deepStrictEqual(addUploadCommands.mock.calls[0].arguments[6], expectedContext);
            assert.deepStrictEqual(
                addUploadCommands.mock.calls[0].arguments[7],
                pluginContext.getEventEmitter()
            );
            assert.deepStrictEqual(
                addUploadCommands.mock.calls[0].arguments[8],
                pluginContext.getGraph()
            );
            assert.strictEqual(
                addUploadCommands.mock.calls[0].arguments[9] instanceof CapturingLogger,
                true
            );
        });

        await it("displays an error for failed runs", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            context.mock.method(globalContext, "initClients", () => pluginContext.getClients());
            context.mock.method(globalContext, "getGlobalContext", () => pluginContext);
            const failedResults: CypressFailedRunResult = {
                failures: 47,
                message: "Pretty messed up",
                status: "failed",
            };
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", failedResults),
                config,
                pluginContext.getOptions()
            );
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "error",
                dedent(`
                    Skipping results upload: Failed to run 47 tests.

                      Pretty messed up
                `),
            ]);
        });

        await it("does not display a warning if the plugin was configured but disabled", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            await configureXrayPlugin(mockedCypressEventEmitter, config, {
                jira: { projectKey: "CYP", url: "http://localhost:1234" },
                plugin: { enabled: false },
            });
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "info",
                "Plugin disabled. Skipping further configuration.",
            ]);
        });

        await it("does not display an error for failed runs if disabled", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const failedResults: CypressFailedRunResult = {
                failures: 47,
                message: "Pretty messed up",
                status: "failed",
            };
            pluginContext.getOptions().plugin.enabled = false;
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", failedResults),
                config,
                pluginContext.getOptions()
            );
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "info",
                "Plugin disabled. Skipping further configuration.",
            ]);
        });

        await it("should skip the results upload if disabled", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            context.mock.method(globalContext, "initClients", () => pluginContext.getClients());
            context.mock.method(globalContext, "getGlobalContext", () => pluginContext);
            const afterRunResult: CypressRunResult = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResult;
            pluginContext.getOptions().xray.uploadResults = false;
            globalContext.setGlobalContext(pluginContext);
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", afterRunResult),
                config,
                pluginContext.getOptions()
            );
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "info",
                "Skipping results upload: Plugin is configured to not upload test results.",
            ]);
        });

        await it("displays a warning if there are failed vertices", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            context.mock.method(globalContext, "initClients", () => pluginContext.getClients());
            context.mock.method(jiraClient, "getIssueTypes", () => [{ name: "Test Execution" }]);
            const afterRunResult: CypressRunResult = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResult;
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", afterRunResult),
                config,
                pluginContext.getOptions()
            );
            // Workaround: yields control back to the configuration function so that the finally
            // block may run.
            await new Promise((r) => {
                setTimeout(() => {
                    r("ok");
                }, 10);
            });
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "warning",
                "Encountered problems during plugin execution!",
            ]);
            assert.deepStrictEqual(message.mock.calls[1].arguments, [
                "warning",
                dedent(`
                    ~/repositories/xray/cypress/e2e/demo/example.cy.ts

                      Test: xray upload demo should look for paragraph elements

                        Skipping result upload.

                          Caused by: Test: xray upload demo should look for paragraph elements

                            No test issue keys found in title.

                            You can target existing test issues by adding a corresponding issue key:

                              it("CYP-123 xray upload demo should look for paragraph elements", () => {
                                // ...
                              });

                            For more information, visit:
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `),
            ]);
            assert.deepStrictEqual(message.mock.calls[2].arguments, [
                "warning",
                dedent(`
                    ~/repositories/xray/cypress/e2e/demo/example.cy.ts

                      Test: xray upload demo should look for the anchor element

                        Skipping result upload.

                          Caused by: Test: xray upload demo should look for the anchor element

                            No test issue keys found in title.

                            You can target existing test issues by adding a corresponding issue key:

                              it("CYP-123 xray upload demo should look for the anchor element", () => {
                                // ...
                              });

                            For more information, visit:
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `),
            ]);
            assert.deepStrictEqual(message.mock.calls[3].arguments, [
                "warning",
                dedent(`
                    ~/repositories/xray/cypress/e2e/demo/example.cy.ts

                      Test: xray upload demo should fail

                        Skipping result upload.

                          Caused by: Test: xray upload demo should fail

                            No test issue keys found in title.

                            You can target existing test issues by adding a corresponding issue key:

                              it("CYP-123 xray upload demo should fail", () => {
                                // ...
                              });

                            For more information, visit:
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `),
            ]);
            assert.deepStrictEqual(message.mock.calls[4].arguments, [
                "warning",
                "No test results were uploaded",
            ]);
            assert.deepStrictEqual(message.mock.calls[5].arguments, [
                "error",
                dedent(`
                    Failed to upload Cypress execution results.

                      Caused by: Failed to convert Cypress tests into Xray tests: No Cypress tests to upload
                `),
            ]);
        });
    });

    await it("displays warning and errors after other log messages", async (context) => {
        const message = context.mock.method(LOG, "message", context.mock.fn());
        const xrayClient = new ServerClient(
            "http://localhost:1234",
            new PatCredentials("token"),
            new AxiosRestClient(axios)
        );
        context.mock.method(globalContext, "initClients", () => {
            return {
                jiraClient: jiraClient,
                kind: "cloud",
                xrayClient: xrayClient,
            };
        });
        context.mock.method(globalContext, "initCucumberOptions", () => {
            return {
                downloadFeatures: false,
                featureFileExtension: ".feature",
                prefixes: {
                    precondition: "Precondition:",
                    test: "TestName:",
                },
                preprocessor: {
                    json: {
                        enabled: true,
                        output: resolve("./test/resources/fixtures/cucumber/empty-report.json"),
                    },
                },
                uploadFeatures: true,
            };
        });
        context.mock.method(jiraClient, "getFields", () => [
            {
                clauseNames: [],
                custom: false,
                id: "12345",
                name: "summary",
                navigable: false,
                orderable: false,
                schema: {},
                searchable: false,
            },
            {
                clauseNames: [],
                custom: false,
                id: "98765",
                name: "labels",
                navigable: false,
                orderable: false,
                schema: {},
                searchable: false,
            },
        ]);
        context.mock.method(jiraClient, "getIssueTypes", () => [{ name: "Test Execution" }]);
        context.mock.method(xrayClient, "importExecutionMultipart", () => "CYP-123");
        context.mock.method(xrayClient, "importExecutionCucumberMultipart", () => "CYP-123");
        context.mock.method(xrayClient, "importFeature", () => {
            return { errors: [], updatedOrCreatedIssues: ["CYP-222", "CYP-333", "CYP-555"] };
        });
        const afterRunResult = JSON.parse(
            fs.readFileSync("./test/resources/runResult_13_0_0_mixed.json", "utf-8")
        ) as CypressRunResult;
        const spy = context.mock.fn();
        await configureXrayPlugin(spy, config, {
            cucumber: {
                featureFileExtension: ".feature",
                uploadFeatures: true,
            },
            jira: {
                projectKey: "CYP",
                url: "http://localhost:1234",
            },
            plugin: {
                debug: true,
            },
            xray: {
                uploadScreenshots: false,
            },
        });
        syncFeatureFile({
            filePath: "./test/resources/features/invalid.feature",
        } as FileObject);
        const [eventName, callback] = spy.mock.calls[2].arguments as [
            string,
            (results: CypressFailedRunResult | CypressRunResult) => Promise<void> | void,
        ];
        assert.strictEqual(eventName, "after:run");
        await callback(afterRunResult);
        assert.deepStrictEqual(message.mock.calls[0].arguments, [
            "info",
            "Parsing feature file: ./test/resources/features/invalid.feature",
        ]);
        assert.deepStrictEqual(message.mock.calls[1].arguments, [
            "notice",
            "Uploaded Cypress test results to issue: CYP-123 (http://localhost:1234/browse/CYP-123)",
        ]);
        assert.deepStrictEqual(message.mock.calls[2].arguments, [
            "warning",
            "Encountered problems during plugin execution!",
        ]);
        assert.deepStrictEqual(message.mock.calls[3].arguments, [
            "error",
            dedent(`
                Failed to upload Cucumber execution results.

                  Caused by: Skipping Cucumber results upload: No Cucumber tests were executed
            `),
        ]);
        assert.deepStrictEqual(message.mock.calls[4].arguments, [
            "error",
            dedent(`
                ./test/resources/features/invalid.feature

                  Failed to import feature file.

                  Caused by: ./test/resources/features/invalid.feature

                    Failed to parse feature file.

                      Parser errors:
                      (9:3): expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got 'Invalid: Element'
            `),
        ]);
    });

    await describe(syncFeatureFile.name, async () => {
        let file: FileObject;
        beforeEach(() => {
            file = {
                ...({} as FileObject),
                filePath: "./test/resources/features/taggedCloud.feature",
                outputPath: "",
                shouldWatch: false,
            };
        });

        await it("displays warnings if the plugin was not configured", (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            syncFeatureFile(file);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "warning",
                dedent(`
                    ./test/resources/features/taggedCloud.feature

                      Skipping file:preprocessor hook: Plugin misconfigured: configureXrayPlugin() was not called.

                      Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                `),
            ]);
        });

        await it("does not display a warning if the plugin was configured but disabled", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            await configureXrayPlugin(mockedCypressEventEmitter, config, {
                jira: { projectKey: "CYP", url: "http://localhost:1234" },
                plugin: { enabled: false },
            });
            syncFeatureFile(file);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "info",
                "Plugin disabled. Skipping further configuration.",
            ]);
        });

        await it("does not do anything if disabled", (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            file.filePath = "./test/resources/features/taggedCloud.feature";
            pluginContext.getOptions().plugin.enabled = false;
            globalContext.setGlobalContext(pluginContext);
            syncFeatureFile(file);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "info",
                dedent(`
                    ./test/resources/features/taggedCloud.feature

                      Plugin disabled. Skipping feature file synchronization.
                `),
            ]);
        });

        await it("adds synchronization commands", (context) => {
            const addSynchronizationCommands = context.mock.method(
                filePreprocessor,
                "addSynchronizationCommands"
            );
            pluginContext.getOptions().cucumber = {
                downloadFeatures: false,
                featureFileExtension: ".feature",
                prefixes: {},
                uploadFeatures: true,
            };
            globalContext.setGlobalContext(pluginContext);
            syncFeatureFile(file);
            assert.deepStrictEqual(addSynchronizationCommands.mock.calls[0].arguments, [
                file,
                pluginContext.getOptions(),
                pluginContext.getClients(),
                pluginContext.getGraph(),
                pluginContext.getLogger(),
            ]);
        });

        await it("does not add synchronization commands for native test files", (context) => {
            const addSynchronizationCommands = context.mock.method(
                filePreprocessor,
                "addSynchronizationCommands"
            );
            pluginContext.getOptions().cucumber = {
                downloadFeatures: false,
                featureFileExtension: ".feature",
                prefixes: {},
                uploadFeatures: true,
            };
            globalContext.setGlobalContext(pluginContext);
            file.filePath = "/something.js";
            syncFeatureFile(file);
            assert.strictEqual(addSynchronizationCommands.mock.callCount(), 0);
        });
    });
});
