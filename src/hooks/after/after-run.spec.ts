import { expect } from "chai";
import { readFileSync } from "fs";
import path from "path";
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
import { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import { ExecutableGraph } from "../../util/graph/executable-graph";
import { Level } from "../../util/logging";
import { Command, ComputableState } from "../command";
import { ConstantCommand } from "../util/commands/constant-command";
import { FallbackCommand } from "../util/commands/fallback-command";
import { AttachFilesCommand } from "../util/commands/jira/attach-files-command";
import { ExtractFieldIdCommand, JiraField } from "../util/commands/jira/extract-field-id-command";
import { FetchAllFieldsCommand } from "../util/commands/jira/fetch-all-fields-command";
import { FetchIssueTypesCommand } from "../util/commands/jira/fetch-issue-types-command";
import { ImportExecutionCucumberCommand } from "../util/commands/xray/import-execution-cucumber-command";
import { ImportExecutionCypressCommand } from "../util/commands/xray/import-execution-cypress-command";
import { ImportFeatureCommand } from "../util/commands/xray/import-feature-command";
import { addUploadCommands } from "./after-run";
import {
    ConvertCucumberInfoCloudCommand,
    ConvertCucumberInfoServerCommand,
} from "./commands/conversion/convert-info-command";
import { AssertCucumberConversionValidCommand } from "./commands/conversion/cucumber/assert-cucumber-conversion-valid-command";
import { CombineCucumberMultipartCommand } from "./commands/conversion/cucumber/combine-cucumber-multipart-command";
import { ConvertCucumberFeaturesCommand } from "./commands/conversion/cucumber/convert-cucumber-features-command";
import { AssertCypressConversionValidCommand } from "./commands/conversion/cypress/assert-cypress-conversion-valid-command";
import { CombineCypressJsonCommand } from "./commands/conversion/cypress/combine-cypress-xray-command";
import { ConvertCypressInfoCommand } from "./commands/conversion/cypress/convert-cypress-info-command";
import { ConvertCypressTestsCommand } from "./commands/conversion/cypress/convert-cypress-tests-command";
import { ExtractExecutionIssueTypeCommand } from "./commands/extract-execution-issue-type-command";
import { ExtractVideoFilesCommand } from "./commands/extract-video-files-command";
import { VerifyExecutionIssueKeyCommand } from "./commands/verify-execution-issue-key-command";
import { VerifyResultsUploadCommand } from "./commands/verify-results-upload-command";

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

            it("adds commands necessary for cypress results upload", () => {
                const graph = new ExecutableGraph<Command>();
                addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    getMockedLogger()
                );
                // Vertices.
                expect(graph.size("vertices")).to.eq(8);
                const [
                    resultsCommand,
                    convertCypressTestsCommand,
                    convertCypressInfoCommand,
                    combineCypressJsonCommand,
                    assertCypressConversionValidCommand,
                    importExecutionCypressCommand,
                    fallbackCypressUploadCommand,
                    verifyResultsUploadCommand,
                ] = [...graph.getVertices()];
                assertIsInstanceOf(resultsCommand, ConstantCommand);
                assertIsInstanceOf(convertCypressTestsCommand, ConvertCypressTestsCommand);
                assertIsInstanceOf(convertCypressInfoCommand, ConvertCypressInfoCommand);
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
                    cucumber: options.cucumber,
                    evidenceCollection: new SimpleEvidenceCollection(),
                    jira: options.jira,
                    plugin: options.plugin,
                    useCloudStatusFallback: false,
                    xray: options.xray,
                });
                expect(convertCypressInfoCommand.getParameters()).to.deep.eq({
                    jira: options.jira,
                    xray: options.xray,
                });
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
                expect(graph.size("edges")).to.eq(9);
                expect([...graph.getSuccessors(resultsCommand)]).to.deep.eq([
                    convertCypressTestsCommand,
                    convertCypressInfoCommand,
                ]);
                expect([...graph.getSuccessors(convertCypressTestsCommand)]).to.deep.eq([
                    combineCypressJsonCommand,
                ]);
                expect([...graph.getSuccessors(convertCypressInfoCommand)]).to.deep.eq([
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
            });

            it("reuses existing commands", () => {
                const logger = getMockedLogger();
                const graph = new ExecutableGraph<Command>();
                graph.place(new ConstantCommand(logger, result));
                addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    logger
                );
                expect(graph.size("vertices")).to.eq(8);
                expect(graph.size("edges")).to.eq(9);
            });

            it("uses configured test execution issue data", () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.testExecutionIssueKey = "CYP-415";
                options.jira.testExecutionIssueType = "Test Run";
                addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    getMockedLogger()
                );
                expect(graph.size("vertices")).to.eq(9);
                // Vertices.
                const commands = [...graph.getVertices()];
                const importExecutionCypressCommand = commands[5];
                const verifyExecutionIssueKeyCommand = commands[6];
                const fallbackCypressUploadCommand = commands[7];
                assertIsInstanceOf(verifyExecutionIssueKeyCommand, VerifyExecutionIssueKeyCommand);
                // Vertex data.
                expect(verifyExecutionIssueKeyCommand.getParameters()).to.deep.eq({
                    displayCloudHelp: false,
                    importType: "cypress",
                    testExecutionIssueKey: "CYP-415",
                    testExecutionIssueType: "Test Run",
                });
                // Edges.
                expect(graph.size("edges")).to.eq(10);
                expect([...graph.getSuccessors(importExecutionCypressCommand)]).to.deep.eq([
                    verifyExecutionIssueKeyCommand,
                    fallbackCypressUploadCommand,
                ]);
            });

            it("attaches videos", () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.attachVideos = true;
                addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    getMockedLogger()
                );
                expect(graph.size("vertices")).to.eq(10);
                // Vertices.
                const commands = [...graph.getVertices()];
                const resultsCommand = commands[0];
                const verifyResultsUploadCommand = commands[7];
                const extractVideoFilesCommand = commands[8];
                const attachVideosCommand = commands[9];
                assertIsInstanceOf(extractVideoFilesCommand, ExtractVideoFilesCommand);
                assertIsInstanceOf(attachVideosCommand, AttachFilesCommand);
                // Vertex data.
                expect(attachVideosCommand.getParameters()).to.deep.eq({
                    jiraClient: clients.jiraClient,
                });
                // Edges.
                expect(graph.size("edges")).to.eq(12);
                expect([...graph.getSuccessors(resultsCommand)]).to.contain(
                    extractVideoFilesCommand
                );
                expect([...graph.getSuccessors(extractVideoFilesCommand)]).to.deep.eq([
                    attachVideosCommand,
                ]);
                expect([...graph.getSuccessors(verifyResultsUploadCommand)]).to.contain(
                    attachVideosCommand
                );
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
                it("adds commands necessary for cucumber results upload", () => {
                    const graph = new ExecutableGraph<Command>();
                    addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    expect(graph.size("vertices")).to.eq(11);
                    const [
                        cypressResultsCommand,
                        cucumberResultsCommand,
                        fetchIssueTypesCommand,
                        extractExecutionIssueTypeCommand,
                        convertCucumberInfoCommand,
                        convertCucumberFeaturesCommand,
                        combineCucumberMultipartCommand,
                        assertConversionValidCommand,
                        importCucumberExecutionCommand,
                        fallbackCucumberUploadCommand,
                        verifyResultsUploadCommand,
                    ] = [...graph.getVertices()];
                    assertIsInstanceOf(cypressResultsCommand, ConstantCommand);
                    assertIsInstanceOf(cucumberResultsCommand, ConstantCommand);
                    assertIsInstanceOf(fetchIssueTypesCommand, FetchIssueTypesCommand);
                    assertIsInstanceOf(
                        extractExecutionIssueTypeCommand,
                        ExtractExecutionIssueTypeCommand
                    );
                    assertIsInstanceOf(
                        convertCucumberInfoCommand,
                        ConvertCucumberInfoServerCommand
                    );
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
                    expect(fetchIssueTypesCommand.getParameters()).to.deep.eq({
                        jiraClient: clients.jiraClient,
                    });
                    expect(extractExecutionIssueTypeCommand.getParameters()).to.deep.eq({
                        displayCloudHelp: false,
                        projectKey: "CYP",
                        testExecutionIssueType: "Test Execution",
                    });
                    expect(convertCucumberInfoCommand.getParameters()).to.deep.eq({
                        cucumber: options.cucumber,
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
                            testExecutionIssueDescription: undefined,
                            testExecutionIssueSummary: undefined,
                            testPlanIssueKey: undefined,
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
                    expect(graph.size("edges")).to.eq(11);
                    expect([...graph.getSuccessors(cypressResultsCommand)]).to.contain(
                        convertCucumberInfoCommand
                    );
                    expect([...graph.getSuccessors(cucumberResultsCommand)]).to.deep.eq([
                        convertCucumberFeaturesCommand,
                    ]);
                    expect([...graph.getSuccessors(fetchIssueTypesCommand)]).to.deep.eq([
                        extractExecutionIssueTypeCommand,
                    ]);
                    expect([...graph.getSuccessors(extractExecutionIssueTypeCommand)]).to.deep.eq([
                        convertCucumberInfoCommand,
                    ]);
                    expect([...graph.getSuccessors(convertCucumberInfoCommand)]).to.deep.eq([
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
                });

                it("uses configured test plan data", () => {
                    options.jira.testPlanIssueKey = "CYP-42";
                    const graph = new ExecutableGraph<Command>();
                    addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    expect(graph.size("vertices")).to.eq(13);
                    const commands = [...graph.getVertices()];
                    const fetchAllFieldsCommand = commands[4];
                    const testPlanIdCommand = commands[5];
                    const convertCucumberInfoCommand = commands[6];
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
                    expect(graph.size("edges")).to.eq(13);
                    expect([...graph.getSuccessors(fetchAllFieldsCommand)]).to.deep.eq([
                        testPlanIdCommand,
                    ]);
                    expect([...graph.getSuccessors(testPlanIdCommand)]).to.deep.eq([
                        convertCucumberInfoCommand,
                    ]);
                });

                it("uses configured test plan data with hardcoded test plan ids", () => {
                    options.jira.testPlanIssueKey = "CYP-42";
                    options.jira.fields.testPlan = "customfield_12345";
                    const graph = new ExecutableGraph<Command>();
                    addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    expect(graph.size("vertices")).to.eq(12);
                    const commands = [...graph.getVertices()];
                    const testPlanIdCommand = commands[4];
                    const convertCucumberInfoCommand = commands[5];
                    assertIsInstanceOf(testPlanIdCommand, ConstantCommand);
                    // Vertex data.
                    expect(testPlanIdCommand.getValue()).to.eq("customfield_12345");
                    // Edges.
                    expect(graph.size("edges")).to.eq(12);
                    expect([...graph.getSuccessors(testPlanIdCommand)]).to.deep.eq([
                        convertCucumberInfoCommand,
                    ]);
                });

                it("uses configured test environment data", () => {
                    options.xray.testEnvironments = ["DEV"];
                    const graph = new ExecutableGraph<Command>();
                    addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    expect(graph.size("vertices")).to.eq(13);
                    const commands = [...graph.getVertices()];
                    const fetchAllFieldsCommand = commands[4];
                    const testEnvironmentsIdCommand = commands[5];
                    const convertCucumberInfoCommand = commands[6];
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
                    expect(graph.size("edges")).to.eq(13);
                    expect([...graph.getSuccessors(fetchAllFieldsCommand)]).to.deep.eq([
                        testEnvironmentsIdCommand,
                    ]);
                    expect([...graph.getSuccessors(testEnvironmentsIdCommand)]).to.deep.eq([
                        convertCucumberInfoCommand,
                    ]);
                });

                it("uses configured test environment data with hardcoded test environment ids", () => {
                    options.xray.testEnvironments = ["DEV"];
                    options.jira.fields.testEnvironments = "customfield_67890";
                    const graph = new ExecutableGraph<Command>();
                    addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    expect(graph.size("vertices")).to.eq(12);
                    const commands = [...graph.getVertices()];
                    const testEnvironmentsIdCommand = commands[4];
                    const convertCucumberInfoCommand = commands[5];
                    assertIsInstanceOf(testEnvironmentsIdCommand, ConstantCommand);
                    // Vertex data.
                    expect(testEnvironmentsIdCommand.getValue()).to.eq("customfield_67890");
                    // Edges.
                    expect(graph.size("edges")).to.eq(12);
                    expect([...graph.getSuccessors(testEnvironmentsIdCommand)]).to.deep.eq([
                        convertCucumberInfoCommand,
                    ]);
                });

                it("uses configured test plan and environment data", () => {
                    options.jira.testPlanIssueKey = "CYP-42";
                    options.xray.testEnvironments = ["DEV"];
                    const graph = new ExecutableGraph<Command>();
                    addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    expect(graph.size("vertices")).to.eq(14);
                    const commands = [...graph.getVertices()];
                    const fetchAllFieldsCommand = commands[4];
                    const testPlanIdCommand = commands[5];
                    const testEnvironmentsIdCommand = commands[6];
                    const convertCucumberInfoCommand = commands[7];
                    assertIsInstanceOf(fetchAllFieldsCommand, FetchAllFieldsCommand);
                    assertIsInstanceOf(testPlanIdCommand, ExtractFieldIdCommand);
                    assertIsInstanceOf(testEnvironmentsIdCommand, ExtractFieldIdCommand);
                    // Edges.
                    expect(graph.size("edges")).to.eq(15);
                    expect([...graph.getSuccessors(fetchAllFieldsCommand)]).to.deep.eq([
                        testPlanIdCommand,
                        testEnvironmentsIdCommand,
                    ]);
                    expect([...graph.getSuccessors(testPlanIdCommand)]).to.deep.eq([
                        convertCucumberInfoCommand,
                    ]);
                    expect([...graph.getSuccessors(testEnvironmentsIdCommand)]).to.deep.eq([
                        convertCucumberInfoCommand,
                    ]);
                });

                it("uses configured test plan and environment data with hardcoded ids", () => {
                    options.jira.testPlanIssueKey = "CYP-42";
                    options.jira.fields.testPlan = "customfield_12345";
                    options.xray.testEnvironments = ["DEV"];
                    options.jira.fields.testEnvironments = "customfield_67890";
                    const graph = new ExecutableGraph<Command>();
                    addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    expect(graph.size("vertices")).to.eq(13);
                    const commands = [...graph.getVertices()];
                    const testPlanIdCommand = commands[4];
                    const testEnvironmentsIdCommand = commands[5];
                    const convertCucumberInfoCommand = commands[6];
                    assertIsInstanceOf(testPlanIdCommand, ConstantCommand);
                    assertIsInstanceOf(testEnvironmentsIdCommand, ConstantCommand);
                    // Vertex data.
                    expect(testPlanIdCommand.getValue()).to.eq("customfield_12345");
                    expect(testEnvironmentsIdCommand.getValue()).to.eq("customfield_67890");
                    // Edges.
                    expect(graph.size("edges")).to.eq(13);
                    expect([...graph.getSuccessors(testPlanIdCommand)]).to.deep.eq([
                        convertCucumberInfoCommand,
                    ]);
                    expect([...graph.getSuccessors(testEnvironmentsIdCommand)]).to.deep.eq([
                        convertCucumberInfoCommand,
                    ]);
                });
            });

            describe("cloud", () => {
                beforeEach(() => {
                    clients.kind = "cloud";
                });

                it("adds commands necessary for cucumber results upload", () => {
                    const graph = new ExecutableGraph<Command>();
                    addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    expect(graph.size("vertices")).to.eq(11);
                    const commands = [...graph.getVertices()];
                    const extractExecutionIssueTypeCommand = commands[3];
                    const convertCucumberInfoCommand = commands[4];
                    const convertCucumberFeaturesCommand = commands[5];
                    expect(extractExecutionIssueTypeCommand.getParameters()).to.deep.eq({
                        displayCloudHelp: true,
                        projectKey: "CYP",
                        testExecutionIssueType: "Test Execution",
                    });
                    assertIsInstanceOf(convertCucumberInfoCommand, ConvertCucumberInfoCloudCommand);
                    expect(convertCucumberInfoCommand.getParameters()).to.deep.eq({
                        cucumber: options.cucumber,
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
                            testExecutionIssueDescription: undefined,
                            testExecutionIssueSummary: undefined,
                            testPlanIssueKey: undefined,
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
                });

                it("uses configured test execution issue data", () => {
                    const graph = new ExecutableGraph<Command>();
                    options.jira.testExecutionIssueKey = "CYP-42";
                    options.jira.testExecutionIssueType = "Test Run";
                    addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                    // Vertices.
                    expect(graph.size("vertices")).to.eq(13);
                    const [
                        cypressResultsCommand,
                        cucumberResultsCommand,
                        testExecutionIssueKeyCommand,
                        fetchIssueTypesCommand,
                        extractExecutionIssueTypeCommand,
                        convertCucumberInfoCommand,
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
                    assertIsInstanceOf(fetchIssueTypesCommand, FetchIssueTypesCommand);
                    assertIsInstanceOf(
                        extractExecutionIssueTypeCommand,
                        ExtractExecutionIssueTypeCommand
                    );
                    assertIsInstanceOf(convertCucumberInfoCommand, ConvertCucumberInfoCloudCommand);
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
                    expect(fetchIssueTypesCommand.getParameters()).to.deep.eq({
                        jiraClient: clients.jiraClient,
                    });
                    expect(extractExecutionIssueTypeCommand.getParameters()).to.deep.eq({
                        displayCloudHelp: true,
                        projectKey: "CYP",
                        testExecutionIssueType: "Test Run",
                    });
                    expect(convertCucumberInfoCommand.getParameters()).to.deep.eq({
                        cucumber: options.cucumber,
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
                            testExecutionIssueDescription: undefined,
                            testExecutionIssueSummary: undefined,
                            testPlanIssueKey: undefined,
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
                        testExecutionIssueType: "Test Run",
                    });
                    // Edges.
                    expect(graph.size("edges")).to.eq(13);
                    expect([...graph.getSuccessors(cypressResultsCommand)]).to.contain(
                        convertCucumberInfoCommand
                    );
                    expect([...graph.getSuccessors(cucumberResultsCommand)]).to.deep.eq([
                        convertCucumberFeaturesCommand,
                    ]);
                    expect([...graph.getSuccessors(testExecutionIssueKeyCommand)]).to.deep.eq([
                        convertCucumberFeaturesCommand,
                    ]);
                    expect([...graph.getSuccessors(fetchIssueTypesCommand)]).to.deep.eq([
                        extractExecutionIssueTypeCommand,
                    ]);
                    expect([...graph.getSuccessors(extractExecutionIssueTypeCommand)]).to.deep.eq([
                        convertCucumberInfoCommand,
                    ]);
                    expect([...graph.getSuccessors(convertCucumberInfoCommand)]).to.deep.eq([
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
                });
            });

            it("throws if the cucumber report was not configured", () => {
                const graph = new ExecutableGraph<Command>();
                const preprocessorOptions = options.cucumber as InternalCucumberOptions;
                preprocessorOptions.preprocessor = undefined;
                expect(() => {
                    addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        graph,
                        getMockedLogger()
                    );
                }).to.throw(
                    "Failed to prepare Cucumber upload: Cucumber preprocessor JSON report path not configured"
                );
            });

            it("does not add any commands if neither cypress nor cucumber results exist", () => {
                const logger = getMockedLogger();
                cypressResult.runs = [];
                const graph = new ExecutableGraph<Command>();
                addUploadCommands(
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

            it("adds connections from feature file imports to execution uploads", () => {
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
                addUploadCommands(
                    cypressResult,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    logger
                );
                // Vertices.
                expect(graph.size("vertices")).to.eq(14);
                const commands = [...graph.getVertices()];
                const importFeatureCommand1 = commands[0];
                const importFeatureCommand2 = commands[1];
                const importFeatureCommand3 = commands[2];
                const importCucumberExecutionCommand = commands[11];
                // Edges.
                expect(graph.size("edges")).to.eq(13);
                expect([...graph.getSuccessors(importFeatureCommand1)]).to.contain(
                    importCucumberExecutionCommand
                );
                expect([...graph.getSuccessors(importFeatureCommand2)]).to.deep.eq([
                    importCucumberExecutionCommand,
                ]);
                expect([...graph.getSuccessors(importFeatureCommand3)]).to.be.empty;
            });
        });

        describe("mixed", () => {
            let cypressResult: CypressRunResultType;

            beforeEach(() => {
                cypressResult = JSON.parse(
                    readFileSync("./test/resources/runResultCucumberMixed.json", "utf-8")
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
            });

            it("adds commands necessary for mixed results upload", () => {
                const graph = new ExecutableGraph<Command>();
                addUploadCommands(
                    cypressResult,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    graph,
                    getMockedLogger()
                );
                // Vertices.
                expect(graph.size("vertices")).to.eq(17);
                const [
                    cypressResultsCommand,
                    convertCypressTestsCommand,
                    convertCypressInfoCommand,
                    combineCypressJsonCommand,
                    assertCypressConversionValidCommand,
                    importExecutionCypressCommand,
                    cucumberResultsCommand,
                    fallbackCypressUploadCommand,
                    fetchIssueTypesCommand,
                    extractExecutionIssueTypeCommand,
                    convertCucumberInfoCommand,
                    convertCucumberFeaturesCommand,
                    combineCucumberMultipartCommand,
                    assertCucumberConversionValidCommand,
                    importCucumberExecutionCommand,
                    fallbackCucumberUploadCommand,
                    verifyResultsUploadCommand,
                ] = [...graph.getVertices()];
                assertIsInstanceOf(cypressResultsCommand, ConstantCommand);
                assertIsInstanceOf(convertCypressTestsCommand, ConvertCypressTestsCommand);
                assertIsInstanceOf(convertCypressInfoCommand, ConvertCypressInfoCommand);
                assertIsInstanceOf(combineCypressJsonCommand, CombineCypressJsonCommand);
                assertIsInstanceOf(
                    assertCypressConversionValidCommand,
                    AssertCypressConversionValidCommand
                );
                assertIsInstanceOf(importExecutionCypressCommand, ImportExecutionCypressCommand);
                assertIsInstanceOf(cypressResultsCommand, ConstantCommand);
                assertIsInstanceOf(cucumberResultsCommand, ConstantCommand);
                assertIsInstanceOf(fetchIssueTypesCommand, FetchIssueTypesCommand);
                assertIsInstanceOf(
                    extractExecutionIssueTypeCommand,
                    ExtractExecutionIssueTypeCommand
                );
                assertIsInstanceOf(convertCucumberInfoCommand, ConvertCucumberInfoServerCommand);
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
                assertIsInstanceOf(fallbackCypressUploadCommand, FallbackCommand);
                assertIsInstanceOf(verifyResultsUploadCommand, VerifyResultsUploadCommand);
                // Vertex data.
                expect(cypressResultsCommand.getValue()).to.deep.eq(cypressResult);
                expect(convertCypressTestsCommand.getParameters()).to.deep.eq({
                    cucumber: options.cucumber,
                    evidenceCollection: new SimpleEvidenceCollection(),
                    jira: options.jira,
                    plugin: options.plugin,
                    useCloudStatusFallback: false,
                    xray: options.xray,
                });
                expect(convertCypressInfoCommand.getParameters()).to.deep.eq({
                    jira: options.jira,
                    xray: options.xray,
                });
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
                expect(fallbackCucumberUploadCommand.getParameters()).to.deep.eq({
                    fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
                    fallbackValue: undefined,
                });
                expect(verifyResultsUploadCommand.getParameters()).to.deep.eq({
                    url: "https://example.org",
                });
                // Edges.
                expect(graph.size("edges")).to.eq(21);
                // Cypress.
                expect([...graph.getSuccessors(cypressResultsCommand)]).to.deep.eq([
                    convertCypressTestsCommand,
                    convertCypressInfoCommand,
                    convertCucumberInfoCommand,
                ]);
                expect([...graph.getSuccessors(convertCypressTestsCommand)]).to.deep.eq([
                    combineCypressJsonCommand,
                ]);
                expect([...graph.getSuccessors(convertCypressInfoCommand)]).to.deep.eq([
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
                    convertCucumberFeaturesCommand,
                    verifyResultsUploadCommand,
                ]);
                // Cucumber.
                expect([...graph.getSuccessors(cucumberResultsCommand)]).to.deep.eq([
                    convertCucumberFeaturesCommand,
                ]);
                expect([...graph.getSuccessors(fetchIssueTypesCommand)]).to.deep.eq([
                    extractExecutionIssueTypeCommand,
                ]);
                expect([...graph.getSuccessors(extractExecutionIssueTypeCommand)]).to.deep.eq([
                    convertCucumberInfoCommand,
                ]);
                expect([...graph.getSuccessors(convertCucumberInfoCommand)]).to.deep.eq([
                    combineCucumberMultipartCommand,
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
            });
        });
    });
});
