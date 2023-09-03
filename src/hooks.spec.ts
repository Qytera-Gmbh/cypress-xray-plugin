import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { readFileSync } from "fs";
import path from "path";
import { stub } from "sinon";
import { stubLogging } from "../test/util";
import { JiraClientServer } from "./client/jira/jiraClientServer";
import { XrayClientServer } from "./client/xray/xrayClientServer";
import { initOptions } from "./context";
import * as dependencies from "./dependencies";
import { afterRunHook, beforeRunHook, synchronizeFile } from "./hooks";
import { ClientCombination, InternalOptions } from "./types/plugin";
import { dedent } from "./util/dedent";

// Enable promise assertions.
chai.use(chaiAsPromised);

describe("the hooks", () => {
    let options: InternalOptions;
    let clients: ClientCombination;

    beforeEach(() => {
        options = initOptions(
            {},
            {
                jira: {
                    projectKey: "CYP",
                    url: "https://example.org",
                },
                cucumber: {
                    featureFileExtension: ".feature",
                },
            }
        );
        clients = {
            kind: "server",
            jiraClient: new JiraClientServer("https://example.org", null),
            xrayClient: new XrayClientServer("https://example.org", null, null),
            jiraRepository: null,
        };
    });

    describe("beforeRun", () => {
        let beforeRunDetails: Cypress.BeforeRunDetails;
        let config: Cypress.PluginConfigOptions;

        beforeEach(() => {
            beforeRunDetails = JSON.parse(readFileSync("./test/resources/beforeRun.json", "utf-8"));
            config = JSON.parse(readFileSync("./test/resources/cypress.config.json", "utf-8"));
            config.env["jsonEnabled"] = true;
            config.env["jsonOutput"] = "logs";
        });

        it("should throw if the plugin was not configured", async () => {
            const { stubbedError } = stubLogging();
            await beforeRunHook(beforeRunDetails, config);
            expect(stubbedError).to.have.been.calledOnceWith(
                dedent(`
                    Plugin misconfigured: configureXrayPlugin() was not called. Skipping before:run hook

                    Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                `)
            );
        });

        it("should not do anything if disabled", async () => {
            const { stubbedInfo } = stubLogging();
            options.plugin.enabled = false;
            await beforeRunHook(beforeRunDetails, config, options);
            expect(stubbedInfo).to.have.been.calledOnceWith(
                "Plugin disabled. Skipping before:run hook"
            );
        });

        it("should throw if the xray client was not configured", async () => {
            clients.xrayClient = undefined;
            await expect(
                beforeRunHook(beforeRunDetails, config, options, clients)
            ).to.eventually.be.rejectedWith(
                dedent(`
                    Plugin misconfigured: Xray client was not configured

                    Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                `)
            );
        });

        it("should throw if the jira client was not configured", async () => {
            clients.jiraClient = undefined;
            await expect(
                beforeRunHook(beforeRunDetails, config, options, clients)
            ).to.eventually.be.rejectedWith(
                dedent(`
                    Plugin misconfigured: Jira client was not configured

                    Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                `)
            );
        });

        it("should ignore the run details if the results upload is disabled", async () => {
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            );
            options.xray.uploadResults = false;
            await beforeRunHook(beforeRunDetails, config, options, clients);
            expect(options.cucumber.preprocessor).to.be.undefined;
        });

        it("should throw if the cucumber preprocessor json report is not enabled", async () => {
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            );
            config.env["jsonEnabled"] = false;
            await expect(
                beforeRunHook(beforeRunDetails, config, options, clients)
            ).to.eventually.be.rejectedWith(
                dedent(`
                    Plugin misconfigured: Cucumber preprocessor JSON report disabled

                    Make sure to enable the JSON report as described in https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md
                `)
            );
        });

        it("should throw if the cucumber preprocessor json report path was not set", async () => {
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            );
            config.env["jsonOutput"] = "";
            await expect(
                beforeRunHook(beforeRunDetails, config, options, clients)
            ).to.eventually.be.rejectedWith(
                dedent(`
                    Plugin misconfigured: Cucumber preprocessor JSON report path was not set

                    Make sure to configure the JSON report path as described in https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md
                `)
            );
        });

        it("throws if the cucumber preprocessor is not installed", async () => {
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            );
            stub(dependencies, "importModule").rejects(new Error("Failed to import package"));
            await expect(
                beforeRunHook(beforeRunDetails, config, options, clients)
            ).to.eventually.be.rejectedWith(
                dedent(`
                    Plugin dependency misconfigured: @badeball/cypress-cucumber-preprocessor

                    Error: Failed to import package

                    The plugin depends on the package and should automatically download it during installation, but might have failed to do so because of conflicting Node versions

                    Make sure to install the package manually using: npm install @badeball/cypress-cucumber-preprocessor --save-dev
                `)
            );
        });

        it("should fetch xray issue type information to prepare for cucumber results upload", async () => {
            const { stubbedInfo } = stubLogging();
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            );
            options.jira.testPlanIssueKey = "CYP-456";
            stub(clients.jiraClient, "getIssueTypes").resolves([
                {
                    name: "Test Execution",
                    id: "12345",
                    subtask: false,
                },
            ]);
            await beforeRunHook(beforeRunDetails, config, options, clients);
            expect(stubbedInfo).to.have.been.calledWith(
                "Fetching necessary Jira issue type information in preparation for Cucumber result uploads..."
            );
            expect(options.jira.testExecutionIssueDetails).to.deep.eq({
                name: "Test Execution",
                id: "12345",
                subtask: false,
            });
        });

        it("should not fetch xray issue type information for native results upload", async () => {
            const { stubbedInfo } = stubLogging();
            beforeRunDetails = JSON.parse(readFileSync("./test/resources/beforeRun.json", "utf-8"));
            await beforeRunHook(beforeRunDetails, config, options, clients);
            expect(stubbedInfo).to.not.have.been.called;
        });

        it("should throw if xray test execution issue type information can not be fetched", async () => {
            stubLogging();
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            );
            options.jira.testExecutionIssueType = "Execution Issue";
            stub(clients.jiraClient, "getIssueTypes").resolves([
                {
                    name: "Bug",
                    id: "67890",
                    subtask: false,
                },
            ]);
            await expect(
                beforeRunHook(beforeRunDetails, config, options, clients)
            ).to.eventually.be.rejectedWith(
                dedent(`
                    Failed to retrieve issue type information for issue type: Execution Issue

                    Make sure you have Xray installed.

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testExecutionIssueType
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testPlanIssueType
                `)
            );
        });

        it("should throw if multiple xray test execution issue types are fetched", async () => {
            stubLogging();
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            );
            options.jira.testExecutionIssueType = "Execution Issue";
            stub(clients.jiraClient, "getIssueTypes").resolves([
                {
                    name: "Execution Issue",
                    id: "12345",
                    subtask: false,
                },
                {
                    name: "Execution Issue",
                    id: "67890",
                    subtask: false,
                },
            ]);
            await expect(
                beforeRunHook(beforeRunDetails, config, options, clients)
            ).to.eventually.be.rejectedWith(
                dedent(`
                    Found multiple issue types named: Execution Issue

                    Make sure to only make a single one available in project CYP.

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testExecutionIssueType
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testPlanIssueType
                `)
            );
        });

        it("should throw if jira issue type information cannot be fetched", async () => {
            stubLogging();
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            );
            stub(clients.jiraClient, "getIssueTypes").resolves(undefined);
            await expect(
                beforeRunHook(beforeRunDetails, config, options, clients)
            ).to.eventually.be.rejectedWith(
                dedent(`
                    Jira issue type information could not be fetched.

                    Please make sure project CYP exists at https://example.org

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#projectkey
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                `)
            );
        });
    });

    describe("afterRun", () => {
        let results: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );

        beforeEach(() => {
            results = JSON.parse(readFileSync("./test/resources/runResult.json", "utf-8"));
        });

        it("should display errors if the plugin was not configured", async () => {
            const { stubbedError } = stubLogging();
            await afterRunHook(results);
            expect(stubbedError).to.have.been.calledOnce;
            expect(stubbedError).to.have.been.calledWith(
                dedent(`
                    Skipping after:run hook: Plugin misconfigured: configureXrayPlugin() was not called

                    Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                `)
            );
        });

        it("should throw an error for missing xray clients", async () => {
            clients.xrayClient = undefined;
            await expect(afterRunHook(results, options)).to.eventually.be.rejectedWith(
                dedent(`
                    Plugin misconfigured: Xray client not configured

                    Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                `)
            );
        });

        it("should not display an error for missing xray clients if disabled", async () => {
            const { stubbedInfo } = stubLogging();
            options.plugin.enabled = false;
            await afterRunHook(results, options);
            expect(stubbedInfo).to.have.been.calledOnce;
            expect(stubbedInfo).to.have.been.calledWith("Skipping after:run hook: Plugin disabled");
        });

        it("should throw an error for missing jira clients", async () => {
            clients.jiraClient = undefined;
            await expect(afterRunHook(results, options, clients)).to.eventually.be.rejectedWith(
                dedent(`
                    Plugin misconfigured: Jira client not configured

                    Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                `)
            );
        });

        it("should not display an error for missing jira clients if disabled", async () => {
            const { stubbedInfo } = stubLogging();
            options.plugin.enabled = false;
            await afterRunHook(results, options, clients);
            expect(stubbedInfo).to.have.been.calledOnce;
            expect(stubbedInfo).to.have.been.calledWith("Skipping after:run hook: Plugin disabled");
        });

        it("should display an error for failed runs", async () => {
            const { stubbedError } = stubLogging();
            const failedResults: CypressCommandLine.CypressFailedRunResult = {
                status: "failed",
                failures: 47,
                message: "Pretty messed up",
            };
            await afterRunHook(failedResults, options);
            expect(stubbedError).to.have.been.calledOnce;
            expect(stubbedError).to.have.been.calledWith(
                dedent(`
                    Skipping after:run hook: Failed to run 47 tests

                    Pretty messed up
                `)
            );
        });

        it("should not display an error for failed runs if disabled", async () => {
            const { stubbedInfo } = stubLogging();
            const failedResults: CypressCommandLine.CypressFailedRunResult = {
                status: "failed",
                failures: 47,
                message: "Pretty messed up",
            };
            options.plugin.enabled = false;
            await afterRunHook(failedResults, options);
            expect(stubbedInfo).to.have.been.calledOnce;
            expect(stubbedInfo).to.have.been.calledWith("Skipping after:run hook: Plugin disabled");
        });

        it("should skip the results upload if disabled", async () => {
            const { stubbedInfo } = stubLogging();
            options.xray.uploadResults = false;
            await afterRunHook(results, options, clients);
            expect(stubbedInfo).to.have.been.calledOnce;
            expect(stubbedInfo).to.have.been.calledWith(
                "Skipping results upload: Plugin is configured to not upload test results"
            );
        });
    });

    describe("the synchronize file hook", () => {
        const file: Cypress.FileObject = {
            filePath: "./test/resources/features/taggedCloud.feature",
            outputPath: null,
            shouldWatch: false,
            addListener: null,
            on: null,
            once: null,
            removeListener: null,
            off: null,
            removeAllListeners: null,
            setMaxListeners: null,
            getMaxListeners: null,
            listeners: null,
            rawListeners: null,
            emit: null,
            listenerCount: null,
            prependListener: null,
            prependOnceListener: null,
            eventNames: null,
        };

        it("should display errors if the plugin was not configured", async () => {
            const { stubbedError } = stubLogging();
            await synchronizeFile(file, ".", null, null);
            expect(stubbedError).to.have.been.calledOnce;
            expect(stubbedError).to.have.been.calledWith(
                dedent(`
                    Plugin misconfigured (no configuration was provided). Skipping feature file synchronization triggered by: ./test/resources/features/taggedCloud.feature

                    Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
                `)
            );
        });

        it("should not do anything if disabled", async () => {
            file.filePath = "./test/resources/features/taggedCloud.feature";
            const { stubbedInfo } = stubLogging();
            options.plugin = { enabled: false };
            await synchronizeFile(file, ".", options, null);
            expect(stubbedInfo).to.have.been.calledOnce;
            expect(stubbedInfo).to.have.been.calledWith(
                "Plugin disabled. Skipping feature file synchronization triggered by: ./test/resources/features/taggedCloud.feature"
            );
        });

        it("should display errors for invalid feature files", async () => {
            file.filePath = "./test/resources/features/invalid.feature";
            const { stubbedInfo, stubbedError } = stubLogging();
            options.cucumber.uploadFeatures = true;
            await synchronizeFile(file, ".", options, clients);
            expect(stubbedError).to.have.been.calledOnce;
            expect(stubbedError).to.have.been.calledWith(
                "Feature file invalid, skipping synchronization: Error: Parser errors:\n" +
                    "(9:3): expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got 'Invalid: Element'"
            );
            expect(stubbedInfo).to.have.been.calledOnce;
            expect(stubbedInfo).to.have.been.calledWith(
                `Preprocessing feature file ${path.join(
                    "test",
                    "resources",
                    "features",
                    "invalid.feature"
                )}...`
            );
        });

        it("should not try to parse mismatched feature files", async () => {
            file.filePath = "./test/resources/greetings.txt";
            const { stubbedError } = stubLogging();
            await synchronizeFile(file, ".", options, null);
            expect(stubbedError).to.not.have.been.called;
        });
    });
});
