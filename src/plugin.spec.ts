import { expect } from "chai";
import fs from "fs";
import { stub } from "sinon";
import { mockedCypressEventEmitter, stubLogging } from "../test/util";
import { PATCredentials } from "./authentication/credentials";
import { JiraClientServer } from "./client/jira/jiraClientServer";
import { XrayClientServer } from "./client/xray/xrayClientServer";
import {
    clearContext,
    initJiraOptions,
    initOpenSSLOptions,
    initPluginOptions,
    initXrayOptions,
    setPluginContext,
} from "./context";
import * as hooks from "./hooks";
import { addXrayResultUpload, syncFeatureFile } from "./plugin";
import { JiraRepositoryServer } from "./repository/jira/jiraRepositoryServer";
import { PluginContext } from "./types/plugin";
import { dedent } from "./util/dedent";

describe("the plugin", () => {
    const config: Cypress.PluginConfigOptions = JSON.parse(
        fs.readFileSync("./test/resources/cypress.config.json", "utf-8")
    );
    let pluginContext: PluginContext;

    beforeEach(() => {
        const jiraClient = new JiraClientServer("https://example.org", new PATCredentials("token"));
        const xrayClient = new XrayClientServer(
            "https://example.org",
            new PATCredentials("token"),
            jiraClient
        );
        const jiraOptions = initJiraOptions(
            {},
            {
                projectKey: "CYP",
                url: "https://example.org",
            }
        );
        const jiraRepository = new JiraRepositoryServer(jiraClient, xrayClient, jiraOptions);
        pluginContext = {
            cypress: config,
            internal: {
                jira: jiraOptions,
                plugin: initPluginOptions({}, {}),
                xray: initXrayOptions({}, {}),
                openSSL: initOpenSSLOptions({}, {}),
            },
            clients: {
                kind: "server",
                jiraClient: jiraClient,
                xrayClient: xrayClient,
                jiraRepository: jiraRepository,
            },
        };
    });

    describe("addXrayResultUpload", () => {
        describe("on before:run", () => {
            it("displays errors if the plugin was not configured", async () => {
                const beforeRunDetails: Cypress.BeforeRunDetails = JSON.parse(
                    fs.readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
                );
                const { stubbedError } = stubLogging();
                clearContext();
                await addXrayResultUpload(
                    mockedCypressEventEmitter("before:run", beforeRunDetails)
                );
                expect(stubbedError).to.have.been.calledWith(
                    dedent(`
                        Skipping before:run hook: Plugin misconfigured: configureXrayPlugin() was not called

                        Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                    `)
                );
            });

            it("does nothing if disabled", async () => {
                const beforeRunDetails: Cypress.BeforeRunDetails = JSON.parse(
                    fs.readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
                );
                const { stubbedInfo } = stubLogging();
                pluginContext.internal.plugin.enabled = false;
                setPluginContext(pluginContext);
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
                setPluginContext(pluginContext);
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
                setPluginContext(pluginContext);
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
            it("displays errors if the plugin was not configured", async () => {
                const afterRunResult: CypressCommandLine.CypressRunResult = JSON.parse(
                    fs.readFileSync("./test/resources/runResult.json", "utf-8")
                );
                const { stubbedError } = stubLogging();
                clearContext();
                await addXrayResultUpload(mockedCypressEventEmitter("after:run", afterRunResult));
                expect(stubbedError).to.have.been.calledOnce;
                expect(stubbedError).to.have.been.calledWith(
                    dedent(`
                        Skipping after:run hook: Plugin misconfigured: configureXrayPlugin() was not called

                        Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                    `)
                );
            });

            it("does not display an error for failed runs if disabled", async () => {
                const failedResults: CypressCommandLine.CypressFailedRunResult = {
                    status: "failed",
                    failures: 47,
                    message: "Pretty messed up",
                };
                const { stubbedInfo } = stubLogging();
                pluginContext.internal.plugin.enabled = false;
                setPluginContext(pluginContext);
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
                setPluginContext(pluginContext);
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
                setPluginContext(pluginContext);
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
                setPluginContext(pluginContext);
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

        it("displays errors if the plugin was not configured", async () => {
            const { stubbedError } = stubLogging();
            clearContext();
            await syncFeatureFile(file);
            expect(stubbedError).to.have.been.calledOnce;
            expect(stubbedError).to.have.been.calledWith(
                dedent(`
                    Skipping file:preprocessor hook: Plugin misconfigured: configureXrayPlugin() was not called

                    Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                `)
            );
        });

        it("does not do anything if disabled", async () => {
            file.filePath = "./test/resources/features/taggedCloud.feature";
            const { stubbedInfo } = stubLogging();
            pluginContext.internal.plugin.enabled = false;
            setPluginContext(pluginContext);
            await syncFeatureFile(file);
            expect(stubbedInfo).to.have.been.calledOnce;
            expect(stubbedInfo).to.have.been.calledWith(
                "Plugin disabled. Skipping feature file synchronization triggered by: ./test/resources/features/taggedCloud.feature"
            );
        });

        it("calls the synchronizeFile hook", async () => {
            const stubbedHook = stub(hooks, "synchronizeFile");
            setPluginContext(pluginContext);
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
