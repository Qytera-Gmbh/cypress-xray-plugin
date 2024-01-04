import { expect } from "chai";
import { readFileSync } from "fs";
import path from "path";
import { getMockedJiraClient, getMockedXrayClient } from "../../../test/mocks";
import { assertIsInstanceOf } from "../../../test/util";
import {
    initCucumberOptions,
    initJiraOptions,
    initPluginOptions,
    initSslOptions,
    initXrayOptions,
} from "../../context";
import { CypressRunResultType } from "../../types/cypress/run-result";
import {
    ClientCombination,
    InternalCucumberOptions,
    InternalCypressXrayPluginOptions,
} from "../../types/plugin";
import { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import { ExecutableGraph } from "../../util/graph/executable";
import { Command } from "../command";
import { ConstantCommand } from "../util/commands/constant-command";
import { AttachFilesCommand } from "../util/commands/jira/attach-files-command";
import { FetchIssueTypesCommand } from "../util/commands/jira/fetch-issue-types-command";
import { ImportExecutionCucumberCommand } from "../util/commands/xray/import-execution-cucumber-command";
import { ImportExecutionCypressCommand } from "../util/commands/xray/import-execution-cypress-command";
import { addUploadCommands } from "./after-run";
import { AssertCucumberConversionValidCommand } from "./commands/conversion/cucumber/assert-cucumber-conversion-valid-command";
import { CombineCucumberMultipartCommand } from "./commands/conversion/cucumber/combine-cucumber-multipart-command";
import { ConvertCucumberFeaturesCommand } from "./commands/conversion/cucumber/convert-cucumber-features-command";
import {
    ConvertCucumberInfoCloudCommand,
    ConvertCucumberInfoServerCommand,
} from "./commands/conversion/cucumber/convert-cucumber-info-command";
import { AssertCypressConversionValidCommand } from "./commands/conversion/cypress/assert-cypress-conversion-valid-command";
import { CombineCypressJsonCommand } from "./commands/conversion/cypress/combine-cypress-xray-command";
import { ConvertCypressInfoCommand } from "./commands/conversion/cypress/convert-cypress-info-command";
import { ConvertCypressTestsCommand } from "./commands/conversion/cypress/convert-cypress-tests-command";
import { ExtractExecutionIssueTypeCommand } from "./commands/extract-execution-issue-type-command";
import { ExtractVideoFilesCommand } from "./commands/extract-video-files-command";
import { PrintUploadSuccessCommand } from "./commands/print-upload-success-command";
import { VerifyExecutionIssueKeyCommand } from "./commands/verify-execution-issue-key-command";

describe.only(path.relative(process.cwd(), __filename), () => {
    let clients: ClientCombination;
    let options: InternalCypressXrayPluginOptions;
    beforeEach(async () => {
        options = {
            jira: initJiraOptions(
                {},
                {
                    projectKey: "CYP",
                    url: "https://example.org",
                }
            ),
            cucumber: await initCucumberOptions(
                {
                    testingType: "component",
                    projectRoot: "",
                    reporter: "",
                    specPattern: "",
                    excludeSpecPattern: "",
                    env: { jsonEnabled: true },
                },
                {
                    featureFileExtension: ".feature",
                    prefixes: {
                        test: "TestName:",
                        precondition: "Precondition:",
                    },
                    uploadFeatures: true,
                }
            ),
            plugin: initPluginOptions({}, {}),
            xray: initXrayOptions({}, {}),
            ssl: initSslOptions({}, {}),
        };
        clients = {
            kind: "server",
            jiraClient: getMockedJiraClient(),
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
                addUploadCommands(result, ".", options, clients, graph);
                // Vertices.
                expect(graph.size("vertices")).to.eq(7);
                const [
                    resultsCommand,
                    convertCypressTestsCommand,
                    convertCypressInfoCommand,
                    combineCypressJsonCommand,
                    assertCypressConversionValidCommand,
                    importExecutionCypressCommand,
                    printUploadSuccessCommand,
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
                assertIsInstanceOf(printUploadSuccessCommand, PrintUploadSuccessCommand);
                // Vertex data.
                expect(resultsCommand.getValue()).to.deep.eq(result);
                expect(convertCypressTestsCommand.getParameters()).to.deep.eq({
                    ...options,
                    useCloudStatusFallback: false,
                });
                expect(convertCypressInfoCommand.getParameters()).to.deep.eq(options);
                expect(combineCypressJsonCommand.getParameters()).to.deep.eq({
                    testExecutionIssueKey: undefined,
                });
                expect(importExecutionCypressCommand.getParameters()).to.deep.eq({
                    xrayClient: clients.xrayClient,
                });
                expect(printUploadSuccessCommand.getParameters()).to.deep.eq({
                    url: "https://example.org",
                });
                // Edges.
                expect(graph.size("edges")).to.eq(8);
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
                    printUploadSuccessCommand,
                ]);
            });

            it("reuses existing commands", () => {
                const graph = new ExecutableGraph<Command>();
                graph.place(new ConstantCommand(result));
                addUploadCommands(result, ".", options, clients, graph);
                expect(graph.size("vertices")).to.eq(7);
                expect(graph.size("edges")).to.eq(8);
            });

            it("uses configured test execution issue data", () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.testExecutionIssueKey = "CYP-415";
                options.jira.testExecutionIssueType = "Test Run";
                addUploadCommands(result, ".", options, clients, graph);
                expect(graph.size("vertices")).to.eq(8);
                // Vertices.
                const commands = [...graph.getVertices()];
                const importExecutionCypressCommand = commands[5];
                const verifyExecutionIssueKeyCommand = commands[6];
                const printUploadSuccessCommand = commands[7];
                assertIsInstanceOf(verifyExecutionIssueKeyCommand, VerifyExecutionIssueKeyCommand);
                // Vertex data.
                expect(verifyExecutionIssueKeyCommand.getParameters()).to.deep.eq({
                    testExecutionIssueKey: "CYP-415",
                    testExecutionIssueType: "Test Run",
                    importType: "cypress",
                    displayCloudHelp: false,
                });
                // Edges.
                expect(graph.size("edges")).to.eq(9);
                expect([...graph.getSuccessors(importExecutionCypressCommand)]).to.deep.eq([
                    verifyExecutionIssueKeyCommand,
                    printUploadSuccessCommand,
                ]);
            });

            it("attaches videos", () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.attachVideos = true;
                addUploadCommands(result, ".", options, clients, graph);
                expect(graph.size("vertices")).to.eq(9);
                // Vertices.
                const commands = [...graph.getVertices()];
                const resultsCommand = commands[0];
                const importExecutionCypressCommand = commands[5];
                const extractVideoFilesCommand = commands[7];
                const attachVideosCommand = commands[8];
                assertIsInstanceOf(extractVideoFilesCommand, ExtractVideoFilesCommand);
                assertIsInstanceOf(attachVideosCommand, AttachFilesCommand);
                // Vertex data.
                expect(attachVideosCommand.getParameters()).to.deep.eq({
                    jiraClient: clients.jiraClient,
                });
                // Edges.
                expect(graph.size("edges")).to.eq(11);
                expect([...graph.getSuccessors(resultsCommand)]).to.contain(
                    extractVideoFilesCommand
                );
                expect([...graph.getSuccessors(extractVideoFilesCommand)]).to.deep.eq([
                    attachVideosCommand,
                ]);
                expect([...graph.getSuccessors(importExecutionCypressCommand)]).to.contain(
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
                    featureFileExtension: ".feature",
                    preprocessor: {
                        json: {
                            enabled: true,
                            output: "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                        },
                    },
                    downloadFeatures: false,
                    uploadFeatures: false,
                    prefixes: {},
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
                    addUploadCommands(cypressResult, ".", options, clients, graph);
                    // Vertices.
                    expect(graph.size("vertices")).to.eq(10);
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
                        printSuccessCommand,
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
                    assertIsInstanceOf(printSuccessCommand, PrintUploadSuccessCommand);
                    // Vertex data.
                    expect(cypressResultsCommand.getValue()).to.deep.eq(cypressResult);
                    expect(cucumberResultsCommand.getValue()).to.deep.eq(cucumberResult);
                    expect(fetchIssueTypesCommand.getParameters()).to.deep.eq({
                        jiraClient: clients.jiraClient,
                    });
                    expect(extractExecutionIssueTypeCommand.getParameters()).to.deep.eq({
                        projectKey: "CYP",
                        testExecutionIssueType: "Test Execution",
                        displayCloudHelp: false,
                    });
                    expect(convertCucumberInfoCommand.getParameters()).to.deep.eq(options);
                    expect(convertCucumberFeaturesCommand.getParameters()).to.deep.eq({
                        ...options,
                        useCloudTags: false,
                    });
                    expect(importCucumberExecutionCommand.getParameters()).to.deep.eq({
                        xrayClient: clients.xrayClient,
                    });
                    // Edges.
                    expect(graph.size("edges")).to.eq(9);
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
                    expect([...graph.getSuccessors(importCucumberExecutionCommand)]).to.deep.eq([
                        printSuccessCommand,
                    ]);
                });
            });

            describe("cloud", () => {
                beforeEach(() => {
                    clients.kind = "cloud";
                });

                it("adds commands necessary for cucumber results upload", () => {
                    const graph = new ExecutableGraph<Command>();
                    addUploadCommands(cypressResult, ".", options, clients, graph);
                    // Vertices.
                    expect(graph.size("vertices")).to.eq(10);
                    const commands = [...graph.getVertices()];
                    const extractExecutionIssueTypeCommand = commands[3];
                    const convertCucumberInfoCommand = commands[4];
                    const convertCucumberFeaturesCommand = commands[5];
                    expect(extractExecutionIssueTypeCommand.getParameters()).to.deep.eq({
                        projectKey: "CYP",
                        testExecutionIssueType: "Test Execution",
                        displayCloudHelp: true,
                    });
                    assertIsInstanceOf(convertCucumberInfoCommand, ConvertCucumberInfoCloudCommand);
                    expect(convertCucumberInfoCommand.getParameters()).to.deep.eq(options);
                    expect(convertCucumberFeaturesCommand.getParameters()).to.deep.eq({
                        ...options,
                        useCloudTags: true,
                    });
                });

                it("uses configured test execution issue data", () => {
                    const graph = new ExecutableGraph<Command>();
                    options.jira.testExecutionIssueKey = "CYP-42";
                    options.jira.testExecutionIssueType = "Test Run";
                    addUploadCommands(cypressResult, ".", options, clients, graph);
                    // Vertices.
                    expect(graph.size("vertices")).to.eq(12);
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
                        printSuccessCommand,
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
                    assertIsInstanceOf(printSuccessCommand, PrintUploadSuccessCommand);
                    // Vertex data.
                    expect(cypressResultsCommand.getValue()).to.deep.eq(cypressResult);
                    expect(cucumberResultsCommand.getValue()).to.deep.eq(cucumberResult);
                    expect(testExecutionIssueKeyCommand.getValue()).to.deep.eq("CYP-42");
                    expect(fetchIssueTypesCommand.getParameters()).to.deep.eq({
                        jiraClient: clients.jiraClient,
                    });
                    expect(extractExecutionIssueTypeCommand.getParameters()).to.deep.eq({
                        projectKey: "CYP",
                        testExecutionIssueType: "Test Run",
                        displayCloudHelp: true,
                    });
                    expect(convertCucumberInfoCommand.getParameters()).to.deep.eq(options);
                    expect(convertCucumberFeaturesCommand.getParameters()).to.deep.eq({
                        ...options,
                        useCloudTags: true,
                    });
                    expect(importCucumberExecutionCommand.getParameters()).to.deep.eq({
                        xrayClient: clients.xrayClient,
                    });
                    expect(verifyExecutionIssueKeyCommand.getParameters()).to.deep.eq({
                        testExecutionIssueKey: "CYP-42",
                        testExecutionIssueType: "Test Run",
                        importType: "cucumber",
                        displayCloudHelp: true,
                    });
                    // Edges.
                    expect(graph.size("edges")).to.eq(11);
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
                    expect([...graph.getSuccessors(importCucumberExecutionCommand)]).to.deep.eq([
                        verifyExecutionIssueKeyCommand,
                        printSuccessCommand,
                    ]);
                });
            });

            it("throws if the cucumber report was not configured", () => {
                const graph = new ExecutableGraph<Command>();
                const preprocessorOptions = options.cucumber as InternalCucumberOptions;
                preprocessorOptions.preprocessor = undefined;
                expect(() => {
                    addUploadCommands(cypressResult, ".", options, clients, graph);
                }).to.throw(
                    "Failed to prepare Cucumber upload: Cucumber preprocessor JSON report path not configured"
                );
            });
        });
    });
});
