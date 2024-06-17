import { expect } from "chai";
import fs from "fs";
import path from "path";
import Sinon, { stub } from "sinon";
import { getMockedJiraClient, getMockedLogger, getMockedXrayClient } from "../test/mocks";
import { mockedCypressEventEmitter } from "../test/util";
import { AxiosRestClient } from "./client/https/requests";
import * as context from "./context";
import * as afterRunHook from "./hooks/after/after-run";
import * as synchronizeFeatureFileHook from "./hooks/preprocessor/file-preprocessor";
import { configureXrayPlugin, resetPlugin, syncFeatureFile } from "./plugin";
import { CypressFailedRunResultType, CypressRunResultType } from "./types/cypress/cypress";
import { CypressXrayPluginOptions } from "./types/plugin";
import { dedent } from "./util/dedent";
import { ExecutableGraph } from "./util/graph/executable-graph";
import { LOG, Level } from "./util/logging";

describe(path.relative(process.cwd(), __filename), () => {
    let config: Cypress.PluginConfigOptions;
    let pluginContext: context.PluginContext;

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
        pluginContext = new context.PluginContext(
            {
                kind: "server",
                jiraClient: jiraClient,
                xrayClient: xrayClient,
            },
            {
                jira: jiraOptions,
                cucumber: undefined,
                plugin: context.initPluginOptions({}, {}),
                xray: context.initXrayOptions({}, {}),
                http: {},
            },
            config,
            new context.SimpleEvidenceCollection(),
            new ExecutableGraph()
        );
        resetPlugin();
    });

    describe(configureXrayPlugin.name, () => {
        it("registers tasks only if disabled", async () => {
            const logger = getMockedLogger();
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
                http: {},
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
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            expect(logger.configure).to.have.been.calledWithExactly({
                debug: pluginContext.getOptions().plugin.debug,
                logDirectory: path.resolve(config.projectRoot, "logs"),
            });
        });

        it("initializes the logging module with resolved relative paths", async () => {
            const stubbedClients = stub(context, "initClients");
            const logger = getMockedLogger();
            stubbedClients.onFirstCall().resolves(pluginContext.getClients());
            const options: CypressXrayPluginOptions = {
                jira: {
                    projectKey: "ABC",
                    url: "https://example.org",
                },
                plugin: {
                    logDirectory: "log-directory",
                },
            };
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            expect(logger.configure).to.have.been.calledWithExactly({
                debug: pluginContext.getOptions().plugin.debug,
                logDirectory: path.resolve(config.projectRoot, "log-directory"),
            });
        });

        it("initializes the logging module without changing absolute paths", async () => {
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
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            expect(logger.configure).to.have.been.calledWithExactly({
                debug: pluginContext.getOptions().plugin.debug,
                logDirectory: path.resolve("."),
            });
        });

        it("adds upload commands", async () => {
            stub(context, "initClients").onFirstCall().resolves(pluginContext.getClients());
            const afterRunResult: CypressRunResultType = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResultType;
            const stubbedHook = stub(afterRunHook, "addUploadCommands");
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
                },
                pluginContext.getCypressOptions(),
                new context.SimpleEvidenceCollection(),
                new ExecutableGraph()
            );
            expect(stubbedHook.firstCall.args[0]).to.deep.eq(afterRunResult);
            expect(stubbedHook.firstCall.args[1]).to.deep.eq(
                pluginContext.getCypressOptions().projectRoot
            );
            expect(stubbedHook.firstCall.args[2]).to.deep.eq({
                ...pluginContext.getOptions(),
                plugin: {
                    ...pluginContext.getOptions().plugin,
                    logDirectory: path.resolve(config.projectRoot, "logs"),
                },
            });
            expect(stubbedHook.firstCall.args[3]).to.deep.eq(pluginContext.getClients());
            expect(stubbedHook.firstCall.args[4]).to.deep.eq(expectedContext);
            expect(stubbedHook.firstCall.args[5]).to.deep.eq(pluginContext.getGraph());
            expect(stubbedHook.firstCall.args[6]).to.deep.eq(LOG);
        });

        it("displays an error for failed runs", async () => {
            stub(context, "initClients").onFirstCall().resolves(pluginContext.getClients());
            stub(context, "getPluginContext").onFirstCall().returns(pluginContext);
            const failedResults: CypressFailedRunResultType = {
                status: "failed",
                failures: 47,
                message: "Pretty messed up",
            };
            const logger = getMockedLogger();
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", failedResults),
                config,
                pluginContext.getOptions()
            );
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.ERROR,
                dedent(`
                    Skipping results upload: Failed to run 47 tests

                    Pretty messed up
                `)
            );
        });

        it("does not display a warning if the plugin was configured but disabled", async () => {
            const logger = getMockedLogger();
            await configureXrayPlugin(mockedCypressEventEmitter, config, {
                jira: { projectKey: "CYP", url: "https://example.org" },
                plugin: { enabled: false },
            });
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Plugin disabled. Skipping further configuration"
            );
        });

        it("does not display an error for failed runs if disabled", async () => {
            const failedResults: CypressFailedRunResultType = {
                status: "failed",
                failures: 47,
                message: "Pretty messed up",
            };
            const logger = getMockedLogger();
            pluginContext.getOptions().plugin.enabled = false;
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", failedResults),
                config,
                pluginContext.getOptions()
            );
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Plugin disabled. Skipping further configuration"
            );
        });

        it("should skip the results upload if disabled", async () => {
            stub(context, "initClients").onFirstCall().resolves(pluginContext.getClients());
            stub(context, "getPluginContext").onFirstCall().returns(pluginContext);
            const afterRunResult: CypressRunResultType = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResultType;
            const logger = getMockedLogger();
            pluginContext.getOptions().xray.uploadResults = false;
            context.setPluginContext(pluginContext);
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", afterRunResult),
                config,
                pluginContext.getOptions()
            );
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Skipping results upload: Plugin is configured to not upload test results"
            );
        });

        it("displays a warning if there are failed vertices", async () => {
            stub(context, "initClients").onFirstCall().resolves(pluginContext.getClients());
            const afterRunResult: CypressRunResultType = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResultType;
            const logger = getMockedLogger();
            logger.logToFile
                .withArgs(Sinon.match.string, "execution-graph.vz")
                .returns("execution-graph.vz");
            pluginContext.getOptions().plugin.debug = true;
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", afterRunResult),
                config,
                pluginContext.getOptions()
            );
            // Workaround: yields control back to the configuration function so that the finally
            // block may run.
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve("ok");
                }, 10);
            });
            expect(logger.message).to.have.been.calledWith(
                Level.WARNING,
                "Failed to execute some steps during plugin execution"
            );
        });
    });

    describe(syncFeatureFile.name, () => {
        let file: Cypress.FileObject;
        beforeEach(() => {
            file = {
                ...({} as Cypress.FileObject),
                filePath: "./test/resources/features/taggedCloud.feature",
                outputPath: "",
                shouldWatch: false,
            };
        });

        it("displays warnings if the plugin was not configured", () => {
            const logger = getMockedLogger();
            syncFeatureFile(file);
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Skipping file:preprocessor hook: Plugin misconfigured: configureXrayPlugin() was not called

                    Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                `)
            );
        });

        it("does not display a warning if the plugin was configured but disabled", async () => {
            const logger = getMockedLogger();
            await configureXrayPlugin(mockedCypressEventEmitter, config, {
                jira: { projectKey: "CYP", url: "https://example.org" },
                plugin: { enabled: false },
            });
            syncFeatureFile(file);
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Plugin disabled. Skipping further configuration"
            );
        });

        it("does not do anything if disabled", () => {
            file.filePath = "./test/resources/features/taggedCloud.feature";
            const logger = getMockedLogger();
            pluginContext.getOptions().plugin.enabled = false;
            context.setPluginContext(pluginContext);
            syncFeatureFile(file);
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Plugin disabled. Skipping feature file synchronization triggered by: ./test/resources/features/taggedCloud.feature"
            );
        });

        it("adds synchronization commands", () => {
            const stubbedHook = stub(synchronizeFeatureFileHook, "addSynchronizationCommands");
            pluginContext.getOptions().cucumber = {
                featureFileExtension: ".feature",
                uploadFeatures: true,
                downloadFeatures: false,
                prefixes: {},
            };
            context.setPluginContext(pluginContext);
            syncFeatureFile(file);
            expect(stubbedHook).to.have.been.calledOnceWithExactly(
                file,
                pluginContext.getCypressOptions().projectRoot,
                pluginContext.getOptions(),
                pluginContext.getClients(),
                pluginContext.getGraph(),
                LOG
            );
        });

        it("does not add synchronization commands for native test files", () => {
            const stubbedHook = stub(synchronizeFeatureFileHook, "addSynchronizationCommands");
            pluginContext.getOptions().cucumber = {
                featureFileExtension: ".feature",
                uploadFeatures: true,
                downloadFeatures: false,
                prefixes: {},
            };
            context.setPluginContext(pluginContext);
            file.filePath = "/something.js";
            syncFeatureFile(file);
            expect(stubbedHook).to.not.have.been.called;
        });
    });
});
