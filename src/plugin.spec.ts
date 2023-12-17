import { expect } from "chai";
import fs from "fs";
import { stub } from "sinon";
import { stubLogging, stubRequests } from "../test/mocks";
import { mockedCypressEventEmitter } from "../test/util";
import { PATCredentials } from "./authentication/credentials";
import { JiraClientServer } from "./client/jira/jiraClientServer";
import { XrayClientServer } from "./client/xray/xrayClientServer";
import * as context from "./context";
import * as hooks from "./hooks/hooks";
import * as synchronizeFeatureFileHook from "./hooks/preprocessor/synchronizeFeatureFile";
import { addXrayResultUpload, configureXrayPlugin, resetPlugin, syncFeatureFile } from "./plugin";
import { CachingJiraFieldRepository } from "./repository/jira/fields/jiraFieldRepository";
import { JiraIssueFetcher } from "./repository/jira/fields/jiraIssueFetcher";
import { CachingJiraRepository } from "./repository/jira/jiraRepository";
import { Options, PluginContext } from "./types/plugin";
import { dedent } from "./util/dedent";

describe("the plugin", () => {
    let config: Cypress.PluginConfigOptions;
    let pluginContext: PluginContext;

    beforeEach(() => {
        config = JSON.parse(fs.readFileSync("./test/resources/cypress.config.json", "utf-8"));
        const jiraClient = new JiraClientServer("https://example.org", new PATCredentials("token"));
        const xrayClient = new XrayClientServer("https://example.org", new PATCredentials("token"));
        const jiraOptions = context.initJiraOptions(
            {},
            {
                projectKey: "CYP",
                url: "https://example.org",
            }
        );
        const jiraFieldRepository = new CachingJiraFieldRepository(jiraClient);
        const jiraFieldFetcher = new JiraIssueFetcher(
            jiraClient,
            jiraFieldRepository,
            jiraOptions.fields
        );
        const jiraRepository = new CachingJiraRepository(jiraFieldRepository, jiraFieldFetcher);
        pluginContext = {
            cypress: config,
            internal: {
                jira: jiraOptions,
                plugin: context.initPluginOptions({}, {}),
                xray: context.initXrayOptions({}, {}),
                openSSL: context.initOpenSSLOptions({}, {}),
            },
            clients: {
                kind: "server",
                jiraClient: jiraClient,
                xrayClient: xrayClient,
                jiraRepository: jiraRepository,
            },
        };
        resetPlugin();
    });

    describe("configureXrayPlugin", () => {
        it("does nothing if disabled", async () => {
            const { stubbedInfo } = stubLogging();
            await configureXrayPlugin(config, {
                jira: {
                    projectKey: "ABC",
                    url: "https://example.org",
                },
                plugin: {
                    enabled: false,
                },
            });
            expect(stubbedInfo).to.have.been.calledOnceWith(
                "Plugin disabled. Skipping further configuration"
            );
        });

        it("initializes the plugin context with the provided options", async () => {
            config.env = {
                jsonEnabled: true,
                jsonOutput: "somewhere",
                JIRA_API_TOKEN: "token",
            };
            const stubbedContext = stub(context, "setPluginContext");
            const stubbedClients = stub(context, "initClients");
            stubbedClients.onFirstCall().resolves(pluginContext.clients);
            const options: Options = {
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
                openSSL: {
                    rootCAPath: "/home/somewhere",
                    secureOptions: 42,
                },
            };
            await configureXrayPlugin(config, options);
            expect(stubbedContext.firstCall.args[0].cypress).to.eq(config);
            expect(stubbedContext.firstCall.args[0].internal.jira).to.deep.eq({
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
            expect(stubbedContext.firstCall.args[0].internal.plugin).to.deep.eq(options.plugin);
            expect(stubbedContext.firstCall.args[0].internal.xray).to.deep.eq(options.xray);
            expect(stubbedContext.firstCall.args[0].internal.cucumber?.featureFileExtension).to.eq(
                ".cucumber"
            );
            expect(stubbedContext.firstCall.args[0].internal.cucumber?.downloadFeatures).to.be
                .false;
            expect(stubbedContext.firstCall.args[0].internal.cucumber?.uploadFeatures).to.be.false;
            expect(
                stubbedContext.firstCall.args[0].internal.cucumber?.preprocessor?.json
            ).to.deep.eq({
                enabled: true,
                output: "somewhere",
            });
            expect(stubbedContext.firstCall.args[0].internal.openSSL).to.deep.eq(options.openSSL);
            expect(stubbedContext.firstCall.args[0].clients).to.eq(pluginContext.clients);
        });

        it("initializes the requests module", async () => {
            const stubbedClients = stub(context, "initClients");
            const { stubbedInit } = stubRequests();
            stubbedClients.onFirstCall().resolves(pluginContext.clients);
            const options: Options = {
                jira: {
                    projectKey: "ABC",
                    url: "https://example.org",
                },
            };
            await configureXrayPlugin(config, options);
            expect(stubbedInit).to.have.been.calledOnceWithExactly({
                debug: false,
                openSSL: pluginContext.internal.openSSL,
            });
        });

        it("initializes the logging module", async () => {
            const stubbedClients = stub(context, "initClients");
            const { stubbedInit } = stubLogging();
            stubbedClients.onFirstCall().resolves(pluginContext.clients);
            const options: Options = {
                jira: {
                    projectKey: "ABC",
                    url: "https://example.org",
                },
            };
            await configureXrayPlugin(config, options);
            expect(stubbedInit).to.have.been.calledOnceWithExactly({
                debug: pluginContext.internal.plugin.debug,
                logDirectory: pluginContext.internal.plugin.logDirectory,
            });
        });
    });

    describe("addXrayResultUpload", () => {
        describe("on before:run", () => {
            it("displays warnings if the plugin was not configured", async () => {
                const beforeRunDetails: Cypress.BeforeRunDetails = JSON.parse(
                    fs.readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
                );
                const { stubbedWarning } = stubLogging();
                await addXrayResultUpload(
                    mockedCypressEventEmitter("before:run", beforeRunDetails)
                );
                expect(stubbedWarning).to.have.been.calledWith(
                    dedent(`
                        Skipping before:run hook: Plugin misconfigured: configureXrayPlugin() was not called

                        Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                    `)
                );
            });

            it("does not display a warning if the plugin was configured but disabled", async () => {
                const beforeRunDetails: Cypress.BeforeRunDetails = JSON.parse(
                    fs.readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
                );
                const { stubbedWarning } = stubLogging();
                await configureXrayPlugin(config, {
                    jira: { projectKey: "CYP", url: "https://example.org" },
                    plugin: { enabled: false },
                });
                await addXrayResultUpload(
                    mockedCypressEventEmitter("before:run", beforeRunDetails)
                );
                expect(stubbedWarning).to.not.have.been.called;
            });

            it("does nothing if disabled", async () => {
                const beforeRunDetails: Cypress.BeforeRunDetails = JSON.parse(
                    fs.readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
                );
                const { stubbedInfo } = stubLogging();
                pluginContext.internal.plugin.enabled = false;
                context.setPluginContext(pluginContext);
                await addXrayResultUpload(
                    mockedCypressEventEmitter("before:run", beforeRunDetails)
                );
                expect(stubbedInfo).to.have.been.calledOnceWith(
                    "Plugin disabled. Skipping before:run hook"
                );
            });

            it("warns about empty specs", async () => {
                const beforeRunDetails: Cypress.BeforeRunDetails = JSON.parse(
                    fs.readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
                );
                const { stubbedWarning } = stubLogging();
                context.setPluginContext(pluginContext);
                beforeRunDetails.specs = undefined;
                await addXrayResultUpload(
                    mockedCypressEventEmitter("before:run", beforeRunDetails)
                );
                expect(stubbedWarning).to.have.been.calledOnceWithExactly(
                    "No specs about to be executed. Skipping before:run hook"
                );
            });

            it("calls the beforeRun hook", async () => {
                const beforeRunDetails: Cypress.BeforeRunDetails = JSON.parse(
                    fs.readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
                );
                const stubbedHook = stub(hooks, "beforeRunHook");
                context.setPluginContext(pluginContext);
                await addXrayResultUpload(
                    mockedCypressEventEmitter("before:run", beforeRunDetails)
                );
                expect(stubbedHook).to.have.been.calledOnceWithExactly(
                    beforeRunDetails.specs,
                    pluginContext.internal,
                    pluginContext.clients
                );
            });
        });

        describe("on after:run", () => {
            it("displays warnings if the plugin was not configured", async () => {
                const afterRunResult: CypressCommandLine.CypressRunResult = JSON.parse(
                    fs.readFileSync("./test/resources/runResult.json", "utf-8")
                );
                const { stubbedWarning } = stubLogging();
                await addXrayResultUpload(mockedCypressEventEmitter("after:run", afterRunResult));
                expect(stubbedWarning).to.have.been.calledOnce;
                expect(stubbedWarning).to.have.been.calledWith(
                    dedent(`
                        Skipping after:run hook: Plugin misconfigured: configureXrayPlugin() was not called

                        Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                    `)
                );
            });

            it("does not display a warning if the plugin was configured but disabled", async () => {
                const afterRunResult: CypressCommandLine.CypressRunResult = JSON.parse(
                    fs.readFileSync("./test/resources/runResult.json", "utf-8")
                );
                const { stubbedWarning } = stubLogging();
                await configureXrayPlugin(config, {
                    jira: { projectKey: "CYP", url: "https://example.org" },
                    plugin: { enabled: false },
                });
                await addXrayResultUpload(mockedCypressEventEmitter("after:run", afterRunResult));
                expect(stubbedWarning).to.not.have.been.called;
            });

            it("does not display an error for failed runs if disabled", async () => {
                const failedResults: CypressCommandLine.CypressFailedRunResult = {
                    status: "failed",
                    failures: 47,
                    message: "Pretty messed up",
                };
                const { stubbedInfo } = stubLogging();
                pluginContext.internal.plugin.enabled = false;
                context.setPluginContext(pluginContext);
                await addXrayResultUpload(mockedCypressEventEmitter("after:run", failedResults));
                expect(stubbedInfo).to.have.been.calledOnce;
                expect(stubbedInfo).to.have.been.calledWith(
                    "Skipping after:run hook: Plugin disabled"
                );
            });

            it("should skip the results upload if disabled", async () => {
                const afterRunResult: CypressCommandLine.CypressRunResult = JSON.parse(
                    fs.readFileSync("./test/resources/runResult.json", "utf-8")
                );
                const { stubbedInfo } = stubLogging();
                pluginContext.internal.xray.uploadResults = false;
                context.setPluginContext(pluginContext);
                await addXrayResultUpload(mockedCypressEventEmitter("after:run", afterRunResult));
                expect(stubbedInfo).to.have.been.calledOnce;
                expect(stubbedInfo).to.have.been.calledWith(
                    "Skipping results upload: Plugin is configured to not upload test results"
                );
            });

            it("displays an error for failed runs", async () => {
                const failedResults: CypressCommandLine.CypressFailedRunResult = {
                    status: "failed",
                    failures: 47,
                    message: "Pretty messed up",
                };
                const { stubbedError } = stubLogging();
                context.setPluginContext(pluginContext);
                await addXrayResultUpload(mockedCypressEventEmitter("after:run", failedResults));
                expect(stubbedError).to.have.been.calledOnce;
                expect(stubbedError).to.have.been.calledWith(
                    dedent(`
                        Skipping after:run hook: Failed to run 47 tests

                        Pretty messed up
                `)
                );
            });

            it("calls the afterRun hook", async () => {
                const afterRunResult: CypressCommandLine.CypressRunResult = JSON.parse(
                    fs.readFileSync("./test/resources/runResult.json", "utf-8")
                );
                const stubbedHook = stub(hooks, "afterRunHook");
                context.setPluginContext(pluginContext);
                await addXrayResultUpload(mockedCypressEventEmitter("after:run", afterRunResult));
                expect(stubbedHook).to.have.been.calledOnceWithExactly(
                    afterRunResult,
                    pluginContext.internal,
                    pluginContext.clients
                );
            });
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
            const { stubbedWarning } = stubLogging();
            await syncFeatureFile(file);
            expect(stubbedWarning).to.have.been.calledOnce;
            expect(stubbedWarning).to.have.been.calledWith(
                dedent(`
                    Skipping file:preprocessor hook: Plugin misconfigured: configureXrayPlugin() was not called

                    Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                `)
            );
        });

        it("does not display a warning if the plugin was configured but disabled", async () => {
            const { stubbedWarning } = stubLogging();
            await configureXrayPlugin(config, {
                jira: { projectKey: "CYP", url: "https://example.org" },
                plugin: { enabled: false },
            });
            await syncFeatureFile(file);
            expect(stubbedWarning).to.not.have.been.called;
        });

        it("does not do anything if disabled", async () => {
            file.filePath = "./test/resources/features/taggedCloud.feature";
            const { stubbedInfo } = stubLogging();
            pluginContext.internal.plugin.enabled = false;
            context.setPluginContext(pluginContext);
            await syncFeatureFile(file);
            expect(stubbedInfo).to.have.been.calledOnce;
            expect(stubbedInfo).to.have.been.calledWith(
                "Plugin disabled. Skipping feature file synchronization triggered by: ./test/resources/features/taggedCloud.feature"
            );
        });

        it("calls the synchronizeFile hook", async () => {
            const stubbedHook = stub(synchronizeFeatureFileHook, "synchronizeFeatureFile");
            context.setPluginContext(pluginContext);
            await syncFeatureFile(file);
            expect(stubbedHook).to.have.been.calledOnceWithExactly(
                file,
                pluginContext.cypress.projectRoot,
                pluginContext.internal,
                pluginContext.clients
            );
        });
    });
});
