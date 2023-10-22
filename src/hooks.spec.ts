import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { readFileSync } from "fs";
import path from "path";
import { stub } from "sinon";
import { stubLogging } from "../test/util";
import { PATCredentials } from "./authentication/credentials";
import { JiraClientServer } from "./client/jira/jiraClientServer";
import { XrayClientServer } from "./client/xray/xrayClientServer";
import {
    initCucumberOptions,
    initJiraOptions,
    initOpenSSLOptions,
    initPluginOptions,
    initXrayOptions,
} from "./context";
import { beforeRunHook, synchronizeFile } from "./hooks";
import { JiraFieldRepository } from "./repository/jira/fields/jiraFieldRepository";
import { JiraIssueFetcher } from "./repository/jira/fields/jiraIssueFetcher";
import { JiraRepository } from "./repository/jira/jiraRepository";
import { ClientCombination, InternalOptions } from "./types/plugin";
import { dedent } from "./util/dedent";

// Enable promise assertions.
chai.use(chaiAsPromised);

describe("the hooks", () => {
    let options: InternalOptions;
    let clients: ClientCombination;

    beforeEach(() => {
        options = {
            jira: initJiraOptions(
                {},
                {
                    projectKey: "CYP",
                    url: "https://example.org",
                }
            ),
            xray: initXrayOptions(
                {},
                {
                    uploadResults: true,
                }
            ),
            plugin: initPluginOptions({}, {}),
            openSSL: initOpenSSLOptions({}, {}),
        };
        const jiraClient = new JiraClientServer("https://example.org", new PATCredentials("token"));
        const xrayClient = new XrayClientServer("https://example.org", new PATCredentials("token"));
        const jiraFieldRepository = new JiraFieldRepository(jiraClient, options.jira);
        const jiraFieldFetcher = new JiraIssueFetcher(
            jiraClient,
            jiraFieldRepository,
            options.jira.fields
        );
        clients = {
            kind: "server",
            jiraClient: jiraClient,
            xrayClient: xrayClient,
            jiraRepository: new JiraRepository(jiraFieldRepository, jiraFieldFetcher, options.jira),
        };
    });

    describe("beforeRun", () => {
        let beforeRunDetails: Required<Cypress.BeforeRunDetails>;
        let config: Cypress.PluginConfigOptions;

        beforeEach(() => {
            beforeRunDetails = JSON.parse(readFileSync("./test/resources/beforeRun.json", "utf-8"));
            config = JSON.parse(readFileSync("./test/resources/cypress.config.json", "utf-8"));
            config.env["jsonEnabled"] = true;
            config.env["jsonOutput"] = "logs";
        });

        it("should fetch xray issue type information to prepare for cucumber results upload", async () => {
            const { stubbedInfo } = stubLogging();
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            );
            options.jira.testPlanIssueKey = "CYP-456";
            options.cucumber = await initCucumberOptions(
                {
                    testingType: "e2e",
                    projectRoot: "",
                    reporter: "",
                    specPattern: "",
                    excludeSpecPattern: "",
                    env: { jsonEnabled: true, jsonOutput: "somewhere" },
                },
                {
                    featureFileExtension: ".feature",
                }
            );
            stub(clients.jiraClient, "getIssueTypes").resolves([
                {
                    name: "Test Execution",
                    id: "12345",
                    subtask: false,
                },
            ]);
            await beforeRunHook(beforeRunDetails.specs, options, clients);
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
            await beforeRunHook(beforeRunDetails.specs, options, clients);
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
            options.cucumber = await initCucumberOptions(
                {
                    testingType: "e2e",
                    projectRoot: "",
                    reporter: "",
                    specPattern: "",
                    excludeSpecPattern: "",
                    env: { jsonEnabled: true, jsonOutput: "anywhere" },
                },
                { featureFileExtension: ".feature" }
            );
            await expect(
                beforeRunHook(beforeRunDetails.specs, options, clients)
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
            options.cucumber = await initCucumberOptions(
                {
                    testingType: "e2e",
                    projectRoot: "",
                    reporter: "",
                    specPattern: "",
                    excludeSpecPattern: "",
                    env: { jsonEnabled: true, jsonOutput: "anywhere" },
                },
                { featureFileExtension: ".feature" }
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
                beforeRunHook(beforeRunDetails.specs, options, clients)
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
            options.cucumber = await initCucumberOptions(
                {
                    testingType: "e2e",
                    projectRoot: "",
                    reporter: "",
                    specPattern: "",
                    excludeSpecPattern: "",
                    env: { jsonEnabled: true, jsonOutput: "anywhere" },
                },
                { featureFileExtension: ".feature" }
            );
            await expect(
                beforeRunHook(beforeRunDetails.specs, options, clients)
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

    describe("the synchronize file hook", () => {
        // Weird workaround.
        const emitter = {} as Cypress.FileObject;
        const file: Cypress.FileObject = {
            ...emitter,
            filePath: "./test/resources/features/taggedCloud.feature",
            outputPath: "",
            shouldWatch: false,
        };

        it("should display errors for invalid feature files", async () => {
            file.filePath = "./test/resources/features/invalid.feature";
            const { stubbedInfo, stubbedError } = stubLogging();
            options.cucumber = {
                featureFileExtension: ".feature",
                downloadFeatures: false,
                uploadFeatures: true,
            };
            await synchronizeFile(file, ".", options, clients);
            expect(stubbedError).to.have.been.calledOnce;
            expect(stubbedError).to.have.been.calledWith(
                dedent(`
                    Feature file invalid, skipping synchronization: ./test/resources/features/invalid.feature

                    Parser errors:
                    (9:3): expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got 'Invalid: Element'
                `)
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
            await synchronizeFile(file, ".", options, clients);
            expect(stubbedError).to.not.have.been.called;
        });
    });
});
