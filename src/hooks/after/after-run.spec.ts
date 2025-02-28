import axios from "axios";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import { assertIsInstanceOf } from "../../../test/util";
import { PatCredentials } from "../../client/authentication/credentials";
import { AxiosRestClient } from "../../client/https/requests";
import { BaseJiraClient } from "../../client/jira/jira-client";
import { ServerClient } from "../../client/xray/xray-client-server";
import globalContext, {
    SimpleEvidenceCollection,
    SimpleIterationParameterCollection,
} from "../../context";
import type { CypressRunResultType } from "../../types/cypress/cypress";
import type { ClientCombination } from "../../types/plugin";
import {
    type InternalCucumberOptions,
    type InternalCypressXrayPluginOptions,
} from "../../types/plugin";
import type {
    CucumberMultipart,
    CucumberMultipartFeature,
} from "../../types/xray/requests/import-execution-cucumber-multipart";
import { ExecutableGraph } from "../../util/graph/executable-graph";
import { LOG } from "../../util/logging";
import type { Command } from "../command";
import { ComputableState } from "../command";
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
import afterRun from "./after-run";
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

describe(relative(cwd(), __filename), async () => {
    let clients: ClientCombination;
    let options: InternalCypressXrayPluginOptions;
    beforeEach(async () => {
        options = {
            cucumber: await globalContext.initCucumberOptions(
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
            jira: globalContext.initJiraOptions(
                {},
                {
                    projectKey: "CYP",
                    url: "http://localhost:1234",
                }
            ),
            plugin: globalContext.initPluginOptions({}, {}),
            xray: globalContext.initXrayOptions({}, {}),
        };
        const restClient = new AxiosRestClient(axios);
        clients = {
            jiraClient: new BaseJiraClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                restClient
            ),
            kind: "server",
            xrayClient: new ServerClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                restClient
            ),
        };
    });

    await describe(afterRun.addUploadCommands.name, async () => {
        await describe("cypress", async () => {
            let result: CypressRunResultType;

            beforeEach(() => {
                result = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                ) as CypressRunResultType;
            });

            await it("adds commands necessary for cypress results upload", async () => {
                const graph = new ExecutableGraph<Command>();
                await afterRun.addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    new SimpleIterationParameterCollection(),
                    graph,
                    LOG
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
                assert.deepStrictEqual(resultsCommand.getValue(), result);
                assert.deepStrictEqual(convertCypressTestsCommand.getParameters(), {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: ".feature",
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
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
                assert.deepStrictEqual(convertCommand.getParameters(), {
                    jira: {
                        projectKey: options.jira.projectKey,
                        testPlanIssueKey: undefined,
                    },
                    xray: options.xray,
                });
                assert.deepStrictEqual(
                    issueSummaryCommand.getValue(),
                    "Execution Results [2022-11-28T17:41:12.234Z]"
                );
                assert.deepStrictEqual(issuetypeCommand.getValue(), { name: "Test Execution" });
                assert.deepStrictEqual(combineCypressJsonCommand.getParameters(), {
                    testExecutionIssueKey: undefined,
                });
                assert.deepStrictEqual(importExecutionCypressCommand.getParameters(), {
                    splitUpload: false,
                    xrayClient: clients.xrayClient,
                });
                assert.deepStrictEqual(fallbackCypressUploadCommand.getParameters(), {
                    fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
                    fallbackValue: undefined,
                });
                assert.deepStrictEqual(verifyResultsUploadCommand.getParameters(), {
                    url: "http://localhost:1234",
                });
                // Edges.
                assert.deepStrictEqual(
                    [...graph.getSuccessors(resultsCommand)],
                    [convertCypressTestsCommand, convertCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(convertCypressTestsCommand)],
                    [combineCypressJsonCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(issueSummaryCommand)],
                    [convertCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(convertCommand)],
                    [combineCypressJsonCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(combineCypressJsonCommand)],
                    [assertCypressConversionValidCommand, importExecutionCypressCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(assertCypressConversionValidCommand)],
                    [importExecutionCypressCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(importExecutionCypressCommand)],
                    [fallbackCypressUploadCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(fallbackCypressUploadCommand)],
                    [verifyResultsUploadCommand]
                );
                assert.strictEqual(graph.size("vertices"), 10);
                assert.strictEqual(graph.size("edges"), 11);
            });

            await it("uses configured test execution issue keys", async () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.testExecutionIssue = {
                    key: "CYP-415",
                };
                await afterRun.addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    new SimpleIterationParameterCollection(),
                    graph,
                    LOG
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const issueKeysCommand = commands[3];
                const getSummaryValuesCommand = commands[4];
                const destructureCommand = commands[5];
                const convertInfoServerCommand = commands[7];
                const importCypressExecutionCommand = commands[10];
                const verifyExecutionIssueKeyCommand = commands[11];
                const fallbackCypressUploadCommand = commands[12];
                assertIsInstanceOf(issueKeysCommand, ConstantCommand);
                assertIsInstanceOf(getSummaryValuesCommand, GetSummaryValuesCommand);
                assertIsInstanceOf(destructureCommand, DestructureCommand);
                assertIsInstanceOf(importCypressExecutionCommand, ImportExecutionCypressCommand);
                assertIsInstanceOf(verifyExecutionIssueKeyCommand, VerifyExecutionIssueKeyCommand);
                assertIsInstanceOf(fallbackCypressUploadCommand, FallbackCommand);
                // Vertex data.
                assert.deepStrictEqual(issueKeysCommand.getValue(), ["CYP-415"]);
                assert.deepStrictEqual(getSummaryValuesCommand.getParameters(), {
                    jiraClient: clients.jiraClient,
                });
                assert.deepStrictEqual(destructureCommand.getParameters(), {
                    accessor: "CYP-415",
                });
                assert.deepStrictEqual(verifyExecutionIssueKeyCommand.getParameters(), {
                    displayCloudHelp: false,
                    importType: "cypress",
                    testExecutionIssueKey: "CYP-415",
                    testExecutionIssueType: { name: "Test Execution" },
                });
                // Edges.
                assert.deepStrictEqual(
                    [...graph.getSuccessors(issueKeysCommand)],
                    [getSummaryValuesCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(getSummaryValuesCommand)],
                    [destructureCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(destructureCommand)],
                    [convertInfoServerCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(importCypressExecutionCommand)],
                    [verifyExecutionIssueKeyCommand, fallbackCypressUploadCommand]
                );
                assert.strictEqual(graph.size("vertices"), 14);
                assert.strictEqual(graph.size("edges"), 15);
            });

            await it("uses configured test execution issue data with known fields", async () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.testExecutionIssue = {
                    fields: {
                        issuetype: {
                            name: "Test Run",
                        },
                    },
                    key: "CYP-415",
                };
                await afterRun.addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    new SimpleIterationParameterCollection(),
                    graph,
                    LOG
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const issueKeysCommand = commands[3];
                const getSummaryValuesCommand = commands[4];
                assertIsInstanceOf(issueKeysCommand, ConstantCommand);
                assertIsInstanceOf(getSummaryValuesCommand, GetSummaryValuesCommand);
                // Vertex data.
                assert.deepStrictEqual(issueKeysCommand.getValue(), ["CYP-415"]);
                assert.deepStrictEqual(getSummaryValuesCommand.getParameters(), {
                    jiraClient: clients.jiraClient,
                });
                // Edges.
                assert.deepStrictEqual(
                    [...graph.getSuccessors(issueKeysCommand)],
                    [getSummaryValuesCommand]
                );
                assert.strictEqual(graph.size("vertices"), 14);
                assert.strictEqual(graph.size("edges"), 15);
            });

            await it("uses configured summaries", async () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.testExecutionIssue = {
                    fields: {
                        summary: "My summary",
                    },
                };
                await afterRun.addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    new SimpleIterationParameterCollection(),
                    graph,
                    LOG
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const issueSummaryCommand = commands[3];
                const convertInfoServerCommand = commands[5];
                assertIsInstanceOf(issueSummaryCommand, ConstantCommand);
                assertIsInstanceOf(convertInfoServerCommand, ConvertInfoServerCommand);
                // Vertex data.
                assert.deepStrictEqual(issueSummaryCommand.getValue(), "My summary");
                // Edges.
                assert.deepStrictEqual(
                    [...graph.getSuccessors(issueSummaryCommand)],
                    [convertInfoServerCommand]
                );
                assert.strictEqual(graph.size("vertices"), 11);
                assert.strictEqual(graph.size("edges"), 12);
            });

            await it("uses configured custom issue data", async () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.testExecutionIssue = {
                    fields: {
                        assignee: "someone else",
                        ["customfield_12345"]: "bonjour",
                    },
                };
                await afterRun.addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    new SimpleIterationParameterCollection(),
                    graph,
                    LOG
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const issueUpdateCommand = commands[2];
                assertIsInstanceOf(issueUpdateCommand, ConstantCommand);
                // Vertex data.
                assert.deepStrictEqual(issueUpdateCommand.getValue(), {
                    fields: {
                        assignee: "someone else",
                        ["customfield_12345"]: "bonjour",
                    },
                });
                assert.strictEqual(graph.size("vertices"), 11);
                assert.strictEqual(graph.size("edges"), 12);
            });

            await it("attaches videos", async () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.attachVideos = true;
                await afterRun.addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    new SimpleIterationParameterCollection(),
                    graph,
                    LOG
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
                assert.deepStrictEqual(attachVideosCommand.getParameters(), {
                    jiraClient: clients.jiraClient,
                });
                // Edges.
                assert.ok(
                    [...graph.getSuccessors(resultsCommand)].includes(extractVideoFilesCommand)
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(extractVideoFilesCommand)],
                    [attachVideosCommand]
                );
                assert.ok(
                    [...graph.getSuccessors(verifyResultsUploadCommand)].includes(
                        attachVideosCommand
                    )
                );
                assert.strictEqual(graph.size("vertices"), 12);
                assert.strictEqual(graph.size("edges"), 14);
            });

            await it("explicitly transitions issues in server environments", async () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.testExecutionIssue = {
                    transition: {
                        id: "6",
                    },
                };
                clients.kind = "server";
                await afterRun.addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    new SimpleIterationParameterCollection(),
                    graph,
                    LOG
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const verifyResultsUploadCommand = commands[10];
                const transitionIssueCommand = commands[11];
                assertIsInstanceOf(transitionIssueCommand, TransitionIssueCommand);
                // Vertex data.
                assert.deepStrictEqual(transitionIssueCommand.getParameters(), {
                    jiraClient: clients.jiraClient,
                    transition: {
                        id: "6",
                    },
                });
                // Edges.
                assert.ok(
                    [...graph.getSuccessors(verifyResultsUploadCommand)].includes(
                        transitionIssueCommand
                    )
                );
                assert.strictEqual(graph.size("vertices"), 12);
                assert.strictEqual(graph.size("edges"), 13);
            });

            await it("does not explicitly transition issues in cloud environments", async () => {
                const graph = new ExecutableGraph<Command>();
                options.jira.testExecutionIssue = {
                    transition: {
                        id: "6",
                    },
                };
                clients.kind = "cloud";
                await afterRun.addUploadCommands(
                    result,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    new SimpleIterationParameterCollection(),
                    graph,
                    LOG
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const verifyResultsUploadCommand = commands[10];
                assertIsInstanceOf(verifyResultsUploadCommand, VerifyResultsUploadCommand);
                // Edges.
                assert.deepStrictEqual([...graph.getSuccessors(verifyResultsUploadCommand)], []);
                assert.strictEqual(graph.size("vertices"), 11);
                assert.strictEqual(graph.size("edges"), 12);
            });
        });

        await describe("cucumber", async () => {
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

            await describe("server", async () => {
                await it("adds commands necessary for cucumber results upload", async (context) => {
                    context.mock.timers.enable({ apis: ["Date"] });
                    context.mock.timers.tick(12345);
                    const graph = new ExecutableGraph<Command>();
                    await afterRun.addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        new SimpleIterationParameterCollection(),
                        graph,
                        LOG
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
                    assert.deepStrictEqual(cypressResultsCommand.getValue(), cypressResult);
                    assert.deepStrictEqual(cucumberResultsCommand.getValue(), cucumberResult);
                    assert.deepStrictEqual(
                        issueSummaryCommand.getValue(),
                        "Execution Results [2023-07-23T21:26:15.539Z]"
                    );
                    assert.deepStrictEqual(issuetypeCommand.getValue(), {
                        name: "Test Execution",
                    });
                    assert.deepStrictEqual(convertMultipartInfoCommand.getParameters(), {
                        jira: {
                            projectKey: options.jira.projectKey,
                            testPlanIssueKey: undefined,
                        },
                        xray: options.xray,
                    });
                    assert.deepStrictEqual(convertCucumberFeaturesCommand.getParameters(), {
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
                    assert.deepStrictEqual(importCucumberExecutionCommand.getParameters(), {
                        xrayClient: clients.xrayClient,
                    });
                    assert.deepStrictEqual(fallbackCucumberUploadCommand.getParameters(), {
                        fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
                        fallbackValue: undefined,
                    });
                    // Edges.
                    assert.ok(
                        [...graph.getSuccessors(cypressResultsCommand)].includes(
                            convertMultipartInfoCommand
                        )
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(cucumberResultsCommand)],
                        [convertCucumberFeaturesCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(issueSummaryCommand)],
                        [convertMultipartInfoCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(issuetypeCommand)],
                        [convertMultipartInfoCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(convertMultipartInfoCommand)],
                        [combineCucumberMultipartCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(convertCucumberFeaturesCommand)],
                        [combineCucumberMultipartCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(combineCucumberMultipartCommand)],
                        [assertConversionValidCommand, importCucumberExecutionCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(assertConversionValidCommand)],
                        [importCucumberExecutionCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(importCucumberExecutionCommand)],
                        [fallbackCucumberUploadCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(fallbackCucumberUploadCommand)],
                        [verifyResultsUploadCommand]
                    );
                    assert.strictEqual(graph.size("vertices"), 11);
                    assert.strictEqual(graph.size("edges"), 11);
                });

                await it("uses configured test plan data", async () => {
                    options.jira.testPlanIssueKey = "CYP-42";
                    const graph = new ExecutableGraph<Command>();
                    await afterRun.addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        new SimpleIterationParameterCollection(),
                        graph,
                        LOG
                    );
                    // Vertices.
                    const commands = [...graph.getVertices()];
                    const fetchAllFieldsCommand = commands[0];
                    const testPlanIdCommand = commands[1];
                    const convertCommand = commands[5];
                    assertIsInstanceOf(fetchAllFieldsCommand, FetchAllFieldsCommand);
                    assertIsInstanceOf(testPlanIdCommand, ExtractFieldIdCommand);
                    // Vertex data.
                    assert.deepStrictEqual(fetchAllFieldsCommand.getParameters(), {
                        jiraClient: clients.jiraClient,
                    });
                    assert.deepStrictEqual(testPlanIdCommand.getParameters(), {
                        field: JiraField.TEST_PLAN,
                    });
                    // Edges.
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(fetchAllFieldsCommand)],
                        [testPlanIdCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(testPlanIdCommand)],
                        [convertCommand]
                    );
                    assert.strictEqual(graph.size("vertices"), 13);
                    assert.strictEqual(graph.size("edges"), 13);
                });

                await it("uses configured test plan data with hardcoded test plan ids", async () => {
                    options.jira.testPlanIssueKey = "CYP-42";
                    options.jira.fields.testPlan = "customfield_12345";
                    const graph = new ExecutableGraph<Command>();
                    await afterRun.addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        new SimpleIterationParameterCollection(),
                        graph,
                        LOG
                    );
                    // Vertices.
                    const commands = [...graph.getVertices()];
                    const testPlanIdCommand = commands[0];
                    const convertCommand = commands[4];
                    assertIsInstanceOf(testPlanIdCommand, ConstantCommand);
                    // Vertex data.
                    assert.strictEqual(testPlanIdCommand.getValue(), "customfield_12345");
                    // Edges.
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(testPlanIdCommand)],
                        [convertCommand]
                    );
                    assert.strictEqual(graph.size("vertices"), 12);
                    assert.strictEqual(graph.size("edges"), 12);
                });

                await it("uses configured test environment data", async () => {
                    options.xray.testEnvironments = ["DEV"];
                    const graph = new ExecutableGraph<Command>();
                    await afterRun.addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        new SimpleIterationParameterCollection(),
                        graph,
                        LOG
                    );
                    // Vertices.
                    const commands = [...graph.getVertices()];
                    const fetchAllFieldsCommand = commands[0];
                    const testEnvironmentsIdCommand = commands[1];
                    const convertCommand = commands[5];
                    assertIsInstanceOf(fetchAllFieldsCommand, FetchAllFieldsCommand);
                    assertIsInstanceOf(testEnvironmentsIdCommand, ExtractFieldIdCommand);
                    // Vertex data.
                    assert.deepStrictEqual(fetchAllFieldsCommand.getParameters(), {
                        jiraClient: clients.jiraClient,
                    });
                    assert.deepStrictEqual(testEnvironmentsIdCommand.getParameters(), {
                        field: JiraField.TEST_ENVIRONMENTS,
                    });
                    // Edges.
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(fetchAllFieldsCommand)],
                        [testEnvironmentsIdCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(testEnvironmentsIdCommand)],
                        [convertCommand]
                    );
                    assert.strictEqual(graph.size("vertices"), 13);
                    assert.strictEqual(graph.size("edges"), 13);
                });

                await it("uses configured test environment data with hardcoded test environment ids", async () => {
                    options.xray.testEnvironments = ["DEV"];
                    options.jira.fields.testEnvironments = "customfield_67890";
                    const graph = new ExecutableGraph<Command>();
                    await afterRun.addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        new SimpleIterationParameterCollection(),
                        graph,
                        LOG
                    );
                    // Vertices.
                    const commands = [...graph.getVertices()];
                    const testEnvironmentsIdCommand = commands[0];
                    const convertCommand = commands[4];
                    assertIsInstanceOf(testEnvironmentsIdCommand, ConstantCommand);
                    // Vertex data.
                    assert.strictEqual(testEnvironmentsIdCommand.getValue(), "customfield_67890");
                    // Edges.
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(testEnvironmentsIdCommand)],
                        [convertCommand]
                    );
                    assert.strictEqual(graph.size("vertices"), 12);
                    assert.strictEqual(graph.size("edges"), 12);
                });

                await it("uses configured test plan and environment data", async () => {
                    options.jira.testPlanIssueKey = "CYP-42";
                    options.xray.testEnvironments = ["DEV"];
                    const graph = new ExecutableGraph<Command>();
                    await afterRun.addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        new SimpleIterationParameterCollection(),
                        graph,
                        LOG
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
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(fetchAllFieldsCommand)],
                        [testPlanIdCommand, testEnvironmentsIdCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(testPlanIdCommand)],
                        [convertCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(testEnvironmentsIdCommand)],
                        [convertCommand]
                    );
                    assert.strictEqual(graph.size("vertices"), 14);
                    assert.strictEqual(graph.size("edges"), 15);
                });

                await it("uses configured test plan and environment data with hardcoded ids", async () => {
                    options.jira.testPlanIssueKey = "CYP-42";
                    options.jira.fields.testPlan = "customfield_12345";
                    options.xray.testEnvironments = ["DEV"];
                    options.jira.fields.testEnvironments = "customfield_67890";
                    const graph = new ExecutableGraph<Command>();
                    await afterRun.addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        new SimpleIterationParameterCollection(),
                        graph,
                        LOG
                    );
                    // Vertices.
                    const commands = [...graph.getVertices()];
                    const testPlanIdCommand = commands[0];
                    const testEnvironmentsIdCommand = commands[1];
                    const convertCommand = commands[5];
                    assertIsInstanceOf(testPlanIdCommand, ConstantCommand);
                    assertIsInstanceOf(testEnvironmentsIdCommand, ConstantCommand);
                    // Vertex data.
                    assert.strictEqual(testPlanIdCommand.getValue(), "customfield_12345");
                    assert.strictEqual(testEnvironmentsIdCommand.getValue(), "customfield_67890");
                    // Edges.
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(testPlanIdCommand)],
                        [convertCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(testEnvironmentsIdCommand)],
                        [convertCommand]
                    );
                    assert.strictEqual(graph.size("vertices"), 13);
                    assert.strictEqual(graph.size("edges"), 13);
                });
            });

            await describe("cloud", async () => {
                beforeEach(() => {
                    clients.kind = "cloud";
                });

                await it("adds commands necessary for cucumber results upload", async () => {
                    const graph = new ExecutableGraph<Command>();
                    await afterRun.addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        new SimpleIterationParameterCollection(),
                        graph,
                        LOG
                    );
                    // Vertices.
                    const commands = [...graph.getVertices()];
                    const issuetypeCommand = commands[2];
                    const convertCommand = commands[3];
                    const convertCucumberFeaturesCommand = commands[5];
                    assertIsInstanceOf(issuetypeCommand, ConstantCommand);
                    assertIsInstanceOf(convertCommand, ConvertInfoCloudCommand);
                    assert.deepStrictEqual(issuetypeCommand.getValue(), {
                        name: "Test Execution",
                    });
                    assert.deepStrictEqual(convertCommand.getParameters(), {
                        jira: {
                            projectKey: options.jira.projectKey,
                            testPlanIssueKey: undefined,
                        },
                        xray: options.xray,
                    });
                    assert.deepStrictEqual(convertCucumberFeaturesCommand.getParameters(), {
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
                    assert.strictEqual(graph.size("vertices"), 11);
                });

                await it("uses configured test execution issue data", async () => {
                    const graph = new ExecutableGraph<Command>();
                    options.jira.testExecutionIssue = {
                        fields: {
                            issuetype: {
                                name: "Test Run",
                            },
                        },
                        key: "CYP-42",
                    };
                    await afterRun.addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        new SimpleIterationParameterCollection(),
                        graph,
                        LOG
                    );
                    // Vertices.
                    const [
                        cypressResultsCommand,
                        issueUpdateCommand,
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
                    assertIsInstanceOf(issueUpdateCommand, ConstantCommand);
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
                    assert.deepStrictEqual(cypressResultsCommand.getValue(), cypressResult);
                    assert.deepStrictEqual(issueUpdateCommand.getValue(), {
                        fields: {
                            issuetype: {
                                name: "Test Run",
                            },
                        },
                        key: "CYP-42",
                    });
                    assert.deepStrictEqual(cucumberResultsCommand.getValue(), cucumberResult);
                    assert.deepStrictEqual(testExecutionIssueKeyCommand.getValue(), "CYP-42");
                    assert.deepStrictEqual(issuetypeCommand.getValue(), {
                        name: "Test Run",
                    });
                    assert.deepStrictEqual(issueKeysCommand.getValue(), ["CYP-42"]);
                    assert.deepStrictEqual(getSummaryValuesCommand.getParameters(), {
                        jiraClient: clients.jiraClient,
                    });
                    assert.deepStrictEqual(destructureCommand.getParameters(), {
                        accessor: "CYP-42",
                    });
                    assert.deepStrictEqual(convertInfoCloudCommand.getParameters(), {
                        jira: {
                            projectKey: options.jira.projectKey,
                            testPlanIssueKey: undefined,
                        },
                        xray: options.xray,
                    });
                    assert.deepStrictEqual(convertCucumberFeaturesCommand.getParameters(), {
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
                    assert.deepStrictEqual(importCucumberExecutionCommand.getParameters(), {
                        xrayClient: clients.xrayClient,
                    });
                    assert.deepStrictEqual(verifyExecutionIssueKeyCommand.getParameters(), {
                        displayCloudHelp: true,
                        importType: "cucumber",
                        testExecutionIssueKey: "CYP-42",
                        testExecutionIssueType: { name: "Test Run" },
                    });
                    // Edges.
                    assert.ok(
                        [...graph.getSuccessors(cypressResultsCommand)].includes(
                            convertInfoCloudCommand
                        )
                    );
                    assert.ok(
                        [...graph.getSuccessors(issueUpdateCommand)].includes(
                            convertInfoCloudCommand
                        )
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(cucumberResultsCommand)],
                        [convertCucumberFeaturesCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(testExecutionIssueKeyCommand)],
                        [convertCucumberFeaturesCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(issuetypeCommand)],
                        [convertInfoCloudCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(issueKeysCommand)],
                        [getSummaryValuesCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(getSummaryValuesCommand)],
                        [destructureCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(destructureCommand)],
                        [convertInfoCloudCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(convertInfoCloudCommand)],
                        [combineCucumberMultipartCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(convertCucumberFeaturesCommand)],
                        [combineCucumberMultipartCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(combineCucumberMultipartCommand)],
                        [assertConversionValidCommand, importCucumberExecutionCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(assertConversionValidCommand)],
                        [importCucumberExecutionCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(importCucumberExecutionCommand)],
                        [verifyExecutionIssueKeyCommand, fallbackCucumberUploadCommand]
                    );
                    assert.deepStrictEqual(
                        [...graph.getSuccessors(fallbackCucumberUploadCommand)],
                        [verifyResultsUploadCommand]
                    );
                    assert.strictEqual(graph.size("vertices"), 16);
                    assert.strictEqual(graph.size("edges"), 16);
                });
            });

            await it("throws if the cucumber report was not configured", async () => {
                const graph = new ExecutableGraph<Command>();
                const preprocessorOptions = options.cucumber as InternalCucumberOptions;
                preprocessorOptions.preprocessor = undefined;
                await assert.rejects(
                    afterRun.addUploadCommands(
                        cypressResult,
                        ".",
                        options,
                        clients,
                        new SimpleEvidenceCollection(),
                        new SimpleIterationParameterCollection(),
                        graph,
                        LOG
                    ),
                    {
                        message:
                            "Failed to prepare Cucumber upload: Cucumber preprocessor JSON report path not configured.",
                    }
                );
            });

            await it("does not add any commands if neither cypress nor cucumber results exist", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                cypressResult.runs = [];
                const graph = new ExecutableGraph<Command>();
                await afterRun.addUploadCommands(
                    cypressResult,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    new SimpleIterationParameterCollection(),
                    graph,
                    LOG
                );
                assert.strictEqual(graph.size("vertices"), 0);
                assert.strictEqual(graph.size("edges"), 0);
                assert.deepStrictEqual(message.mock.calls[0].arguments, [
                    "warning",
                    "No test execution results to upload, skipping results upload preparations.",
                ]);
            });

            await it("adds connections from feature file imports to execution uploads", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
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
                graph.place(
                    new ImportFeatureCommand(
                        {
                            filePath: relative(".", "cypress/e2e/outline.cy.feature"),
                            xrayClient: clients.xrayClient,
                        },
                        LOG
                    )
                );
                graph.place(
                    new ImportFeatureCommand(
                        {
                            filePath: relative(".", "cypress/e2e/spec.cy.feature"),
                            xrayClient: clients.xrayClient,
                        },
                        LOG
                    )
                );
                graph.place(
                    new ImportFeatureCommand(
                        {
                            filePath: relative(".", "cypress/e2e/nonexistent.cy.feature"),
                            xrayClient: clients.xrayClient,
                        },
                        LOG
                    )
                );
                await afterRun.addUploadCommands(
                    cypressResult,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    new SimpleIterationParameterCollection(),
                    graph,
                    LOG
                );
                // Vertices.
                const commands = [...graph.getVertices()];
                const importFeatureCommand1 = commands[0];
                const importFeatureCommand2 = commands[1];
                const importFeatureCommand3 = commands[2];
                const importCucumberExecutionCommand = commands[11];
                // Edges.
                assert.ok(
                    [...graph.getSuccessors(importFeatureCommand1)].includes(
                        importCucumberExecutionCommand
                    )
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(importFeatureCommand2)],
                    [importCucumberExecutionCommand]
                );
                assert.deepStrictEqual([...graph.getSuccessors(importFeatureCommand3)], []);
                assert.strictEqual(graph.size("vertices"), 14);
                assert.strictEqual(graph.size("edges"), 13);
            });
        });

        await describe("mixed", async () => {
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

            await it("adds commands necessary for mixed results upload", async (context) => {
                context.mock.timers.enable({ apis: ["Date"] });
                context.mock.timers.tick(12345);
                const graph = new ExecutableGraph<Command>();
                await afterRun.addUploadCommands(
                    cypressResult,
                    ".",
                    options,
                    clients,
                    new SimpleEvidenceCollection(),
                    new SimpleIterationParameterCollection(),
                    graph,
                    LOG
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
                assert.deepStrictEqual(cypressResultsCommand.getValue(), cypressResult);
                assert.deepStrictEqual(convertCypressTestsCommand.getParameters(), {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: ".feature",
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
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
                assert.deepStrictEqual(
                    issueSummaryCommand.getValue(),
                    "Execution Results [2023-07-23T21:26:15.539Z]"
                );
                assert.deepStrictEqual(issuetypeCommand.getValue(), {
                    name: "Test Execution",
                });
                assert.deepStrictEqual(convertInfoServerCommand.getParameters(), {
                    jira: {
                        projectKey: options.jira.projectKey,
                        testPlanIssueKey: undefined,
                    },
                    xray: options.xray,
                });
                assert.deepStrictEqual(combineCypressJsonCommand.getParameters(), {
                    testExecutionIssueKey: undefined,
                });
                assert.deepStrictEqual(importExecutionCypressCommand.getParameters(), {
                    splitUpload: false,
                    xrayClient: clients.xrayClient,
                });
                assert.deepStrictEqual(cucumberResultsCommand.getValue(), cucumberResult);
                assert.deepStrictEqual(fallbackCypressUploadCommand.getParameters(), {
                    fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
                    fallbackValue: undefined,
                });
                assert.deepStrictEqual(convertCucumberFeaturesCommand.getParameters(), {
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
                assert.deepStrictEqual(importCucumberExecutionCommand.getParameters(), {
                    xrayClient: clients.xrayClient,
                });
                assert.deepStrictEqual(fallbackCucumberUploadCommand.getParameters(), {
                    fallbackOn: [ComputableState.FAILED, ComputableState.SKIPPED],
                    fallbackValue: undefined,
                });
                assert.deepStrictEqual(verifyResultsUploadCommand.getParameters(), {
                    url: "http://localhost:1234",
                });
                // Edges.
                // Cypress.
                assert.deepStrictEqual(
                    [...graph.getSuccessors(cypressResultsCommand)],
                    [convertCypressTestsCommand, convertInfoServerCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(convertCypressTestsCommand)],
                    [combineCypressJsonCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(issueSummaryCommand)],
                    [convertInfoServerCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(issuetypeCommand)],
                    [convertInfoServerCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(convertInfoServerCommand)],
                    [combineCypressJsonCommand, combineCucumberMultipartCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(combineCypressJsonCommand)],
                    [assertCypressConversionValidCommand, importExecutionCypressCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(assertCypressConversionValidCommand)],
                    [importExecutionCypressCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(importExecutionCypressCommand)],
                    [convertCucumberFeaturesCommand, fallbackCypressUploadCommand]
                );
                // Cucumber.
                assert.deepStrictEqual(
                    [...graph.getSuccessors(cucumberResultsCommand)],
                    [convertCucumberFeaturesCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(fallbackCypressUploadCommand)],
                    [verifyResultsUploadCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(convertCucumberFeaturesCommand)],
                    [combineCucumberMultipartCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(combineCucumberMultipartCommand)],
                    [assertCucumberConversionValidCommand, importCucumberExecutionCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(assertCucumberConversionValidCommand)],
                    [importCucumberExecutionCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(importCucumberExecutionCommand)],
                    [fallbackCucumberUploadCommand]
                );
                assert.deepStrictEqual(
                    [...graph.getSuccessors(fallbackCucumberUploadCommand)],
                    [verifyResultsUploadCommand]
                );
                assert.strictEqual(graph.size("vertices"), 16);
                assert.strictEqual(graph.size("edges"), 20);
            });
        });
    });
});
