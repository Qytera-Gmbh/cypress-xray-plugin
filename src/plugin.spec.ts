import { expect } from "chai";
import fs from "fs";
import path from "path";
import { stub } from "sinon";
import {
    getMockedJiraClient,
    getMockedLogger,
    getMockedRestClient,
    getMockedXrayClient,
} from "../test/mocks";
import { mockedCypressEventEmitter } from "../test/util";
import * as context from "./context";
import * as afterRunHook from "./hooks/after/afterRun";
import * as synchronizeFeatureFileHook from "./hooks/preprocessor/filePreprocessor";
import { configureXrayPlugin, resetPlugin, syncFeatureFile } from "./plugin";
import { CypressXrayPluginOptions, PluginContext } from "./types/plugin";
import { dedent } from "./util/dedent";
import { ExecutableGraph } from "./util/executable/executable";
import { Level } from "./util/logging";

describe(path.relative(process.cwd(), __filename), () => {
    let config: Cypress.PluginConfigOptions;
    let pluginContext: PluginContext;

    beforeEach(() => {
        config = JSON.parse(
            fs.readFileSync("./test/resources/cypress.config.json", "utf-8")
        ) as Cypress.PluginConfigOptions;
        const jiraClient = getMockedJiraClient();
        const xrayClient = getMockedXrayClient();
        const jiraOptions = context.initJiraOptions(
            {},
            {
                projectKey: "CYP",
                url: "https://example.org",
            }
        );
        pluginContext = {
            cypress: config,
            options: {
                jira: jiraOptions,
                plugin: context.initPluginOptions({}, {}),
                xray: context.initXrayOptions({}, {}),
                ssl: context.initSslOptions({}, {}),
            },
            clients: {
                kind: "server",
                jiraClient: jiraClient,
                xrayClient: xrayClient,
            },
            graph: new ExecutableGraph(),
        };
        resetPlugin();
    });

    describe(configureXrayPlugin.name, () => {
        it("does nothing if disabled", async () => {
            const logger = getMockedLogger();
            logger.message
                .withArgs(Level.INFO, "Plugin disabled. Skipping further configuration")
                .onFirstCall()
                .returns();
            await configureXrayPlugin(mockedCypressEventEmitter, config, {
                jira: {
                    projectKey: "ABC",
                    url: "https://example.org",
                },
                plugin: {
                    enabled: false,
                },
            });
        });

        it("initializes the plugin context with the provided options", async () => {
            config.env = {
                jsonEnabled: true,
                jsonOutput: "somewhere",
                ["JIRA_API_TOKEN"]: "token",
            };
            const stubbedContext = stub(context, "setPluginContext");
            const stubbedClients = stub(context, "initClients");
            stubbedClients.onFirstCall().resolves(pluginContext.clients);
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
                    uploadResults: false,
                    uploadScreenshots: false,
                },
                cucumber: {
                    featureFileExtension: ".cucumber",
                    downloadFeatures: false,
                    uploadFeatures: false,
                },
                ["openSSL"]: {
                    ["rootCAPath"]: "/home/somewhere",
                    secureOptions: 42,
                },
            };
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            expect(stubbedContext.firstCall.args[0].cypress).to.eq(config);
            expect(stubbedContext.firstCall.args[0].options.jira).to.deep.eq({
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
            });
            expect(stubbedContext.firstCall.args[0].options.plugin).to.deep.eq(options.plugin);
            expect(stubbedContext.firstCall.args[0].options.xray).to.deep.eq(options.xray);
            expect(stubbedContext.firstCall.args[0].options.cucumber?.featureFileExtension).to.eq(
                ".cucumber"
            );
            expect(stubbedContext.firstCall.args[0].options.cucumber?.downloadFeatures).to.be.false;
            expect(stubbedContext.firstCall.args[0].options.cucumber?.uploadFeatures).to.be.false;
            expect(
                stubbedContext.firstCall.args[0].options.cucumber?.preprocessor?.json
            ).to.deep.eq({
                enabled: true,
                output: "somewhere",
            });
            expect(stubbedContext.firstCall.args[0].options.ssl).to.deep.eq(options.openSSL);
            expect(stubbedContext.firstCall.args[0].clients).to.eq(pluginContext.clients);
        });

        it("initializes the requests module", async () => {
            const restClient = getMockedRestClient();
            const stubbedClients = stub(context, "initClients");
            stubbedClients.onFirstCall().resolves(pluginContext.clients);
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "ABC",
                    url: "https://example.org",
                },
            };
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            expect(restClient.init).to.have.been.calledOnceWithExactly({
                debug: false,
                ssl: pluginContext.options.ssl,
            });
        });

        it("initializes the logging module", async () => {
            const stubbedClients = stub(context, "initClients");
            const logger = getMockedLogger();
            stubbedClients.onFirstCall().resolves(pluginContext.clients);
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "ABC",
                    url: "https://example.org",
                },
            };
            logger.configure
                .withArgs({
                    debug: pluginContext.options.plugin.debug,
                    logDirectory: pluginContext.options.plugin.logDirectory,
                })
                .onFirstCall()
                .returns();
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
        });

        it("adds upload commands", async () => {
            stub(context, "initClients").onFirstCall().resolves(pluginContext.clients);
            stub(context, "getPluginContext").onFirstCall().returns(pluginContext);
            const afterRunResult: CypressCommandLine.CypressRunResult = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const stubbedHook = stub(afterRunHook, "addUploadCommands");
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", afterRunResult),
                config,
                pluginContext.options
            );
            expect(stubbedHook).to.have.been.calledOnceWithExactly(
                afterRunResult,
                pluginContext.cypress.projectRoot,
                pluginContext.options,
                pluginContext.clients,
                pluginContext.graph
            );
        });

        it("displays an error for failed runs", async () => {
            stub(context, "initClients").onFirstCall().resolves(pluginContext.clients);
            stub(context, "getPluginContext").onFirstCall().returns(pluginContext);
            const failedResults: CypressCommandLine.CypressFailedRunResult = {
                status: "failed",
                failures: 47,
                message: "Pretty messed up",
            };
            const logger = getMockedLogger();
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", failedResults),
                config,
                pluginContext.options
            );
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.ERROR,
                dedent(`
                    Skipping results upload: Failed to run 47 tests

                    Pretty messed up
                `)
            );
        });

        it("displays warnings if the plugin was not configured", async () => {
            stub(context, "initClients").onFirstCall().resolves(pluginContext.clients);
            const afterRunResult: CypressCommandLine.CypressRunResult = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const logger = getMockedLogger();
            logger.message
                .withArgs(
                    Level.WARNING,
                    dedent(`
                        Skipping after:run hook: Plugin misconfigured: configureXrayPlugin() was not called

                        Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                    `)
                )
                .onFirstCall()
                .returns();
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", afterRunResult),
                config,
                pluginContext.options
            );
        });

        it("does not display a warning if the plugin was configured but disabled", async () => {
            const logger = getMockedLogger();
            logger.message
                .withArgs(Level.INFO, "Plugin disabled. Skipping further configuration")
                .returns();
            await configureXrayPlugin(mockedCypressEventEmitter, config, {
                jira: { projectKey: "CYP", url: "https://example.org" },
                plugin: { enabled: false },
            });
        });

        it("does not display an error for failed runs if disabled", async () => {
            const failedResults: CypressCommandLine.CypressFailedRunResult = {
                status: "failed",
                failures: 47,
                message: "Pretty messed up",
            };
            const logger = getMockedLogger();
            pluginContext.options.plugin.enabled = false;
            context.setPluginContext(pluginContext);
            logger.message
                .withArgs(Level.INFO, "Skipping after:run hook: Plugin disabled")
                .onFirstCall()
                .returns();
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", failedResults),
                config,
                pluginContext.options
            );
        });

        it("should skip the results upload if disabled", async () => {
            stub(context, "initClients").onFirstCall().resolves(pluginContext.clients);
            stub(context, "getPluginContext").onFirstCall().returns(pluginContext);
            const afterRunResult: CypressCommandLine.CypressRunResult = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const logger = getMockedLogger();
            pluginContext.options.xray.uploadResults = false;
            context.setPluginContext(pluginContext);
            logger.message
                .withArgs(
                    Level.INFO,
                    "Skipping results upload: Plugin is configured to not upload test results"
                )
                .onFirstCall()
                .returns();
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", afterRunResult),
                config,
                pluginContext.options
            );
        });
    });

    describe(syncFeatureFile.name, () => {
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

        it("displays warnings if the plugin was not configured", () => {
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
            syncFeatureFile(file);
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
            syncFeatureFile(file);
        });

        it("does not do anything if disabled", () => {
            file.filePath = "./test/resources/features/taggedCloud.feature";
            const logger = getMockedLogger();
            pluginContext.options.plugin.enabled = false;
            context.setPluginContext(pluginContext);
            logger.message
                .withArgs(
                    Level.INFO,
                    "Plugin disabled. Skipping feature file synchronization triggered by: ./test/resources/features/taggedCloud.feature"
                )
                .onFirstCall()
                .returns();
            syncFeatureFile(file);
        });

        it("calls the synchronizeFile hook", () => {
            const stubbedHook = stub(synchronizeFeatureFileHook, "addSynchronizationCommands");
            pluginContext.options.cucumber = {
                featureFileExtension: ".feature",
                uploadFeatures: true,
                downloadFeatures: false,
                prefixes: {},
            };
            context.setPluginContext(pluginContext);
            syncFeatureFile(file);
            expect(stubbedHook).to.have.been.calledOnceWithExactly(
                file,
                pluginContext.cypress.projectRoot,
                pluginContext.options,
                pluginContext.clients,
                pluginContext.graph
            );
        });
    });
});
