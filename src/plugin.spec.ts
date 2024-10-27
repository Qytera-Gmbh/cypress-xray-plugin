import { expect } from "chai";
import fs from "fs";
import path from "path";
import Sinon, { stub } from "sinon";
import { getMockedJiraClient, getMockedLogger, getMockedXrayClient } from "../test/mocks";
import { mockedCypressEventEmitter } from "../test/util";
import { AxiosRestClient } from "./client/https/requests";
import { JiraClient } from "./client/jira/jira-client";
import * as context from "./context";
import * as afterRunHook from "./hooks/after/after-run";
import * as synchronizeFeatureFileHook from "./hooks/preprocessor/file-preprocessor";
import { configureXrayPlugin, resetPlugin, syncFeatureFile } from "./plugin";
import { CypressFailedRunResultType, CypressRunResultType } from "./types/cypress/cypress";
import { CypressXrayPluginOptions } from "./types/plugin";
import { dedent } from "./util/dedent";
import { ExecutableGraph } from "./util/graph/executable-graph";
import { CapturingLogger, Level } from "./util/logging";

describe(path.relative(process.cwd(), __filename), () => {
    let jiraClient: Sinon.SinonStubbedInstance<JiraClient>;
    let config: Cypress.PluginConfigOptions;
    let pluginContext: context.PluginContext;

    beforeEach(() => {
        config = JSON.parse(
            fs.readFileSync("./test/resources/cypress.config.json", "utf-8")
        ) as Cypress.PluginConfigOptions;
        jiraClient = getMockedJiraClient();
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
                jiraClient: jiraClient,
                kind: "server",
                xrayClient: xrayClient,
            },
            {
                cucumber: undefined,
                http: {},
                jira: jiraOptions,
                plugin: context.initPluginOptions({}, {}),
                xray: context.initXrayOptions({}, {}),
            },
            config,
            new context.SimpleEvidenceCollection(),
            new ExecutableGraph(),
            new CapturingLogger()
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
                "Plugin disabled. Skipping further configuration."
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
                "Interactive mode detected, disabling plugin."
            );
            expect(mockedOn).to.have.been.calledOnceWith("task");
        });

        it("initializes the plugin context with the provided options", async () => {
            config.env = {
                ["JIRA_API_TOKEN"]: "token",
                jsonEnabled: true,
                jsonOutput: "somewhere",
            };
            const stubbedContext = stub(context, "setPluginContext");
            const stubbedClients = stub(context, "initClients");
            stubbedClients.onFirstCall().resolves(pluginContext.getClients());
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
                    url: "https://example.org",
                },
                plugin: {
                    debug: false,
                    enabled: true,
                    logDirectory: "xyz",
                    normalizeScreenshotNames: true,
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
            };
            await configureXrayPlugin(mockedCypressEventEmitter, config, options);
            expect(stubbedContext.firstCall.args[0]?.getCypressOptions()).to.eq(config);
            expect(stubbedContext.firstCall.args[0]?.getOptions().jira).to.deep.eq({
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
                url: "https://example.org",
            });
            expect(stubbedContext.firstCall.args[0]?.getOptions().plugin).to.deep.eq({
                ...options.plugin,
                logDirectory: path.resolve(config.projectRoot, "xyz"),
            });
            expect(stubbedContext.firstCall.args[0]?.getOptions().xray).to.deep.eq({
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
                jira: {
                    projectKey: "ABC",
                    url: "https://example.org",
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
                    rateLimiting: undefined,
                }),
                xray: new AxiosRestClient({
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
                new ExecutableGraph(),
                new CapturingLogger()
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
            expect(stubbedHook.firstCall.args[6]).to.be.an.instanceOf(CapturingLogger);
        });

        it("displays an error for failed runs", async () => {
            stub(context, "initClients").onFirstCall().resolves(pluginContext.getClients());
            stub(context, "getPluginContext").onFirstCall().returns(pluginContext);
            const failedResults: CypressFailedRunResultType = {
                failures: 47,
                message: "Pretty messed up",
                status: "failed",
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
                    Skipping results upload: Failed to run 47 tests.

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
                "Plugin disabled. Skipping further configuration."
            );
        });

        it("does not display an error for failed runs if disabled", async () => {
            const failedResults: CypressFailedRunResultType = {
                failures: 47,
                message: "Pretty messed up",
                status: "failed",
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
                "Plugin disabled. Skipping further configuration."
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
                "Skipping results upload: Plugin is configured to not upload test results."
            );
        });

        it("displays a warning if there are failed vertices", async () => {
            stub(context, "initClients").onFirstCall().resolves(pluginContext.getClients());
            jiraClient.getIssueTypes.onFirstCall().resolves([{ name: "Test Execution" }]);
            const afterRunResult: CypressRunResultType = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResultType;
            const logger = getMockedLogger();
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
            expect(logger.message.getCall(0).args).to.deep.eq([
                Level.WARNING,
                "Encountered problems during plugin execution!",
            ]);
            expect(logger.message.getCall(1).args).to.deep.eq([
                Level.WARNING,
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
            expect(logger.message.getCall(2).args).to.deep.eq([
                Level.WARNING,
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
            expect(logger.message.getCall(3).args).to.deep.eq([
                Level.WARNING,
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
            expect(logger.message.getCall(4).args).to.deep.eq([
                Level.WARNING,
                "No test results were uploaded",
            ]);
            expect(logger.message.getCall(5).args).to.deep.eq([
                Level.ERROR,
                dedent(`
                    Failed to upload Cypress execution results.

                      Caused by: Failed to convert Cypress tests into Xray tests: No Cypress tests to upload
                `),
            ]);
        });
    });

    it("displays warning and errors after other log messages", async () => {
        const logger = getMockedLogger();
        const xrayClient = getMockedXrayClient();
        stub(context, "initClients").onFirstCall().resolves({
            jiraClient: jiraClient,
            kind: "cloud",
            xrayClient: xrayClient,
        });
        stub(context, "initCucumberOptions")
            .onFirstCall()
            .resolves({
                downloadFeatures: false,
                featureFileExtension: ".feature",
                prefixes: {
                    precondition: "Precondition:",
                    test: "TestName:",
                },
                preprocessor: {
                    json: {
                        enabled: true,
                        output: path.resolve(
                            "./test/resources/fixtures/cucumber/empty-report.json"
                        ),
                    },
                },
                uploadFeatures: true,
            });
        jiraClient.getFields.resolves([
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
        jiraClient.getIssueTypes.resolves([{ name: "Test Execution" }]);
        xrayClient.importExecutionMultipart.onFirstCall().resolves("CYP-123");
        xrayClient.importExecutionCucumberMultipart.onFirstCall().resolves("CYP-123");
        xrayClient.importFeature
            .onFirstCall()
            .resolves({ errors: [], updatedOrCreatedIssues: ["CYP-222", "CYP-333", "CYP-555"] });
        const afterRunResult = JSON.parse(
            fs.readFileSync("./test/resources/runResult_13_0_0_mixed.json", "utf-8")
        ) as CypressRunResultType;
        const spy = Sinon.spy();
        await configureXrayPlugin(spy, config, {
            cucumber: {
                featureFileExtension: ".feature",
                uploadFeatures: true,
            },
            jira: {
                projectKey: "CYP",
                url: "https://example.org",
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
        } as Cypress.FileObject);
        const [eventName, callback] = spy.secondCall.args as [
            string,
            (results: CypressFailedRunResultType | CypressRunResultType) => Promise<void> | void
        ];
        expect(eventName).to.eq("after:run");
        await callback(afterRunResult);
        expect(logger.message.getCall(0).args).to.deep.eq([
            Level.INFO,
            "Parsing feature file: ./test/resources/features/invalid.feature",
        ]);
        expect(logger.message.getCall(1).args).to.deep.eq([
            Level.SUCCESS,
            "Uploaded Cypress test results to issue: CYP-123 (https://example.org/browse/CYP-123)",
        ]);
        expect(logger.message.getCall(2).args).to.deep.eq([
            Level.WARNING,
            "Encountered problems during plugin execution!",
        ]);
        expect(logger.message.getCall(3).args).to.deep.eq([
            Level.ERROR,
            dedent(`
                Failed to upload Cucumber execution results.

                  Caused by: Skipping Cucumber results upload: No Cucumber tests were executed
            `),
        ]);
        expect(logger.message.getCall(4).args).to.deep.eq([
            Level.ERROR,
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
                    ./test/resources/features/taggedCloud.feature

                      Skipping file:preprocessor hook: Plugin misconfigured: configureXrayPlugin() was not called.

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
                "Plugin disabled. Skipping further configuration."
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
                dedent(`
                    ./test/resources/features/taggedCloud.feature

                      Plugin disabled. Skipping feature file synchronization.
                `)
            );
        });

        it("adds synchronization commands", () => {
            const stubbedHook = stub(synchronizeFeatureFileHook, "addSynchronizationCommands");
            pluginContext.getOptions().cucumber = {
                downloadFeatures: false,
                featureFileExtension: ".feature",
                prefixes: {},
                uploadFeatures: true,
            };
            context.setPluginContext(pluginContext);
            syncFeatureFile(file);
            expect(stubbedHook).to.have.been.calledOnceWithExactly(
                file,
                pluginContext.getOptions(),
                pluginContext.getClients(),
                pluginContext.getGraph(),
                pluginContext.getLogger()
            );
        });

        it("does not add synchronization commands for native test files", () => {
            const stubbedHook = stub(synchronizeFeatureFileHook, "addSynchronizationCommands");
            pluginContext.getOptions().cucumber = {
                downloadFeatures: false,
                featureFileExtension: ".feature",
                prefixes: {},
                uploadFeatures: true,
            };
            context.setPluginContext(pluginContext);
            file.filePath = "/something.js";
            syncFeatureFile(file);
            expect(stubbedHook).to.not.have.been.called;
        });
    });
});
