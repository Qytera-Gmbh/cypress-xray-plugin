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
import * as afterRunHook from "./hooks/after/after-run";
import * as synchronizeFeatureFileHook from "./hooks/preprocessor/file-preprocessor";
import { configureXrayPlugin, resetPlugin, syncFeatureFile } from "./plugin";
import { CypressFailedRunResultType, CypressRunResultType } from "./types/cypress/run-result";
import { CypressXrayPluginOptions, PluginContext } from "./types/plugin";
import { dedent } from "./util/dedent";
import { ExecutableGraph } from "./util/graph/executable";
import * as dot from "./util/graph/visualisation/dot";
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
            await configureXrayPlugin(mockedCypressEventEmitter, config, {
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
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            expect(logger.configure).to.have.been.calledWithExactly({
                debug: pluginContext.options.plugin.debug,
                logDirectory: pluginContext.options.plugin.logDirectory,
            });
        });

        it("adds upload commands", async () => {
            stub(context, "initClients").onFirstCall().resolves(pluginContext.clients);
            const afterRunResult: CypressRunResultType = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResultType;
            const stubbedHook = stub(afterRunHook, "addUploadCommands");
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", afterRunResult),
                config,
                pluginContext.options
            );
            expect(stubbedHook).to.have.been.calledOnceWithExactly(
                afterRunResult,
                pluginContext.cypress.projectRoot,
                { ...pluginContext.options, cucumber: undefined },
                pluginContext.clients,
                pluginContext.graph
            );
        });

        it("displays an error for failed runs", async () => {
            stub(context, "initClients").onFirstCall().resolves(pluginContext.clients);
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
            pluginContext.options.plugin.enabled = false;
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", failedResults),
                config,
                pluginContext.options
            );
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Plugin disabled. Skipping further configuration"
            );
        });

        it("should skip the results upload if disabled", async () => {
            stub(context, "initClients").onFirstCall().resolves(pluginContext.clients);
            stub(context, "getPluginContext").onFirstCall().returns(pluginContext);
            const afterRunResult: CypressRunResultType = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResultType;
            const logger = getMockedLogger();
            pluginContext.options.xray.uploadResults = false;
            context.setPluginContext(pluginContext);
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", afterRunResult),
                config,
                pluginContext.options
            );
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Skipping results upload: Plugin is configured to not upload test results"
            );
        });

        it("creates an execution graph if debug is enabled", async () => {
            stub(context, "initClients").onFirstCall().resolves(pluginContext.clients);
            stub(dot, "graphToDot")
                .onFirstCall()
                .resolves(
                    dedent(`
                        digraph "Plugin Execution Graph" {
                          rankdir=TD;
                          node[shape=none];
                        }
                    `)
                );
            const afterRunResult: CypressRunResultType = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResultType;
            const logger = getMockedLogger();
            logger.logToFile
                .withArgs(
                    dedent(`
                        digraph "Plugin Execution Graph" {
                          rankdir=TD;
                          node[shape=none];
                        }
                    `),
                    "execution-graph.vz"
                )
                .returns("execution-graph.vz");
            pluginContext.options.plugin.debug = true;
            await configureXrayPlugin(
                mockedCypressEventEmitter("after:run", afterRunResult),
                config,
                pluginContext.options
            );
            // Workaround: yields control back to the configuration function so that the finally
            // block may run.
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve("ok");
                }, 10);
            });
            expect(logger.message).to.have.been.calledWithExactly(
                Level.DEBUG,
                dedent(`
                    Plugin execution graph saved to: execution-graph.vz

                    You can view it using Graphviz (https://graphviz.org/):

                      dot -o execution-graph.svg -Tsvg execution-graph.vz

                    Alternatively, you can view it online under any of the following websites:
                    - https://dreampuf.github.io/GraphvizOnline
                    - https://edotor.net/
                    - https://www.devtoolsdaily.com/graphviz/
                `)
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
            pluginContext.options.plugin.enabled = false;
            context.setPluginContext(pluginContext);
            syncFeatureFile(file);
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Plugin disabled. Skipping feature file synchronization triggered by: ./test/resources/features/taggedCloud.feature"
            );
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
