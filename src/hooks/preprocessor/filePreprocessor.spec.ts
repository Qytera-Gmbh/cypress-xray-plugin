import { expect } from "chai";
import path from "path";
import {
    getMockedJiraClient,
    getMockedJiraRepository,
    getMockedLogger,
    getMockedXrayClient,
} from "../../../test/mocks";
import { assertIsInstanceOf } from "../../../test/util";
import { Command } from "../../commands/command";
import { ExtractFeatureFileIssuesCommand } from "../../commands/cucumber/extractFeatureFileIssuesCommand";
import { ParseFeatureFileCommand } from "../../commands/cucumber/parseFeatureFileCommand";
import { ApplyFunctionCommand } from "../../commands/functionCommand";
import { EditIssueFieldCommand } from "../../commands/jira/fields/editIssueFieldCommand";
import { ExtractFieldIdCommand } from "../../commands/jira/fields/extractFieldIdCommand";
import { FetchAllFieldsCommand } from "../../commands/jira/fields/fetchAllFieldsCommand";
import { GetLabelValuesCommand } from "../../commands/jira/fields/getLabelValuesCommand";
import { GetSummaryValuesCommand } from "../../commands/jira/fields/getSummaryValuesCommand";
import { MergeCommand } from "../../commands/mergeCommand";
import { ImportFeatureCommand } from "../../commands/xray/importFeatureCommand";
import {
    initCucumberOptions,
    initJiraOptions,
    initPluginOptions,
    initSslOptions,
    initXrayOptions,
} from "../../context";
import { Level } from "../../logging/logging";
import { FeatureFileIssueData } from "../../preprocessing/preprocessing";
import { SupportedField } from "../../repository/jira/fields/jiraIssueFetcher";
import { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { StringMap } from "../../types/util";
import { ImportFeatureResponse } from "../../types/xray/responses/importFeature";
import { dedent } from "../../util/dedent";
import { ExecutableGraph } from "../../util/executable/executable";
import { addSynchronizationCommands } from "./filePreprocessor";

describe(path.relative(process.cwd(), __filename), () => {
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
            jiraRepository: getMockedJiraRepository(),
        };
    });

    describe(addSynchronizationCommands.name, () => {
        const file = {
            ...({} as Cypress.FileObject),
            filePath: "./path/to/file.feature",
            outputPath: "no.idea",
            shouldWatch: false,
        };

        it("adds all commands necessary for feature file upload", () => {
            const graph = new ExecutableGraph<Command>();
            addSynchronizationCommands(file, ".", options, clients, graph);
            expect(graph.size("vertices")).to.eq(16);
            expect(graph.size("edges")).to.eq(26);
            const [
                parseFeatureFileCommand,
                extractIssueDataCommand,
                gatherIssueKeysCommand,
                fetchAllFieldsCommand,
                getSummaryFieldIdCommand,
                getLabelsFieldIdCommand,
                getCurrentSummariesCommand,
                getCurrentLabelsCommand,
                importFeatureCommand,
                getKnownAffectedIssuesCommand,
                getNewSummariesCommand,
                getNewLabelsCommand,
                getSummariesToResetCommand,
                getLabelsToResetCommand,
                editSummariesCommand,
                editLabelsCommand,
            ] = [...graph.getVertices()];
            // Incoming command connections.
            expect([...graph.getPredecessors(parseFeatureFileCommand)]).to.deep.eq([]);
            expect([...graph.getPredecessors(extractIssueDataCommand)]).to.deep.eq([
                parseFeatureFileCommand,
            ]);
            expect([...graph.getPredecessors(gatherIssueKeysCommand)]).to.deep.eq([
                extractIssueDataCommand,
            ]);
            expect([...graph.getPredecessors(fetchAllFieldsCommand)]).to.deep.eq([]);
            expect([...graph.getPredecessors(getSummaryFieldIdCommand)]).to.deep.eq([
                fetchAllFieldsCommand,
            ]);
            expect([...graph.getPredecessors(getLabelsFieldIdCommand)]).to.deep.eq([
                fetchAllFieldsCommand,
            ]);
            expect([...graph.getPredecessors(getCurrentSummariesCommand)]).to.deep.eq([
                getSummaryFieldIdCommand,
                gatherIssueKeysCommand,
            ]);
            expect([...graph.getPredecessors(getCurrentLabelsCommand)]).to.deep.eq([
                getLabelsFieldIdCommand,
                gatherIssueKeysCommand,
            ]);
            expect([...graph.getPredecessors(importFeatureCommand)]).to.deep.eq([
                getCurrentSummariesCommand,
                getCurrentLabelsCommand,
            ]);
            expect([...graph.getPredecessors(getKnownAffectedIssuesCommand)]).to.deep.eq([
                gatherIssueKeysCommand,
                importFeatureCommand,
            ]);
            expect([...graph.getPredecessors(getNewSummariesCommand)]).to.deep.eq([
                getSummaryFieldIdCommand,
                gatherIssueKeysCommand,
                getKnownAffectedIssuesCommand,
            ]);
            expect([...graph.getPredecessors(getNewLabelsCommand)]).to.deep.eq([
                getLabelsFieldIdCommand,
                gatherIssueKeysCommand,
                getKnownAffectedIssuesCommand,
            ]);
            expect([...graph.getPredecessors(getSummariesToResetCommand)]).to.deep.eq([
                getCurrentSummariesCommand,
                getNewSummariesCommand,
            ]);
            expect([...graph.getPredecessors(getLabelsToResetCommand)]).to.deep.eq([
                getCurrentLabelsCommand,
                getNewLabelsCommand,
            ]);
            expect([...graph.getPredecessors(editSummariesCommand)]).to.deep.eq([
                getSummaryFieldIdCommand,
                getSummariesToResetCommand,
            ]);
            expect([...graph.getPredecessors(editLabelsCommand)]).to.deep.eq([
                getLabelsFieldIdCommand,
                getLabelsToResetCommand,
            ]);
        });

        describe("command values", () => {
            let graph = new ExecutableGraph<Command>();
            let commands: Command[] = [];

            beforeEach(() => {
                graph = new ExecutableGraph<Command>();
                addSynchronizationCommands(file, ".", options, clients, graph);
                commands = [...graph.getVertices()];
            });

            it(ParseFeatureFileCommand.name, () => {
                assertIsInstanceOf(commands[0], ParseFeatureFileCommand);
                expect(commands[0].getFilePath()).to.eq("./path/to/file.feature");
            });

            it(ExtractFeatureFileIssuesCommand.name, () => {
                assertIsInstanceOf(commands[1], ExtractFeatureFileIssuesCommand);
                expect(commands[1].getProjectKey()).to.eq("CYP");
                expect(commands[1].getPrefixes()).to.deep.eq({
                    test: "TestName:",
                    precondition: "Precondition:",
                });
            });

            describe(`${ApplyFunctionCommand.name} (gathering issues)`, () => {
                it("merges all issue keys into one array", () => {
                    assertIsInstanceOf(commands[2], ApplyFunctionCommand);
                    const data: FeatureFileIssueData = {
                        tests: [
                            { key: "CYP-123", summary: "Hello", tags: [] },
                            { key: "CYP-456", summary: "There", tags: ["some tag"] },
                            {
                                key: "CYP-789",
                                summary: "Guys",
                                tags: ["another tag", "and another one"],
                            },
                        ],
                        preconditions: [{ key: "CYP-001", summary: "Background" }],
                    };
                    expect(commands[2].getFunction()(data)).to.deep.eq([
                        "CYP-123",
                        "CYP-456",
                        "CYP-789",
                        "CYP-001",
                    ]);
                });
            });

            it(FetchAllFieldsCommand.name, () => {
                assertIsInstanceOf(commands[3], FetchAllFieldsCommand);
            });

            it(`${ExtractFieldIdCommand.name} (summary ID)`, () => {
                assertIsInstanceOf(commands[4], ExtractFieldIdCommand);
                expect(commands[4].getField()).to.eq(SupportedField.SUMMARY);
            });

            it(`${ExtractFieldIdCommand.name} (labels ID)`, () => {
                assertIsInstanceOf(commands[5], ExtractFieldIdCommand);
                expect(commands[5].getField()).to.eq(SupportedField.LABELS);
            });

            it(`${GetSummaryValuesCommand.name} (current summaries)`, () => {
                assertIsInstanceOf(commands[6], GetSummaryValuesCommand);
            });

            it(`${GetLabelValuesCommand.name} (current labels)`, () => {
                assertIsInstanceOf(commands[7], GetLabelValuesCommand);
            });

            it(ImportFeatureCommand.name, () => {
                assertIsInstanceOf(commands[8], ImportFeatureCommand);
                expect(commands[8].getFilePath()).to.eq(
                    path.relative(".", "./path/to/file.feature")
                );
                expect(commands[8].getProjectKey()).to.eq("CYP");
                expect(commands[8].getProjectId()).to.be.undefined;
                expect(commands[8].getSource()).to.be.undefined;
            });

            describe(`${MergeCommand.name} (merge affected issues)`, () => {
                it("returns all affected issues", () => {
                    assertIsInstanceOf(commands[9], MergeCommand);
                    const mergeFunction = commands[9].getMerger();
                    const data: ImportFeatureResponse = {
                        errors: [],
                        updatedOrCreatedIssues: ["CYP-123", "CYP-456", "CYP-789", "CYP-001"],
                    };
                    expect(
                        mergeFunction([["CYP-123", "CYP-456", "CYP-789", "CYP-001"], data])
                    ).to.deep.eq(["CYP-123", "CYP-456", "CYP-789", "CYP-001"]);
                });

                it("warns about unknown updated issues", () => {
                    assertIsInstanceOf(commands[9], MergeCommand);
                    const mergeFunction = commands[9].getMerger();
                    const logger = getMockedLogger();
                    const xrayClient = getMockedXrayClient();
                    xrayClient.importFeature.onFirstCall().resolves({
                        errors: [],
                        updatedOrCreatedIssues: ["CYP-536", "CYP-552"],
                    });
                    expect(
                        mergeFunction([
                            [],
                            {
                                errors: [],
                                updatedOrCreatedIssues: ["CYP-536", "CYP-552"],
                            },
                        ])
                    ).to.deep.eq([]);
                    expect(logger.message).to.have.been.calledWithExactly(
                        Level.WARNING,
                        dedent(`
                            Mismatch between feature file issue tags and updated Jira issues detected

                            Issues updated by Jira which are not present in feature file tags and might have been created:
                              CYP-536
                              CYP-552

                            Make sure that:
                            - All issues present in feature file tags belong to existing issues
                            - Your plugin tag prefix settings are consistent with the ones defined in Xray

                            More information:
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                        `)
                    );
                });

                it("warns about issues not updated by Jira", () => {
                    assertIsInstanceOf(commands[9], MergeCommand);
                    const mergeFunction = commands[9].getMerger();
                    const logger = getMockedLogger();
                    const xrayClient = getMockedXrayClient();
                    xrayClient.importFeature.onFirstCall().resolves({
                        errors: [],
                        updatedOrCreatedIssues: [],
                    });
                    expect(
                        mergeFunction([
                            ["CYP-123", "CYP-756"],
                            {
                                errors: [],
                                updatedOrCreatedIssues: [],
                            },
                        ])
                    ).to.deep.eq([]);
                    expect(logger.message).to.have.been.calledWithExactly(
                        Level.WARNING,
                        dedent(`
                            Mismatch between feature file issue tags and updated Jira issues detected

                            Issues contained in feature file tags which were not updated by Jira and might not exist:
                              CYP-123
                              CYP-756

                            Make sure that:
                            - All issues present in feature file tags belong to existing issues
                            - Your plugin tag prefix settings are consistent with the ones defined in Xray

                            More information:
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                        `)
                    );
                });

                it("warns about issue key mismatches", () => {
                    assertIsInstanceOf(commands[9], MergeCommand);
                    const mergeFunction = commands[9].getMerger();
                    const logger = getMockedLogger();
                    const xrayClient = getMockedXrayClient();
                    xrayClient.importFeature.onFirstCall().resolves({
                        errors: [],
                        updatedOrCreatedIssues: ["CYP-536", "CYP-552", "CYP-756"],
                    });
                    expect(
                        mergeFunction([
                            ["CYP-123", "CYP-756", "CYP-42"],
                            {
                                errors: [],
                                updatedOrCreatedIssues: ["CYP-536", "CYP-552", "CYP-756"],
                            },
                        ])
                    ).to.deep.eq(["CYP-756"]);
                    expect(logger.message).to.have.been.calledWithExactly(
                        Level.WARNING,
                        dedent(`
                            Mismatch between feature file issue tags and updated Jira issues detected

                            Issues contained in feature file tags which were not updated by Jira and might not exist:
                              CYP-123
                              CYP-42

                            Issues updated by Jira which are not present in feature file tags and might have been created:
                              CYP-536
                              CYP-552

                            Make sure that:
                            - All issues present in feature file tags belong to existing issues
                            - Your plugin tag prefix settings are consistent with the ones defined in Xray

                            More information:
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                        `)
                    );
                });
            });

            it(`${GetSummaryValuesCommand.name} (new summaries)`, () => {
                assertIsInstanceOf(commands[10], GetSummaryValuesCommand);
            });

            it(`${GetLabelValuesCommand.name} (new labels)`, () => {
                assertIsInstanceOf(commands[11], GetLabelValuesCommand);
            });

            describe(`${MergeCommand.name} (merge old/new summaries)`, () => {
                it("returns summaries of issues to reset", () => {
                    assertIsInstanceOf(commands[12], MergeCommand);
                    const mergeFunction = commands[12].getMerger();
                    const oldSummaries: StringMap<string> = {
                        ["CYP-123"]: "Old Summary",
                        ["CYP-456"]: "Old Summary Too",
                    };
                    const newSummaries: StringMap<string> = {
                        ["CYP-123"]: "New Summary",
                        ["CYP-456"]: "Old Summary Too",
                    };
                    expect(mergeFunction([oldSummaries, newSummaries])).to.deep.eq({
                        ["CYP-123"]: "Old Summary",
                    });
                });

                it("warns about unknown old summaries", () => {
                    assertIsInstanceOf(commands[12], MergeCommand);
                    const mergeFunction = commands[12].getMerger();
                    const logger = getMockedLogger();
                    const oldSummaries: StringMap<string> = {};
                    const newSummaries: StringMap<string> = {
                        ["CYP-123"]: "New Summary",
                    };
                    expect(mergeFunction([oldSummaries, newSummaries])).to.deep.eq({});
                    expect(logger.message).to.have.been.calledWithExactly(
                        Level.WARNING,
                        dedent(`
                            Skipping resetting summary of issue: CYP-123
                            The previous summary could not be fetched, make sure to manually restore it if needed
                        `)
                    );
                });
            });

            describe(`${MergeCommand.name} (merge old/new labels)`, () => {
                it("returns labels of issues to reset", () => {
                    assertIsInstanceOf(commands[13], MergeCommand);
                    const mergeFunction = commands[13].getMerger();
                    const oldLabels: StringMap<string[]> = {
                        ["CYP-123"]: ["a tag"],
                        ["CYP-456"]: ["tag 1", "tag 2"],
                        ["CYP-789"]: ["another tag"],
                    };
                    const newLabels: StringMap<string[]> = {
                        ["CYP-123"]: ["a tag"],
                        ["CYP-456"]: ["tag 2"],
                        ["CYP-789"]: [],
                    };
                    expect(mergeFunction([oldLabels, newLabels])).to.deep.eq({
                        ["CYP-456"]: ["tag 1", "tag 2"],
                        ["CYP-789"]: ["another tag"],
                    });
                });

                it("warns about unknown old labels", () => {
                    assertIsInstanceOf(commands[13], MergeCommand);
                    const mergeFunction = commands[13].getMerger();
                    const logger = getMockedLogger();
                    const oldLabels: StringMap<string[]> = {
                        ["CYP-789"]: ["another tag"],
                    };
                    const newLabels: StringMap<string[]> = {
                        ["CYP-123"]: ["a tag"],
                        ["CYP-456"]: ["tag 1", "tag 2"],
                        ["CYP-789"]: ["another tag"],
                    };
                    expect(mergeFunction([oldLabels, newLabels])).to.deep.eq({});
                    expect(logger.message).to.have.been.calledWithExactly(
                        Level.WARNING,
                        dedent(`
                            Skipping resetting labels of issue: CYP-123
                            The previous labels could not be fetched, make sure to manually restore them if needed
                        `)
                    );
                    expect(logger.message).to.have.been.calledWithExactly(
                        Level.WARNING,
                        dedent(`
                            Skipping resetting labels of issue: CYP-456
                            The previous labels could not be fetched, make sure to manually restore them if needed
                        `)
                    );
                });
            });

            it(`${EditIssueFieldCommand.name} (edit summaries)`, () => {
                assertIsInstanceOf(commands[14], EditIssueFieldCommand);
                expect(commands[14].getField()).to.eq(SupportedField.SUMMARY);
            });

            it(`${EditIssueFieldCommand.name} (edit labels)`, () => {
                assertIsInstanceOf(commands[15], EditIssueFieldCommand);
                expect(commands[15].getField()).to.eq(SupportedField.LABELS);
            });
        });
    });

    it("reuses existing commands", () => {
        const file = {
            ...({} as Cypress.FileObject),
            filePath: "./path/to/file.feature",
            outputPath: "no.idea",
            shouldWatch: false,
        };
        const graph = new ExecutableGraph<Command>();
        const fetchAllFieldsCommand = new FetchAllFieldsCommand(clients.jiraClient);
        const getSummaryFieldIdCommand = new ExtractFieldIdCommand(
            SupportedField.SUMMARY,
            fetchAllFieldsCommand
        );
        const getLabelsFieldIdCommand = new ExtractFieldIdCommand(
            SupportedField.LABELS,
            fetchAllFieldsCommand
        );
        graph.connect(fetchAllFieldsCommand, getSummaryFieldIdCommand);
        graph.connect(fetchAllFieldsCommand, getLabelsFieldIdCommand);
        addSynchronizationCommands(file, ".", options, clients, graph);
        const commands = [...graph.getVertices()];
        const getCurrentSummariesCommand = commands[6];
        const getCurrentLabelsCommand = commands[7];
        const getNewSummariesCommand = commands[10];
        const getNewLabelsCommand = commands[11];
        const editSummariesCommand = commands[14];
        const editLabelsCommand = commands[15];
        expect([...graph.getPredecessors(fetchAllFieldsCommand)]).to.deep.eq([]);
        expect([...graph.getSuccessors(fetchAllFieldsCommand)]).to.deep.eq([
            getSummaryFieldIdCommand,
            getLabelsFieldIdCommand,
        ]);
        expect([...graph.getPredecessors(getSummaryFieldIdCommand)]).to.deep.eq([
            fetchAllFieldsCommand,
        ]);
        expect([...graph.getSuccessors(getSummaryFieldIdCommand)]).to.deep.eq([
            getCurrentSummariesCommand,
            getNewSummariesCommand,
            editSummariesCommand,
        ]);
        expect([...graph.getPredecessors(getLabelsFieldIdCommand)]).to.deep.eq([
            fetchAllFieldsCommand,
        ]);
        expect([...graph.getSuccessors(getLabelsFieldIdCommand)]).to.deep.eq([
            getCurrentLabelsCommand,
            getNewLabelsCommand,
            editLabelsCommand,
        ]);
    });
});
