import { expect } from "chai";
import fs from "fs";
import { Agent } from "node:https";
import path from "path";
import Sinon, { stub } from "sinon";
import { getMockedLogger, getMockedRestClient } from "../test/mocks";
import { mockedCypressEventEmitter } from "../test/util";
import { PatCredentials } from "./authentication/credentials";
import { JiraClientServer } from "./client/jira/jiraClientServer";
import { XrayClientServer } from "./client/xray/xrayClientServer";
import * as context from "./context";
import * as hooks from "./hooks/hooks";
import * as synchronizeFeatureFileHook from "./hooks/preprocessor/synchronizeFeatureFile";
import { AxiosRestClient } from "./https/requests";
import { Level } from "./logging/logging";
import { configureXrayPlugin, resetPlugin, syncFeatureFile } from "./plugin";
import { CachingJiraFieldRepository } from "./repository/jira/fields/jiraFieldRepository";
import { CachingJiraIssueFetcher } from "./repository/jira/fields/jiraIssueFetcher";
import { CachingJiraRepository } from "./repository/jira/jiraRepository";
import { CypressXrayPluginOptions } from "./types/plugin";
import { dedent } from "./util/dedent";

describe("the plugin", () => {
    let config: Cypress.PluginConfigOptions;
    let pluginContext: context.PluginContext;

    beforeEach(() => {
        config = JSON.parse(
            fs.readFileSync("./test/resources/cypress.config.json", "utf-8")
        ) as Cypress.PluginConfigOptions;
        const jiraClient = new JiraClientServer(
            "https://example.org",
            new PatCredentials("token"),
            getMockedRestClient()
        );
        const xrayClient = new XrayClientServer(
            "https://example.org",
            new PatCredentials("token"),
            getMockedRestClient()
        );
        const jiraOptions = context.initJiraOptions(
            {},
            {
                projectKey: "CYP",
                url: "https://example.org",
            }
        );
        const jiraFieldRepository = new CachingJiraFieldRepository(jiraClient);
        const jiraFieldFetcher = new CachingJiraIssueFetcher(
            jiraClient,
            jiraFieldRepository,
            jiraOptions.fields
        );
        const jiraRepository = new CachingJiraRepository(jiraFieldRepository, jiraFieldFetcher);
        pluginContext = new context.PluginContext(
            {
                kind: "server",
                jiraClient: jiraClient,
                xrayClient: xrayClient,
                jiraRepository: jiraRepository,
            },
            {
                jira: jiraOptions,
                plugin: context.initPluginOptions({}, {}),
                xray: context.initXrayOptions({}, {}),
                http: {},
            },
            config
        );
        resetPlugin();
    });

    describe("configureXrayPlugin", () => {
        it("registers tasks only if disabled", async () => {
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const mockedOn = Sinon.spy();
            await configureXrayPlugin(mockedOn, config, {
                jira: {
                    projectKey: "ABC",
                    url: "https://example.org",
                },
                plugin: {
                    enabled: false,
                },
            });
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Plugin disabled. Skipping further configuration"
            );
            expect(mockedOn).to.have.been.calledOnceWith("task");
        });

        it("registers tasks only if run in interactive mode", async () => {
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const mockedOn = Sinon.spy();
            config.isTextTerminal = false;
            await configureXrayPlugin(mockedOn, config, {
                jira: {
                    projectKey: "ABC",
                    url: "https://example.org",
                },
            });
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Interactive mode detected, disabling plugin"
            );
            expect(mockedOn).to.have.been.calledOnceWith("task");
        });

        it("initializes the plugin context with the provided options", async () => {
            config.env = {
                jsonEnabled: true,
                jsonOutput: "somewhere",
                ["JIRA_API_TOKEN"]: "token",
            };
            const stubbedContext = stub(context, "setPluginContext");
            const stubbedClients = stub(context, "initClients");
            stubbedClients.onFirstCall().resolves(pluginContext.getClients());
            const options: CypressXrayPluginOptions = {
                jira: {
                    attachVideos: true,
                    fields: {
                        summary: "bonjour",
                        description: "somewhere",
                        labels: "out",
                        testEnvironments: "field_123",
                        testPlan: "there",
                        testType: "!",
                    },
                    projectKey: "ABC",
                    testExecutionIssueDescription: "description",
                    testExecutionIssueKey: "ABC-2",
                    testExecutionIssueSummary: "summary",
                    testExecutionIssueType: "QA-1",
                    testPlanIssueKey: "ABC-3",
                    testPlanIssueType: "QA-2",
                    url: "https://example.org",
                },
                plugin: {
                    debug: false,
                    logDirectory: "xyz",
                    normalizeScreenshotNames: true,
                    enabled: true,
                },
                xray: {
                    status: {
                        failed: "FAILURE",
                        passed: "OK",
                        pending: "WAITING",
                        skipped: "OMITTED",
                    },
                    testEnvironments: ["A", "B"],
                    uploadRequests: false,
                    uploadResults: false,
                    uploadScreenshots: false,
                },
                cucumber: {
                    featureFileExtension: ".cucumber",
                    downloadFeatures: false,
                    uploadFeatures: false,
                },
                http: {
                    httpAgent: new Agent({
                        ca: "/home/somewhere",
                        secureOptions: 42,
                    }),
                },
            };
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            expect(stubbedContext.firstCall.args[0]?.getCypressOptions()).to.eq(config);
            expect(stubbedContext.firstCall.args[0]?.getOptions().jira).to.deep.eq({
                attachVideos: true,
                fields: {
                    summary: "bonjour",
                    description: "somewhere",
                    labels: "out",
                    testEnvironments: "field_123",
                    testPlan: "there",
                    testType: "!",
                },
                projectKey: "ABC",
                testExecutionIssueDescription: "description",
                testExecutionIssueDetails: {
                    subtask: false,
                },
                testExecutionIssueKey: "ABC-2",
                testExecutionIssueSummary: "summary",
                testExecutionIssueType: "QA-1",
                testPlanIssueKey: "ABC-3",
                testPlanIssueType: "QA-2",
                url: "https://example.org",
            });
            expect(stubbedContext.firstCall.args[0]?.getOptions().plugin).to.deep.eq({
                ...options.plugin,
                logDirectory: path.resolve(config.projectRoot, "xyz"),
            });
            expect(stubbedContext.firstCall.args[0]?.getOptions().xray).to.deep.eq(options.xray);
            expect(
                stubbedContext.firstCall.args[0]?.getOptions().cucumber?.featureFileExtension
            ).to.eq(".cucumber");
            expect(stubbedContext.firstCall.args[0]?.getOptions().cucumber?.downloadFeatures).to.be
                .false;
            expect(stubbedContext.firstCall.args[0]?.getOptions().cucumber?.uploadFeatures).to.be
                .false;
            expect(
                stubbedContext.firstCall.args[0]?.getOptions().cucumber?.preprocessor?.json
            ).to.deep.eq({
                enabled: true,
                output: "somewhere",
            });
            expect(stubbedContext.firstCall.args[0]?.getOptions().http).to.deep.eq(options.http);
            expect(stubbedContext.firstCall.args[0]?.getClients()).to.eq(
                pluginContext.getClients()
            );
        });

        it("initializes the clients with different http configurations", async () => {
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "ABC",
                    url: "https://example.org",
                },
                http: {
                    jira: {
                        proxy: {
                            host: "https://example.org",
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
            };
            const stubbedClients = stub(context, "initClients");
            stubbedClients.onFirstCall().resolves(pluginContext.getClients());
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            expect(stubbedClients).to.have.been.calledOnce;
            expect(stubbedClients.getCall(0).args[2]).to.deep.eq({
                jira: new AxiosRestClient({
                    debug: false,
                    http: {
                        proxy: {
                            host: "https://example.org",
                            port: 1234,
                        },
                    },
                }),
                xray: new AxiosRestClient({
                    debug: false,
                    http: {
                        proxy: {
                            host: "http://localhost",
                            port: 5678,
                        },
                    },
                }),
            });
        });

        it("initializes the logging module", async () => {
            const stubbedClients = stub(context, "initClients");
            const logger = getMockedLogger();
            stubbedClients.onFirstCall().resolves(pluginContext.getClients());
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "ABC",
                    url: "https://example.org",
                },
            };
            logger.configure
                .withArgs({
                    debug: pluginContext.getOptions().plugin.debug,
                    logDirectory: path.resolve(
                        config.projectRoot,
                        pluginContext.getOptions().plugin.logDirectory
                    ),
                })
                .onFirstCall()
                .returns();
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
        });

        it("initializes the logging module without resolving absolute paths", async () => {
            const stubbedClients = stub(context, "initClients");
            const logger = getMockedLogger();
            stubbedClients.onFirstCall().resolves(pluginContext.getClients());
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "ABC",
                    url: "https://example.org",
                },
                plugin: {
                    logDirectory: path.resolve("."),
                },
            };
            logger.configure
                .withArgs({
                    debug: false,
                    logDirectory: path.resolve("."),
                })
                .onFirstCall()
                .returns();
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
        });
    });

    describe("on before:run", () => {
        it("warns about empty specs", async () => {
            const beforeRunDetails: Cypress.BeforeRunDetails = JSON.parse(
                fs.readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            ) as Cypress.BeforeRunDetails;
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            stub(context, "initClients").resolves(pluginContext.getClients());
            context.setPluginContext(pluginContext);
            beforeRunDetails.specs = undefined;
            await configureXrayPlugin(
                mockedCypressEventEmitter("before:run", beforeRunDetails),
                config,
                pluginContext.getOptions()
            );
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.WARNING,
                "No specs about to be executed. Skipping before:run hook"
            );
        });

        it("calls the beforeRun hook", async () => {
            const beforeRunDetails: Cypress.BeforeRunDetails = JSON.parse(
                fs.readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            ) as Cypress.BeforeRunDetails;
            const stubbedHook = stub(hooks, "beforeRunHook");
            context.setPluginContext(pluginContext);
            stub(context, "initClients").resolves(pluginContext.getClients());
            await configureXrayPlugin(
                mockedCypressEventEmitter("before:run", beforeRunDetails),
                config,
                pluginContext.getOptions()
            );
            expect(stubbedHook).to.have.been.calledOnceWithExactly(
                beforeRunDetails.specs,
                {
                    jira: pluginContext.getOptions().jira,
                    plugin: {
                        ...pluginContext.getOptions().plugin,
                        logDirectory: path.resolve(config.projectRoot, "logs"),
                    },
                    xray: pluginContext.getOptions().xray,
                    cucumber: undefined,
                    http: {},
                },
                pluginContext.getClients()
            );
        });

        it("does not call the beforeRun hook on disabled upload", async () => {
            const beforeRunDetails: Cypress.BeforeRunDetails = JSON.parse(
                fs.readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            ) as Cypress.BeforeRunDetails;
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const stubbedHook = stub(hooks, "beforeRunHook");
            context.setPluginContext(pluginContext);
            pluginContext.getOptions().xray.uploadResults = false;
            stub(context, "initClients").resolves(pluginContext.getClients());
            await configureXrayPlugin(
                mockedCypressEventEmitter("before:run", beforeRunDetails),
                config,
                pluginContext.getOptions()
            );
            expect(stubbedHook).to.not.have.been.called;
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.INFO,
                "Xray results upload disabled. No results will be uploaded"
            );
        });
    });

    describe("on after:run", () => {
        it("displays an error for failed runs", async () => {
            const failedResults: CypressCommandLine.CypressFailedRunResult = {
                status: "failed",
                failures: 47,
                message: "Pretty messed up",
            };
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            context.setPluginContext(pluginContext);
            stub(context, "initClients").resolves(pluginContext.getClients());
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", failedResults),
                config,
                pluginContext.getOptions()
            );
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.ERROR,
                dedent(`
                        Skipping after:run hook: Failed to run 47 tests

                        Pretty messed up
                    `)
            );
        });

        it("calls the afterRun hook", async () => {
            const afterRunResult: CypressCommandLine.CypressRunResult = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const stubbedHook = stub(hooks, "afterRunHook");
            context.setPluginContext(pluginContext);
            stub(context, "initClients").resolves(pluginContext.getClients());
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", afterRunResult),
                config,
                pluginContext.getOptions()
            );
            const expectedContext = new context.PluginContext(
                pluginContext.getClients(),
                {
                    ...pluginContext.getOptions(),
                    plugin: {
                        ...pluginContext.getOptions().plugin,
                        logDirectory: path.resolve(config.projectRoot, "logs"),
                    },
                    cucumber: undefined,
                },
                config
            );
            expect(stubbedHook).to.have.been.calledOnceWithExactly(
                afterRunResult,
                {
                    ...expectedContext.getOptions(),
                    cypress: config,
                },
                expectedContext.getClients(),
                expectedContext
            );
        });

        it("does not call the after:run hook on disabled upload", async () => {
            const afterRunResult: CypressCommandLine.CypressRunResult = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const stubbedHook = stub(hooks, "afterRunHook");
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            context.setPluginContext(pluginContext);
            pluginContext.getOptions().xray.uploadResults = false;
            stub(context, "initClients").resolves(pluginContext.getClients());
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", afterRunResult),
                config,
                pluginContext.getOptions()
            );
            expect(stubbedHook).to.not.have.been.called;
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.INFO,
                "Xray results upload disabled. No results will be uploaded"
            );
        });
    });

    describe("syncFeatureFile", () => {
        let file: Cypress.FileObject;
        beforeEach(() => {
            // Weird workaround.
            const emitter = {} as Cypress.FileObject;
            file = {
                ...emitter,
                filePath: "./test/resources/features/taggedCloud.feature",
                outputPath: "",
                shouldWatch: false,
            };
        });

        it("displays warnings if the plugin was not configured", async () => {
            const logger = getMockedLogger();
            logger.message
                .withArgs(
                    Level.WARNING,
                    dedent(`
                        Skipping file:preprocessor hook: Plugin misconfigured: configureXrayPlugin() was not called

                        Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                    `)
                )
                .onFirstCall()
                .returns();
            await syncFeatureFile(file);
        });

        it("does not display a warning if the plugin was configured but disabled", async () => {
            const logger = getMockedLogger();
            logger.message
                .withArgs(Level.INFO, "Plugin disabled. Skipping further configuration")
                .onFirstCall()
                .returns();
            await configureXrayPlugin(mockedCypressEventEmitter, config, {
                jira: { projectKey: "CYP", url: "https://example.org" },
                plugin: { enabled: false },
            });
            await syncFeatureFile(file);
        });

        it("does not do anything if disabled", async () => {
            file.filePath = "./test/resources/features/taggedCloud.feature";
            const logger = getMockedLogger();
            pluginContext.getOptions().plugin.enabled = false;
            context.setPluginContext(pluginContext);
            logger.message
                .withArgs(
                    Level.INFO,
                    "Plugin disabled. Skipping feature file synchronization triggered by: ./test/resources/features/taggedCloud.feature"
                )
                .onFirstCall()
                .returns();
            await syncFeatureFile(file);
        });

        it("calls the synchronizeFile hook", async () => {
            const stubbedHook = stub(synchronizeFeatureFileHook, "synchronizeFeatureFile");
            context.setPluginContext(pluginContext);
            await syncFeatureFile(file);
            expect(stubbedHook).to.have.been.calledOnceWithExactly(
                file,
                pluginContext.getCypressOptions().projectRoot,
                pluginContext.getOptions(),
                pluginContext.getClients()
            );
        });
    });
});
