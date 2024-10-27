import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { readFileSync } from "fs";
import path from "path";
import { useFakeTimers } from "sinon";
import { getMockedJiraClient, getMockedLogger, getMockedXrayClient } from "../../../test/mocks";
import { assertIsInstanceOf } from "../../../test/util";
import {
    SimpleEvidenceCollection,
    initCucumberOptions,
    initJiraOptions,
    initPluginOptions,
    initXrayOptions,
} from "../../context";
import { CypressRunResultType } from "../../types/cypress/cypress";
import {
    ClientCombination,
    InternalCucumberOptions,
    InternalCypressXrayPluginOptions,
} from "../../types/plugin";
import {
    CucumberMultipart,
    CucumberMultipartFeature,
} from "../../types/xray/requests/import-execution-cucumber-multipart";
import { ExecutableGraph } from "../../util/graph/executable-graph";
import { Level } from "../../util/logging";
import { Command, ComputableState } from "../command";
import { ConstantCommand } from "../util/commands/constant-command";
import { DestructureCommand } from "../util/commands/destructure-command";
import { FallbackCommand } from "../util/commands/fallback-command";
import { AttachFilesCommand } from "../util/commands/jira/attach-files-command";
import { ExtractFieldIdCommand, JiraField } from "../util/commands/jira/extract-field-id-command";
import { FetchAllFieldsCommand } from "../util/commands/jira/fetch-all-fields-command";
import { GetSummaryValuesCommand } from "../util/commands/jira/get-summary-values-command";
import { TransitionIssueCommand } from "../util/commands/jira/transition-issue-command";
import { ImportExecutionCucumberCommand } from "../util/commands/xray/import-execution-cucumber-command";
import { ImportExecutionCypressCommand } from "../util/commands/xray/import-execution-cypress-command";
import { ImportFeatureCommand } from "../util/commands/xray/import-feature-command";
import { addUploadCommands } from "./after-run";
import {
    ConvertInfoCloudCommand,
    ConvertInfoServerCommand,
} from "./commands/conversion/convert-info-command";
import { AssertCucumberConversionValidCommand } from "./commands/conversion/cucumber/assert-cucumber-conversion-valid-command";
import { CombineCucumberMultipartCommand } from "./commands/conversion/cucumber/combine-cucumber-multipart-command";
import { ConvertCucumberFeaturesCommand } from "./commands/conversion/cucumber/convert-cucumber-features-command";
import { AssertCypressConversionValidCommand } from "./commands/conversion/cypress/assert-cypress-conversion-valid-command";
import { CombineCypressJsonCommand } from "./commands/conversion/cypress/combine-cypress-xray-command";
import { ConvertCypressTestsCommand } from "./commands/conversion/cypress/convert-cypress-tests-command";
import { ExtractVideoFilesCommand } from "./commands/extract-video-files-command";
import { VerifyExecutionIssueKeyCommand } from "./commands/verify-execution-issue-key-command";
import { VerifyResultsUploadCommand } from "./commands/verify-results-upload-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    let clients: ClientCombination;
    let options: InternalCypressXrayPluginOptions;
    beforeEach(async () => {
        options = {
            cucumber: await initCucumberOptions(
                {
                    env: { jsonEnabled: true },
                    excludeSpecPattern: "",
                    projectRoot: "",
                    reporter: "",
                    specPattern: "",
                    testingType: "component",
                },
                {
                    featureFileExtension: ".feature",
                    prefixes: {
                        precondition: "Precondition:",
                        test: "TestName:",
                    },
                    uploadFeatures: true,
                }
            ),
            http: {},
            jira: initJiraOptions(
                {},
                {
                    projectKey: "CYP",
                    url: "https://example.org",
                }
            ),
            plugin: initPluginOptions({}, {}),
            xray: initXrayOptions({}, {}),
        };
        clients = {
            jiraClient: getMockedJiraClient(),
            kind: "server",
            xrayClient: getMockedXrayClient(),
        };
    });

    describe(addUploadCommands.name, () => {
        describe("cypress", () => {
            let result: CypressRunResultType;

            beforeEach(() => {
                result = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                ) as CypressRunResultType;
            });

            it("adds commands necessary for cypress results upload", async () => {
                const graph = new ExecutableGraph<Command>();
                await addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    getMockedLogger()
                );
                // Vertices.
                const [
                    resultsCommand,
                    convertCypressTestsCommand,
                    issueSummaryCommand,
                    issuetypeCommand,
                    convertCommand,
                    combineCypressJsonCommand,
                    assertCypressConversionValidCommand,
                    importExecutionCypressCommand,
                    fallbackCypressUploadCommand,
                    verifyResultsUploadCommand,
                ] = [...graph.getVertices()];
                assertIsInstanceOf(resultsCommand, ConstantCommand);
                assertIsInstanceOf(convertCypressTestsCommand, ConvertCypressTestsCommand);
                assertIsInstanceOf(issueSummaryCommand, ConstantCommand);
                assertIsInstanceOf(issuetypeCommand, ConstantCommand);
                assertIsInstanceOf(convertCommand, ConvertInfoServerCommand);
                assertIsInstanceOf(combineCypressJsonCommand, CombineCypressJsonCommand);
                assertIsInstanceOf(
                    assertCypressConversionValidCommand,
                    AssertCypressConversionValidCommand
                );
                assertIsInstanceOf(importExecutionCypressCommand, ImportExecutionCypressCommand);
                assertIsInstanceOf(fallbackCypressUploadCommand, FallbackCommand);
                assertIsInstanceOf(verifyResultsUploadCommand, VerifyResultsUploadCommand);
                // Vertex data.
                expect(resultsCommand.getValue()).to.deep.eq(result);
                expect(convertCypressTestsCommand.getParameters()).to.deep.eq({
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: ".feature",
                    normalizeScreenshotNames: false,
                    projectKey: "CYP",
                    uploadScreenshots: true,
                    useCloudStatusFallback: false,
                    xrayStatus: {
                        failed: undefined,
                        passed: undefined,
                        pending: undefined,
                        skipped: undefined,
                        step: {
                            failed: undefined,
                            passed: undefined,
                            pending: undefined,
                            skipped: undefined,
                        },
                    },
                });
                expect(convertCommand.getParameters()).to.deep.eq({
                    jira: options.jira,
                    xray: options.xray,
                });
                expect(issueSummaryCommand.getValue()).to.deep.eq(
                    "Execution Results [2022-11-28T17:41:12.234Z]"
                );
                expect(issuetypeCommand.getValue()).to.deep.eq({ name: "Test Execution" });
                expect(combineCypressJsonCommand.getParameters()).to.deep.eq({
                    testExecutionIssueKey: undefined,
                });
                expect(importExecutionCypressCommand.getParameters()).to.deep.eq({
                    xrayClient: clients.xrayClient,
                });
                expect(fallbackCypressUploadCommand.getParameters()).to.deep.eq({
                    fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
                    fallbackValue: undefined,
                });
                expect(verifyResultsUploadCommand.getParameters()).to.deep.eq({
                    url: "https://example.org",
                });
                // Edges.
                expect([...graph.getSuccessors(resultsCommand)]).to.deep.eq([
                    convertCypressTestsCommand,
                    convertCommand,
                ]);
                expect([...graph.getSuccessors(convertCypressTestsCommand)]).to.deep.eq([
                    combineCypressJsonCommand,
                ]);
                expect([...graph.getSuccessors(issueSummaryCommand)]).to.deep.eq([convertCommand]);
                expect([...graph.getSuccessors(convertCommand)]).to.deep.eq([
                    combineCypressJsonCommand,
                ]);
                expect([...graph.getSuccessors(combineCypressJsonCommand)]).to.deep.eq([
                    assertCypressConversionValidCommand,
                    importExecutionCypressCommand,
                ]);
                expect([...graph.getSuccessors(assertCypressConversionValidCommand)]).to.deep.eq([
                    importExecutionCypressCommand,
                ]);
                expect([...graph.getSuccessors(importExecutionCypressCommand)]).to.deep.eq([
                    fallbackCypressUploadCommand,
                ]);
                expect([...graph.getSuccessors(fallbackCypressUploadCommand)]).to.deep.eq([
                    verifyResultsUploadCommand,
                ]);
                expect(graph.size("vertices")).to.eq(10);
                expect(graph.size("edges")).to.eq(11);
            });

            it("uses configured test execution issue keys", async () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.testExecutionIssueKey = "CYP-415";
                options.jira.testExecutionIssueType = "Test Run";
                await addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    getMockedLogger()
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const issueKeysCommand = commands[2];
                const getSummaryValuesCommand = commands[3];
                const destructureCommand = commands[4];
                const convertCommand = commands[6];
                const importCypressExecutionCommand = commands[9];
                const verifyExecutionIssueKeyCommand = commands[10];
                const fallbackCypressUploadCommand = commands[11];
                assertIsInstanceOf(issueKeysCommand, ConstantCommand);
                assertIsInstanceOf(getSummaryValuesCommand, GetSummaryValuesCommand);
                assertIsInstanceOf(destructureCommand, DestructureCommand);
                assertIsInstanceOf(importCypressExecutionCommand, ImportExecutionCypressCommand);
                assertIsInstanceOf(verifyExecutionIssueKeyCommand, VerifyExecutionIssueKeyCommand);
                assertIsInstanceOf(fallbackCypressUploadCommand, FallbackCommand);
                // Vertex data.
                expect(issueKeysCommand.getValue()).to.deep.eq([
                    options.jira.testExecutionIssueKey,
                ]);
                expect(getSummaryValuesCommand.getParameters()).to.deep.eq({
                    jiraClient: clients.jiraClient,
                });
                expect(destructureCommand.getParameters()).to.deep.eq({
                    accessor: options.jira.testExecutionIssueKey,
                });
                expect(verifyExecutionIssueKeyCommand.getParameters()).to.deep.eq({
                    displayCloudHelp: false,
                    importType: "cypress",
                    testExecutionIssueKey: "CYP-415",
                    testExecutionIssueType: { name: "Test Run" },
                });
                // Edges.
                expect([...graph.getSuccessors(issueKeysCommand)]).to.deep.eq([
                    getSummaryValuesCommand,
                ]);
                expect([...graph.getSuccessors(getSummaryValuesCommand)]).to.deep.eq([
                    destructureCommand,
                ]);
                expect([...graph.getSuccessors(destructureCommand)]).to.deep.eq([convertCommand]);
                expect([...graph.getSuccessors(importCypressExecutionCommand)]).to.deep.eq([
                    verifyExecutionIssueKeyCommand,
                    fallbackCypressUploadCommand,
                ]);
                expect(graph.size("vertices")).to.eq(13);
                expect(graph.size("edges")).to.eq(14);
            });

            it("uses configured test execution issue data with known fields", async () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.testExecutionIssueKey = "CYP-415";
                options.jira.testExecutionIssueType = "Test Run";
                await addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    getMockedLogger()
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const issueKeysCommand = commands[2];
                const getSummaryValuesCommand = commands[3];
                assertIsInstanceOf(issueKeysCommand, ConstantCommand);
                assertIsInstanceOf(getSummaryValuesCommand, GetSummaryValuesCommand);
                // Vertex data.
                expect(issueKeysCommand.getValue()).to.deep.eq([
                    options.jira.testExecutionIssueKey,
                ]);
                expect(getSummaryValuesCommand.getParameters()).to.deep.eq({
                    jiraClient: clients.jiraClient,
                });
                // Edges.
                expect([...graph.getSuccessors(issueKeysCommand)]).to.deep.eq([
                    getSummaryValuesCommand,
                ]);
                expect(graph.size("vertices")).to.eq(13);
                expect(graph.size("edges")).to.eq(14);
            });

            it("uses configured summaries", async () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.testExecutionIssueSummary = "My summary";
                await addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    getMockedLogger()
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const executionIssueSummaryCommand = commands[2];
                const convertCommand = commands[4];
                assertIsInstanceOf(executionIssueSummaryCommand, ConstantCommand);
                assertIsInstanceOf(convertCommand, ConvertInfoServerCommand);
                // Vertex data.
                expect(executionIssueSummaryCommand.getValue()).to.deep.eq("My summary");
                // Edges.
                expect([...graph.getSuccessors(executionIssueSummaryCommand)]).to.deep.eq([
                    convertCommand,
                ]);
                expect(graph.size("vertices")).to.eq(10);
                expect(graph.size("edges")).to.eq(11);
            });

            it("uses configured custom issue data", async () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.testExecutionIssue = {
                    fields: {
                        assignee: "someone else",
                        ["customfield_12345"]: "bonjour",
                    },
                };
                await addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    getMockedLogger()
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const issueUpdateCommand = commands[2];
                assertIsInstanceOf(issueUpdateCommand, ConstantCommand);
                // Vertex data.
                expect(issueUpdateCommand.getValue()).to.deep.eq({
                    fields: {
                        assignee: "someone else",
                        ["customfield_12345"]: "bonjour",
                    },
                });
                expect(graph.size("vertices")).to.eq(11);
                expect(graph.size("edges")).to.eq(12);
            });

            it("attaches videos", async () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.attachVideos = true;
                await addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    getMockedLogger()
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const resultsCommand = commands[0];
                const verifyResultsUploadCommand = commands[9];
                const extractVideoFilesCommand = commands[10];
                const attachVideosCommand = commands[11];
                assertIsInstanceOf(extractVideoFilesCommand, ExtractVideoFilesCommand);
                assertIsInstanceOf(attachVideosCommand, AttachFilesCommand);
                // Vertex data.
                expect(attachVideosCommand.getParameters()).to.deep.eq({
                    jiraClient: clients.jiraClient,
                });
                // Edges.
                expect([...graph.getSuccessors(resultsCommand)]).to.contain(
                    extractVideoFilesCommand
                );
                expect([...graph.getSuccessors(extractVideoFilesCommand)]).to.deep.eq([
                    attachVideosCommand,
                ]);
                expect([...graph.getSuccessors(verifyResultsUploadCommand)]).to.contain(
                    attachVideosCommand
                );
                expect(graph.size("vertices")).to.eq(12);
                expect(graph.size("edges")).to.eq(14);
            });

            it("explicitly transitions issues in server environments", async () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.testExecutionIssue = {
                    transition: {
                        id: "6",
                    },
                };
                clients.kind = "server";
                await addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    getMockedLogger()
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const verifyResultsUploadCommand = commands[10];
                const transitionIssueCommand = commands[11];
                assertIsInstanceOf(transitionIssueCommand, TransitionIssueCommand);
                // Vertex data.
                expect(transitionIssueCommand.getParameters()).to.deep.eq({
                    jiraClient: clients.jiraClient,
                    transition: {
                        id: "6",
                    },
                });
                // Edges.
                expect([...graph.getSuccessors(verifyResultsUploadCommand)]).to.contain(
                    transitionIssueCommand
                );
                expect(graph.size("vertices")).to.eq(12);
                expect(graph.size("edges")).to.eq(13);
            });

            it("does not explicitly transition issues in cloud environments", async () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.testExecutionIssue = {
                    transition: {
                        id: "6",
                    },
                };
                clients.kind = "cloud";
                await addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    getMockedLogger()
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const verifyResultsUploadCommand = commands[10];
                assertIsInstanceOf(verifyResultsUploadCommand, VerifyResultsUploadCommand);
                // Edges.
                expect([...graph.getSuccessors(verifyResultsUploadCommand)]).to.deep.eq([]);
                expect(graph.size("vertices")).to.eq(11);
                expect(graph.size("edges")).to.eq(12);
            });
        });

        describe("cucumber", () => {
            let cypressResult: CypressRunResultType;
            let cucumberResult: CucumberMultipartFeature[];

            beforeEach(() => {
                cypressResult = JSON.parse(
                    readFileSync("./test/resources/runResultCucumber.json", "utf-8")
                ) as CypressRunResultType;
                options.cucumber = {
                    downloadFeatures: false,
                    featureFileExtension: ".feature",
                    prefixes: {},
                    preprocessor: {
                        json: {
                            enabled: true,
                            output: "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                        },
                    },
                    uploadFeatures: false,
                };
                cucumberResult = JSON.parse(
                    readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                        "utf-8"
                    )
                ) as CucumberMultipartFeature[];
            });

            describe("server", () => {
                it("adds commands necessary for cucumber results upload", async () => {
                    useFakeTimers(new Date(12345));
                    const graph = new ExecutableGraph<Command>();
                    await addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    const [
                        cypressResultsCommand,
                        issueSummaryCommand,
                        issuetypeCommand,
                        convertMultipartInfoCommand,
                        cucumberResultsCommand,
                        convertCucumberFeaturesCommand,
                        combineCucumberMultipartCommand,
                        assertConversionValidCommand,
                        importCucumberExecutionCommand,
                        fallbackCucumberUploadCommand,
                        verifyResultsUploadCommand,
                    ] = [...graph.getVertices()];
                    assertIsInstanceOf(cypressResultsCommand, ConstantCommand);
                    assertIsInstanceOf(cucumberResultsCommand, ConstantCommand);
                    assertIsInstanceOf(issueSummaryCommand, ConstantCommand);
                    assertIsInstanceOf(issuetypeCommand, ConstantCommand);
                    assertIsInstanceOf(convertMultipartInfoCommand, ConvertInfoServerCommand);
                    assertIsInstanceOf(
                        convertCucumberFeaturesCommand,
                        ConvertCucumberFeaturesCommand
                    );
                    assertIsInstanceOf(
                        combineCucumberMultipartCommand,
                        CombineCucumberMultipartCommand
                    );
                    assertIsInstanceOf(
                        assertConversionValidCommand,
                        AssertCucumberConversionValidCommand
                    );
                    assertIsInstanceOf(
                        importCucumberExecutionCommand,
                        ImportExecutionCucumberCommand
                    );
                    assertIsInstanceOf(fallbackCucumberUploadCommand, FallbackCommand);
                    assertIsInstanceOf(verifyResultsUploadCommand, VerifyResultsUploadCommand);
                    // Vertex data.
                    expect(cypressResultsCommand.getValue()).to.deep.eq(cypressResult);
                    expect(cucumberResultsCommand.getValue()).to.deep.eq(cucumberResult);
                    expect(issueSummaryCommand.getValue()).to.deep.eq(
                        "Execution Results [2023-07-23T21:26:15.539Z]"
                    );
                    expect(issuetypeCommand.getValue()).to.deep.eq({
                        name: "Test Execution",
                    });
                    expect(convertMultipartInfoCommand.getParameters()).to.deep.eq({
                        jira: options.jira,
                        xray: options.xray,
                    });
                    expect(convertCucumberFeaturesCommand.getParameters()).to.deep.eq({
                        cucumber: {
                            prefixes: {
                                precondition: undefined,
                                test: undefined,
                            },
                        },
                        jira: {
                            projectKey: "CYP",
                        },
                        projectRoot: ".",
                        useCloudTags: false,
                        xray: {
                            status: {
                                failed: undefined,
                                passed: undefined,
                                pending: undefined,
                                skipped: undefined,
                                step: {
                                    failed: undefined,
                                    passed: undefined,
                                    pending: undefined,
                                    skipped: undefined,
                                },
                            },
                            testEnvironments: undefined,
                            uploadScreenshots: true,
                        },
                    });
                    expect(importCucumberExecutionCommand.getParameters()).to.deep.eq({
                        xrayClient: clients.xrayClient,
                    });
                    expect(fallbackCucumberUploadCommand.getParameters()).to.deep.eq({
                        fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
                        fallbackValue: undefined,
                    });
                    // Edges.
                    expect([...graph.getSuccessors(cypressResultsCommand)]).to.contain(
                        convertMultipartInfoCommand
                    );
                    expect([...graph.getSuccessors(cucumberResultsCommand)]).to.deep.eq([
                        convertCucumberFeaturesCommand,
                    ]);
                    expect([...graph.getSuccessors(issueSummaryCommand)]).to.deep.eq([
                        convertMultipartInfoCommand,
                    ]);
                    expect([...graph.getSuccessors(issuetypeCommand)]).to.deep.eq([
                        convertMultipartInfoCommand,
                    ]);
                    expect([...graph.getSuccessors(convertMultipartInfoCommand)]).to.deep.eq([
                        combineCucumberMultipartCommand,
                    ]);
                    expect([...graph.getSuccessors(convertCucumberFeaturesCommand)]).to.deep.eq([
                        combineCucumberMultipartCommand,
                    ]);
                    expect([...graph.getSuccessors(combineCucumberMultipartCommand)]).to.deep.eq([
                        assertConversionValidCommand,
                        importCucumberExecutionCommand,
                    ]);
                    expect([...graph.getSuccessors(assertConversionValidCommand)]).to.deep.eq([
                        importCucumberExecutionCommand,
                    ]);
                    expect([...graph.getSuccessors(importCucumberExecutionCommand)]).to.deep.eq([
                        fallbackCucumberUploadCommand,
                    ]);
                    expect([...graph.getSuccessors(fallbackCucumberUploadCommand)]).to.deep.eq([
                        verifyResultsUploadCommand,
                    ]);
                    expect(graph.size("vertices")).to.eq(11);
                    expect(graph.size("edges")).to.eq(11);
                });

                it("uses configured test plan data", async () => {
                    options.jira.testPlanIssueKey = "CYP-42";
                    const graph = new ExecutableGraph<Command>();
                    await addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    const commands = [...graph.getVertices()];
                    const fetchAllFieldsCommand = commands[0];
                    const testPlanIdCommand = commands[1];
                    const convertCommand = commands[5];
                    assertIsInstanceOf(fetchAllFieldsCommand, FetchAllFieldsCommand);
                    assertIsInstanceOf(testPlanIdCommand, ExtractFieldIdCommand);
                    // Vertex data.
                    expect(fetchAllFieldsCommand.getParameters()).to.deep.eq({
                        jiraClient: clients.jiraClient,
                    });
                    expect(testPlanIdCommand.getParameters()).to.deep.eq({
                        field: JiraField.TEST_PLAN,
                    });
                    // Edges.
                    expect([...graph.getSuccessors(fetchAllFieldsCommand)]).to.deep.eq([
                        testPlanIdCommand,
                    ]);
                    expect([...graph.getSuccessors(testPlanIdCommand)]).to.deep.eq([
                        convertCommand,
                    ]);
                    expect(graph.size("vertices")).to.eq(13);
                    expect(graph.size("edges")).to.eq(13);
                });

                it("uses configured test plan data with hardcoded test plan ids", async () => {
                    options.jira.testPlanIssueKey = "CYP-42";
                    options.jira.fields.testPlan = "customfield_12345";
                    const graph = new ExecutableGraph<Command>();
                    await addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    const commands = [...graph.getVertices()];
                    const testPlanIdCommand = commands[0];
                    const convertCommand = commands[4];
                    assertIsInstanceOf(testPlanIdCommand, ConstantCommand);
                    // Vertex data.
                    expect(testPlanIdCommand.getValue()).to.eq("customfield_12345");
                    // Edges.
                    expect([...graph.getSuccessors(testPlanIdCommand)]).to.deep.eq([
                        convertCommand,
                    ]);
                    expect(graph.size("vertices")).to.eq(12);
                    expect(graph.size("edges")).to.eq(12);
                });

                it("uses configured test environment data", async () => {
                    options.xray.testEnvironments = ["DEV"];
                    const graph = new ExecutableGraph<Command>();
                    await addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    const commands = [...graph.getVertices()];
                    const fetchAllFieldsCommand = commands[0];
                    const testEnvironmentsIdCommand = commands[1];
                    const convertCommand = commands[5];
                    assertIsInstanceOf(fetchAllFieldsCommand, FetchAllFieldsCommand);
                    assertIsInstanceOf(testEnvironmentsIdCommand, ExtractFieldIdCommand);
                    // Vertex data.
                    expect(fetchAllFieldsCommand.getParameters()).to.deep.eq({
                        jiraClient: clients.jiraClient,
                    });
                    expect(testEnvironmentsIdCommand.getParameters()).to.deep.eq({
                        field: JiraField.TEST_ENVIRONMENTS,
                    });
                    // Edges.
                    expect([...graph.getSuccessors(fetchAllFieldsCommand)]).to.deep.eq([
                        testEnvironmentsIdCommand,
                    ]);
                    expect([...graph.getSuccessors(testEnvironmentsIdCommand)]).to.deep.eq([
                        convertCommand,
                    ]);
                    expect(graph.size("vertices")).to.eq(13);
                    expect(graph.size("edges")).to.eq(13);
                });

                it("uses configured test environment data with hardcoded test environment ids", async () => {
                    options.xray.testEnvironments = ["DEV"];
                    options.jira.fields.testEnvironments = "customfield_67890";
                    const graph = new ExecutableGraph<Command>();
                    await addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    const commands = [...graph.getVertices()];
                    const testEnvironmentsIdCommand = commands[0];
                    const convertCommand = commands[4];
                    assertIsInstanceOf(testEnvironmentsIdCommand, ConstantCommand);
                    // Vertex data.
                    expect(testEnvironmentsIdCommand.getValue()).to.eq("customfield_67890");
                    // Edges.
                    expect([...graph.getSuccessors(testEnvironmentsIdCommand)]).to.deep.eq([
                        convertCommand,
                    ]);
                    expect(graph.size("vertices")).to.eq(12);
                    expect(graph.size("edges")).to.eq(12);
                });

                it("uses configured test plan and environment data", async () => {
                    options.jira.testPlanIssueKey = "CYP-42";
                    options.xray.testEnvironments = ["DEV"];
                    const graph = new ExecutableGraph<Command>();
                    await addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    const commands = [...graph.getVertices()];
                    const fetchAllFieldsCommand = commands[0];
                    const testPlanIdCommand = commands[1];
                    const testEnvironmentsIdCommand = commands[2];
                    const convertCommand = commands[6];
                    assertIsInstanceOf(fetchAllFieldsCommand, FetchAllFieldsCommand);
                    assertIsInstanceOf(testPlanIdCommand, ExtractFieldIdCommand);
                    assertIsInstanceOf(testEnvironmentsIdCommand, ExtractFieldIdCommand);
                    // Edges.
                    expect([...graph.getSuccessors(fetchAllFieldsCommand)]).to.deep.eq([
                        testPlanIdCommand,
                        testEnvironmentsIdCommand,
                    ]);
                    expect([...graph.getSuccessors(testPlanIdCommand)]).to.deep.eq([
                        convertCommand,
                    ]);
                    expect([...graph.getSuccessors(testEnvironmentsIdCommand)]).to.deep.eq([
                        convertCommand,
                    ]);
                    expect(graph.size("vertices")).to.eq(14);
                    expect(graph.size("edges")).to.eq(15);
                });

                it("uses configured test plan and environment data with hardcoded ids", async () => {
                    options.jira.testPlanIssueKey = "CYP-42";
                    options.jira.fields.testPlan = "customfield_12345";
                    options.xray.testEnvironments = ["DEV"];
                    options.jira.fields.testEnvironments = "customfield_67890";
                    const graph = new ExecutableGraph<Command>();
                    await addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    const commands = [...graph.getVertices()];
                    const testPlanIdCommand = commands[0];
                    const testEnvironmentsIdCommand = commands[1];
                    const convertCommand = commands[5];
                    assertIsInstanceOf(testPlanIdCommand, ConstantCommand);
                    assertIsInstanceOf(testEnvironmentsIdCommand, ConstantCommand);
                    // Vertex data.
                    expect(testPlanIdCommand.getValue()).to.eq("customfield_12345");
                    expect(testEnvironmentsIdCommand.getValue()).to.eq("customfield_67890");
                    // Edges.
                    expect([...graph.getSuccessors(testPlanIdCommand)]).to.deep.eq([
                        convertCommand,
                    ]);
                    expect([...graph.getSuccessors(testEnvironmentsIdCommand)]).to.deep.eq([
                        convertCommand,
                    ]);
                    expect(graph.size("vertices")).to.eq(13);
                    expect(graph.size("edges")).to.eq(13);
                });
            });

            describe("cloud", () => {
                beforeEach(() => {
                    clients.kind = "cloud";
                });

                it("adds commands necessary for cucumber results upload", async () => {
                    const graph = new ExecutableGraph<Command>();
                    await addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    const commands = [...graph.getVertices()];
                    const issuetypeCommand = commands[2];
                    const convertCommand = commands[3];
                    const convertCucumberFeaturesCommand = commands[5];
                    assertIsInstanceOf(issuetypeCommand, ConstantCommand);
                    assertIsInstanceOf(convertCommand, ConvertInfoCloudCommand);
                    expect(issuetypeCommand.getValue()).to.deep.eq({
                        name: "Test Execution",
                    });
                    expect(convertCommand.getParameters()).to.deep.eq({
                        jira: options.jira,
                        xray: options.xray,
                    });
                    expect(convertCucumberFeaturesCommand.getParameters()).to.deep.eq({
                        cucumber: {
                            prefixes: {
                                precondition: undefined,
                                test: undefined,
                            },
                        },
                        jira: {
                            projectKey: "CYP",
                        },
                        projectRoot: ".",
                        useCloudTags: true,
                        xray: {
                            status: {
                                failed: undefined,
                                passed: undefined,
                                pending: undefined,
                                skipped: undefined,
                                step: {
                                    failed: undefined,
                                    passed: undefined,
                                    pending: undefined,
                                    skipped: undefined,
                                },
                            },
                            testEnvironments: undefined,
                            uploadScreenshots: true,
                        },
                    });
                    expect(graph.size("vertices")).to.eq(11);
                });

                it("uses configured test execution issue data", async () => {
                    const graph = new ExecutableGraph<Command>();
                    options.jira.testExecutionIssueKey = "CYP-42";
                    options.jira.testExecutionIssueType = "Test Run";
                    await addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    const [
                        cypressResultsCommand,
                        issueKeysCommand,
                        getSummaryValuesCommand,
                        destructureCommand,
                        issuetypeCommand,
                        convertInfoCloudCommand,
                        cucumberResultsCommand,
                        testExecutionIssueKeyCommand,
                        convertCucumberFeaturesCommand,
                        combineCucumberMultipartCommand,
                        assertConversionValidCommand,
                        importCucumberExecutionCommand,
                        verifyExecutionIssueKeyCommand,
                        fallbackCucumberUploadCommand,
                        verifyResultsUploadCommand,
                    ] = [...graph.getVertices()];
                    assertIsInstanceOf(cypressResultsCommand, ConstantCommand);
                    assertIsInstanceOf(cucumberResultsCommand, ConstantCommand);
                    assertIsInstanceOf(testExecutionIssueKeyCommand, ConstantCommand);
                    assertIsInstanceOf(issueKeysCommand, ConstantCommand);
                    assertIsInstanceOf(getSummaryValuesCommand, GetSummaryValuesCommand);
                    assertIsInstanceOf(destructureCommand, DestructureCommand);
                    assertIsInstanceOf(issuetypeCommand, ConstantCommand);
                    assertIsInstanceOf(convertInfoCloudCommand, ConvertInfoCloudCommand);
                    assertIsInstanceOf(
                        convertCucumberFeaturesCommand,
                        ConvertCucumberFeaturesCommand
                    );
                    assertIsInstanceOf(
                        combineCucumberMultipartCommand,
                        CombineCucumberMultipartCommand
                    );
                    assertIsInstanceOf(
                        assertConversionValidCommand,
                        AssertCucumberConversionValidCommand
                    );
                    assertIsInstanceOf(
                        importCucumberExecutionCommand,
                        ImportExecutionCucumberCommand
                    );
                    assertIsInstanceOf(
                        verifyExecutionIssueKeyCommand,
                        VerifyExecutionIssueKeyCommand
                    );
                    assertIsInstanceOf(fallbackCucumberUploadCommand, FallbackCommand);
                    assertIsInstanceOf(verifyResultsUploadCommand, VerifyResultsUploadCommand);
                    // Vertex data.
                    expect(cypressResultsCommand.getValue()).to.deep.eq(cypressResult);
                    expect(cucumberResultsCommand.getValue()).to.deep.eq(cucumberResult);
                    expect(testExecutionIssueKeyCommand.getValue()).to.deep.eq("CYP-42");
                    expect(issuetypeCommand.getValue()).to.deep.eq({
                        name: "Test Run",
                    });
                    expect(issueKeysCommand.getValue()).to.deep.eq(["CYP-42"]);
                    expect(getSummaryValuesCommand.getParameters()).to.deep.eq({
                        jiraClient: clients.jiraClient,
                    });
                    expect(destructureCommand.getParameters()).to.deep.eq({ accessor: "CYP-42" });
                    expect(convertInfoCloudCommand.getParameters()).to.deep.eq({
                        jira: options.jira,
                        xray: options.xray,
                    });
                    expect(convertCucumberFeaturesCommand.getParameters()).to.deep.eq({
                        cucumber: {
                            prefixes: {
                                precondition: undefined,
                                test: undefined,
                            },
                        },
                        jira: {
                            projectKey: "CYP",
                        },
                        projectRoot: ".",
                        useCloudTags: true,
                        xray: {
                            status: {
                                failed: undefined,
                                passed: undefined,
                                pending: undefined,
                                skipped: undefined,
                                step: {
                                    failed: undefined,
                                    passed: undefined,
                                    pending: undefined,
                                    skipped: undefined,
                                },
                            },
                            testEnvironments: undefined,
                            uploadScreenshots: true,
                        },
                    });
                    expect(importCucumberExecutionCommand.getParameters()).to.deep.eq({
                        xrayClient: clients.xrayClient,
                    });
                    expect(verifyExecutionIssueKeyCommand.getParameters()).to.deep.eq({
                        displayCloudHelp: true,
                        importType: "cucumber",
                        testExecutionIssueKey: "CYP-42",
                        testExecutionIssueType: { name: "Test Run" },
                    });
                    // Edges.
                    expect([...graph.getSuccessors(cypressResultsCommand)]).to.contain(
                        convertInfoCloudCommand
                    );
                    expect([...graph.getSuccessors(cucumberResultsCommand)]).to.deep.eq([
                        convertCucumberFeaturesCommand,
                    ]);
                    expect([...graph.getSuccessors(testExecutionIssueKeyCommand)]).to.deep.eq([
                        convertCucumberFeaturesCommand,
                    ]);
                    expect([...graph.getSuccessors(issuetypeCommand)]).to.deep.eq([
                        convertInfoCloudCommand,
                    ]);
                    expect([...graph.getSuccessors(issueKeysCommand)]).to.deep.eq([
                        getSummaryValuesCommand,
                    ]);
                    expect([...graph.getSuccessors(getSummaryValuesCommand)]).to.deep.eq([
                        destructureCommand,
                    ]);
                    expect([...graph.getSuccessors(destructureCommand)]).to.deep.eq([
                        convertInfoCloudCommand,
                    ]);
                    expect([...graph.getSuccessors(convertInfoCloudCommand)]).to.deep.eq([
                        combineCucumberMultipartCommand,
                    ]);
                    expect([...graph.getSuccessors(convertCucumberFeaturesCommand)]).to.deep.eq([
                        combineCucumberMultipartCommand,
                    ]);
                    expect([...graph.getSuccessors(combineCucumberMultipartCommand)]).to.deep.eq([
                        assertConversionValidCommand,
                        importCucumberExecutionCommand,
                    ]);
                    expect([...graph.getSuccessors(assertConversionValidCommand)]).to.deep.eq([
                        importCucumberExecutionCommand,
                    ]);
                    expect([...graph.getSuccessors(importCucumberExecutionCommand)]).to.deep.eq([
                        verifyExecutionIssueKeyCommand,
                        fallbackCucumberUploadCommand,
                    ]);
                    expect([...graph.getSuccessors(fallbackCucumberUploadCommand)]).to.deep.eq([
                        verifyResultsUploadCommand,
                    ]);
                    expect(graph.size("vertices")).to.eq(15);
                    expect(graph.size("edges")).to.eq(15);
                });
            });

            it("throws if the cucumber report was not configured", async () => {
                const graph = new ExecutableGraph<Command>();
                const preprocessorOptions = options.cucumber as InternalCucumberOptions;
                preprocessorOptions.preprocessor = undefined;
                await expect(
                    addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    )
                ).to.eventually.be.rejectedWith(
                    "Failed to prepare Cucumber upload: Cucumber preprocessor JSON report path not configured"
                );
            });

            it("does not add any commands if neither cypress nor cucumber results exist", async () => {
                const logger = getMockedLogger();
                cypressResult.runs = [];
                const graph = new ExecutableGraph<Command>();
                await addUploadCommands(
                    cypressResult,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    logger
                );
                expect(graph.size("vertices")).to.eq(0);
                expect(graph.size("edges")).to.eq(0);
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.WARNING,
                    "No test execution results to upload, skipping results upload preparations."
                );
            });

            it("adds connections from feature file imports to execution uploads", async () => {
                options.cucumber = {
                    downloadFeatures: false,
                    featureFileExtension: ".feature",
                    prefixes: {},
                    preprocessor: {
                        json: {
                            enabled: true,
                            output: "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                        },
                    },
                    uploadFeatures: true,
                };
                const graph = new ExecutableGraph<Command>();
                const logger = getMockedLogger();
                graph.place(
                    new ImportFeatureCommand(
                        {
                            filePath: path.relative(".", "cypress/e2e/outline.cy.feature"),
                            xrayClient: clients.xrayClient,
                        },
                        logger
                    )
                );
                graph.place(
                    new ImportFeatureCommand(
                        {
                            filePath: path.relative(".", "cypress/e2e/spec.cy.feature"),
                            xrayClient: clients.xrayClient,
                        },
                        logger
                    )
                );
                graph.place(
                    new ImportFeatureCommand(
                        {
                            filePath: path.relative(".", "cypress/e2e/nonexistent.cy.feature"),
                            xrayClient: clients.xrayClient,
                        },
                        logger
                    )
                );
                await addUploadCommands(
                    cypressResult,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    logger
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const importFeatureCommand1 = commands[0];
                const importFeatureCommand2 = commands[1];
                const importFeatureCommand3 = commands[2];
                const importCucumberExecutionCommand = commands[11];
                // Edges.
                expect([...graph.getSuccessors(importFeatureCommand1)]).to.contain(
                    importCucumberExecutionCommand
                );
                expect([...graph.getSuccessors(importFeatureCommand2)]).to.deep.eq([
                    importCucumberExecutionCommand,
                ]);
                expect([...graph.getSuccessors(importFeatureCommand3)]).to.be.empty;
                expect(graph.size("vertices")).to.eq(14);
                expect(graph.size("edges")).to.eq(13);
            });
        });

        describe("mixed", () => {
            let cypressResult: CypressRunResultType;
            let cucumberResult: CucumberMultipart;

            beforeEach(() => {
                cypressResult = JSON.parse(
                    readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
                ) as CypressRunResultType;
                cucumberResult = JSON.parse(
                    readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                        "utf-8"
                    )
                ) as CucumberMultipart;
                options.cucumber = {
                    downloadFeatures: false,
                    featureFileExtension: ".feature",
                    prefixes: {},
                    preprocessor: {
                        json: {
                            enabled: true,
                            output: "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                        },
                    },
                    uploadFeatures: false,
                };
            });

            it("adds commands necessary for mixed results upload", async () => {
                useFakeTimers(new Date(12345));
                const graph = new ExecutableGraph<Command>();
                await addUploadCommands(
                    cypressResult,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    getMockedLogger()
                );
                // Vertices.
                const [
                    cypressResultsCommand,
                    convertCypressTestsCommand,
                    issueSummaryCommand,
                    issuetypeCommand,
                    convertInfoServerCommand,
                    combineCypressJsonCommand,
                    assertCypressConversionValidCommand,
                    importExecutionCypressCommand,
                    cucumberResultsCommand,
                    convertCucumberFeaturesCommand,
                    combineCucumberMultipartCommand,
                    assertCucumberConversionValidCommand,
                    importCucumberExecutionCommand,
                    fallbackCypressUploadCommand,
                    fallbackCucumberUploadCommand,
                    verifyResultsUploadCommand,
                ] = [...graph.getVertices()];
                assertIsInstanceOf(cypressResultsCommand, ConstantCommand);
                assertIsInstanceOf(convertCypressTestsCommand, ConvertCypressTestsCommand);
                assertIsInstanceOf(issueSummaryCommand, ConstantCommand);
                assertIsInstanceOf(issuetypeCommand, ConstantCommand);
                assertIsInstanceOf(convertInfoServerCommand, ConvertInfoServerCommand);
                assertIsInstanceOf(combineCypressJsonCommand, CombineCypressJsonCommand);
                assertIsInstanceOf(
                    assertCypressConversionValidCommand,
                    AssertCypressConversionValidCommand
                );
                assertIsInstanceOf(importExecutionCypressCommand, ImportExecutionCypressCommand);
                assertIsInstanceOf(cucumberResultsCommand, ConstantCommand);
                assertIsInstanceOf(fallbackCypressUploadCommand, FallbackCommand);
                assertIsInstanceOf(convertCucumberFeaturesCommand, ConvertCucumberFeaturesCommand);
                assertIsInstanceOf(
                    combineCucumberMultipartCommand,
                    CombineCucumberMultipartCommand
                );
                assertIsInstanceOf(
                    assertCucumberConversionValidCommand,
                    AssertCucumberConversionValidCommand
                );
                assertIsInstanceOf(importCucumberExecutionCommand, ImportExecutionCucumberCommand);
                assertIsInstanceOf(fallbackCucumberUploadCommand, FallbackCommand);
                assertIsInstanceOf(verifyResultsUploadCommand, VerifyResultsUploadCommand);
                // Vertex data.
                expect(cypressResultsCommand.getValue()).to.deep.eq(cypressResult);
                expect(convertCypressTestsCommand.getParameters()).to.deep.eq({
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: ".feature",
                    normalizeScreenshotNames: false,
                    projectKey: "CYP",
                    uploadScreenshots: true,
                    useCloudStatusFallback: false,
                    xrayStatus: {
                        failed: undefined,
                        passed: undefined,
                        pending: undefined,
                        skipped: undefined,
                        step: {
                            failed: undefined,
                            passed: undefined,
                            pending: undefined,
                            skipped: undefined,
                        },
                    },
                });
                expect(issueSummaryCommand.getValue()).to.deep.eq(
                    "Execution Results [2023-07-23T21:26:15.539Z]"
                );
                expect(issuetypeCommand.getValue()).to.deep.eq({
                    name: "Test Execution",
                });
                expect(convertInfoServerCommand.getParameters()).to.deep.eq({
                    jira: options.jira,
                    xray: options.xray,
                });
                expect(combineCypressJsonCommand.getParameters()).to.deep.eq({
                    testExecutionIssueKey: undefined,
                });
                expect(importExecutionCypressCommand.getParameters()).to.deep.eq({
                    xrayClient: clients.xrayClient,
                });
                expect(cucumberResultsCommand.getValue()).to.deep.eq(cucumberResult);
                expect(fallbackCypressUploadCommand.getParameters()).to.deep.eq({
                    fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
                    fallbackValue: undefined,
                });
                expect(convertCucumberFeaturesCommand.getParameters()).to.deep.eq({
                    cucumber: {
                        prefixes: {
                            precondition: undefined,
                            test: undefined,
                        },
                    },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: ".",
                    useCloudTags: false,
                    xray: {
                        status: {
                            failed: undefined,
                            passed: undefined,
                            pending: undefined,
                            skipped: undefined,
                            step: {
                                failed: undefined,
                                passed: undefined,
                                pending: undefined,
                                skipped: undefined,
                            },
                        },
                        testEnvironments: undefined,
                        uploadScreenshots: true,
                    },
                });
                expect(importCucumberExecutionCommand.getParameters()).to.deep.eq({
                    xrayClient: clients.xrayClient,
                });
                expect(fallbackCucumberUploadCommand.getParameters()).to.deep.eq({
                    fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
                    fallbackValue: undefined,
                });
                expect(verifyResultsUploadCommand.getParameters()).to.deep.eq({
                    url: "https://example.org",
                });
                // Edges.
                // Cypress.
                expect([...graph.getSuccessors(cypressResultsCommand)]).to.deep.eq([
                    convertCypressTestsCommand,
                    convertInfoServerCommand,
                ]);
                expect([...graph.getSuccessors(convertCypressTestsCommand)]).to.deep.eq([
                    combineCypressJsonCommand,
                ]);
                expect([...graph.getSuccessors(issueSummaryCommand)]).to.deep.eq([
                    convertInfoServerCommand,
                ]);
                expect([...graph.getSuccessors(issuetypeCommand)]).to.deep.eq([
                    convertInfoServerCommand,
                ]);
                expect([...graph.getSuccessors(convertInfoServerCommand)]).to.deep.eq([
                    combineCypressJsonCommand,
                    combineCucumberMultipartCommand,
                ]);
                expect([...graph.getSuccessors(combineCypressJsonCommand)]).to.deep.eq([
                    assertCypressConversionValidCommand,
                    importExecutionCypressCommand,
                ]);
                expect([...graph.getSuccessors(assertCypressConversionValidCommand)]).to.deep.eq([
                    importExecutionCypressCommand,
                ]);
                expect([...graph.getSuccessors(importExecutionCypressCommand)]).to.deep.eq([
                    convertCucumberFeaturesCommand,
                    fallbackCypressUploadCommand,
                ]);
                // Cucumber.
                expect([...graph.getSuccessors(cucumberResultsCommand)]).to.deep.eq([
                    convertCucumberFeaturesCommand,
                ]);
                expect([...graph.getSuccessors(fallbackCypressUploadCommand)]).to.deep.eq([
                    verifyResultsUploadCommand,
                ]);
                expect([...graph.getSuccessors(convertCucumberFeaturesCommand)]).to.deep.eq([
                    combineCucumberMultipartCommand,
                ]);
                expect([...graph.getSuccessors(combineCucumberMultipartCommand)]).to.deep.eq([
                    assertCucumberConversionValidCommand,
                    importCucumberExecutionCommand,
                ]);
                expect([...graph.getSuccessors(assertCucumberConversionValidCommand)]).to.deep.eq([
                    importCucumberExecutionCommand,
                ]);
                expect([...graph.getSuccessors(importCucumberExecutionCommand)]).to.deep.eq([
                    fallbackCucumberUploadCommand,
                ]);
                expect([...graph.getSuccessors(fallbackCucumberUploadCommand)]).to.deep.eq([
                    verifyResultsUploadCommand,
                ]);
                expect(graph.size("vertices")).to.eq(16);
                expect(graph.size("edges")).to.eq(20);
            });
        });
    });
});
