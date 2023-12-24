import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { readFileSync } from "fs";
import { stub } from "sinon";
import { getMockedLogger } from "../../test/mocks";
import { PATCredentials } from "../authentication/credentials";
import { JiraClientServer } from "../client/jira/jiraClientServer";
import { XrayClientServer } from "../client/xray/xrayClientServer";
import {
    initCucumberOptions,
    initJiraOptions,
    initOpenSSLOptions,
    initPluginOptions,
    initXrayOptions,
} from "../context";
import { Level } from "../logging/logging";
import { CachingJiraFieldRepository } from "../repository/jira/fields/jiraFieldRepository";
import { JiraIssueFetcher } from "../repository/jira/fields/jiraIssueFetcher";
import { CachingJiraRepository } from "../repository/jira/jiraRepository";
import { ClientCombination, InternalOptions } from "../types/plugin";
import { dedent } from "../util/dedent";
import { beforeRunHook } from "./hooks";

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
        const jiraFieldRepository = new CachingJiraFieldRepository(jiraClient);
        const jiraFieldFetcher = new JiraIssueFetcher(
            jiraClient,
            jiraFieldRepository,
            options.jira.fields
        );
        clients = {
            kind: "server",
            jiraClient: jiraClient,
            xrayClient: xrayClient,
            jiraRepository: new CachingJiraRepository(jiraFieldRepository, jiraFieldFetcher),
        };
    });

    describe("beforeRun", () => {
        let beforeRunDetails: Required<Cypress.BeforeRunDetails>;
        let config: Cypress.PluginConfigOptions;

        beforeEach(() => {
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRun.json", "utf-8")
            ) as Required<Cypress.BeforeRunDetails>;
            config = JSON.parse(
                readFileSync("./test/resources/cypress.config.json", "utf-8")
            ) as Cypress.PluginConfigOptions;
            config.env.jsonEnabled = true;
            config.env.jsonOutput = "logs";
        });

        it("should fetch xray issue type information to prepare for cucumber results upload", async () => {
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            ) as Required<Cypress.BeforeRunDetails>;
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
            expect(options.jira.testExecutionIssueDetails).to.deep.eq({
                name: "Test Execution",
                id: "12345",
                subtask: false,
            });
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Fetching necessary Jira issue type information in preparation for Cucumber result uploads..."
            );
        });

        it("should not fetch xray issue type information for native results upload", async () => {
            const logger = getMockedLogger();
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRun.json", "utf-8")
            ) as Required<Cypress.BeforeRunDetails>;
            await beforeRunHook(beforeRunDetails.specs, options, clients);
            expect(logger.message).to.not.have.been.called;
        });

        it("should throw if xray test execution issue type information can not be fetched", async () => {
            getMockedLogger({ allowUnstubbedCalls: true });
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            ) as Required<Cypress.BeforeRunDetails>;
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
            getMockedLogger({ allowUnstubbedCalls: true });
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            ) as Required<Cypress.BeforeRunDetails>;
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
            getMockedLogger({ allowUnstubbedCalls: true });
            beforeRunDetails = JSON.parse(
                readFileSync("./test/resources/beforeRunMixed.json", "utf-8")
            ) as Required<Cypress.BeforeRunDetails>;
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
});
