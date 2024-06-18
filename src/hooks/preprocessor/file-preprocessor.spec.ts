import { expect } from "chai";
import path from "path";
import { getMockedJiraClient, getMockedLogger, getMockedXrayClient } from "../../../test/mocks";
import { assertIsInstanceOf } from "../../../test/util";
import {
    initCucumberOptions,
    initJiraOptions,
    initPluginOptions,
    initXrayOptions,
} from "../../context";
import { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { ExecutableGraph } from "../../util/graph/executable-graph";
import { Command } from "../command";
import { ConstantCommand } from "../util/commands/constant-command";
import { EditIssueFieldCommand } from "../util/commands/jira/edit-issue-field-command";
import { ExtractFieldIdCommand, JiraField } from "../util/commands/jira/extract-field-id-command";
import { FetchAllFieldsCommand } from "../util/commands/jira/fetch-all-fields-command";
import { GetLabelValuesCommand } from "../util/commands/jira/get-label-values-command";
import { GetSummaryValuesCommand } from "../util/commands/jira/get-summary-values-command";
import { ImportFeatureCommand } from "../util/commands/xray/import-feature-command";
import { ExtractFeatureFileIssuesCommand } from "./commands/extract-feature-file-issues-command";
import { ExtractIssueKeysCommand } from "./commands/extract-issue-keys-command";
import { GetLabelsToResetCommand } from "./commands/get-labels-to-reset-command";
import { GetSummariesToResetCommand } from "./commands/get-summaries-to-reset-command";
import { GetUpdatedIssuesCommand } from "./commands/get-updated-issues-command";
import { ParseFeatureFileCommand } from "./commands/parse-feature-file-command";
import { addSynchronizationCommands } from "./file-preprocessor";

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
            http: {},
        };
        clients = {
            kind: "server",
            jiraClient: getMockedJiraClient(),
            xrayClient: getMockedXrayClient(),
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
            const logger = getMockedLogger();
            const graph = new ExecutableGraph<Command>();
            addSynchronizationCommands(file, ".", options, clients, graph, logger);
            expect(graph.size("vertices")).to.eq(16);
            const commands = [...graph.getVertices()];
            assertIsInstanceOf(commands[0], ParseFeatureFileCommand);
            expect(commands[0].getParameters()).to.deep.eq({ filePath: "./path/to/file.feature" });
            assertIsInstanceOf(commands[1], ExtractFeatureFileIssuesCommand);
            expect(commands[1].getParameters()).to.deep.eq({
                projectKey: "CYP",
                prefixes: {
                    test: "TestName:",
                    precondition: "Precondition:",
                },
                displayCloudHelp: false,
                filePath: "./path/to/file.feature",
            });
            assertIsInstanceOf(commands[2], ExtractIssueKeysCommand);
            assertIsInstanceOf(commands[3], FetchAllFieldsCommand);
            assertIsInstanceOf(commands[4], ExtractFieldIdCommand);
            expect(commands[4].getParameters()).to.deep.eq({ field: JiraField.SUMMARY });
            assertIsInstanceOf(commands[5], ExtractFieldIdCommand);
            expect(commands[5].getParameters()).to.deep.eq({ field: JiraField.LABELS });
            assertIsInstanceOf(commands[6], GetSummaryValuesCommand);
            assertIsInstanceOf(commands[7], GetLabelValuesCommand);
            assertIsInstanceOf(commands[8], ImportFeatureCommand);
            expect(commands[8].getParameters()).to.deep.eq({
                xrayClient: clients.xrayClient,
                filePath: "./path/to/file.feature",
                projectKey: "CYP",
            });
            assertIsInstanceOf(commands[9], GetUpdatedIssuesCommand);
            assertIsInstanceOf(commands[10], GetSummaryValuesCommand);
            assertIsInstanceOf(commands[11], GetLabelValuesCommand);
            assertIsInstanceOf(commands[12], GetSummariesToResetCommand);
            assertIsInstanceOf(commands[13], GetLabelsToResetCommand);
            assertIsInstanceOf(commands[14], EditIssueFieldCommand);
            expect(commands[14].getParameters()).to.deep.eq({
                jiraClient: clients.jiraClient,
                field: JiraField.SUMMARY,
            });
            assertIsInstanceOf(commands[15], EditIssueFieldCommand);
            expect(commands[15].getParameters()).to.deep.eq({
                jiraClient: clients.jiraClient,
                field: JiraField.LABELS,
            });
        });

        it("correctly connects all commands", () => {
            const logger = getMockedLogger();
            const graph = new ExecutableGraph<Command>();
            addSynchronizationCommands(file, ".", options, clients, graph, logger);
            expect(graph.size("edges")).to.eq(26);
            const [
                parseFeatureFileCommand,
                extractIssueDataCommand,
                extractIssueKeysCommand,
                fetchAllFieldsCommand,
                getSummaryFieldIdCommand,
                getLabelsFieldIdCommand,
                getCurrentSummariesCommand,
                getCurrentLabelsCommand,
                importFeatureCommand,
                getUpdatedIssuesCommand,
                getNewSummariesCommand,
                getNewLabelsCommand,
                getSummariesToResetCommand,
                getLabelsToResetCommand,
                editSummariesCommand,
                editLabelsCommand,
            ] = [...graph.getVertices()];
            expect([...graph.getPredecessors(parseFeatureFileCommand)]).to.deep.eq([]);
            expect([...graph.getPredecessors(extractIssueDataCommand)]).to.deep.eq([
                parseFeatureFileCommand,
            ]);
            expect([...graph.getPredecessors(extractIssueKeysCommand)]).to.deep.eq([
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
                extractIssueKeysCommand,
            ]);
            expect([...graph.getPredecessors(getCurrentLabelsCommand)]).to.deep.eq([
                getLabelsFieldIdCommand,
                extractIssueKeysCommand,
            ]);
            expect([...graph.getPredecessors(importFeatureCommand)]).to.deep.eq([
                getCurrentSummariesCommand,
                getCurrentLabelsCommand,
            ]);
            expect([...graph.getPredecessors(getUpdatedIssuesCommand)]).to.deep.eq([
                extractIssueKeysCommand,
                importFeatureCommand,
            ]);
            expect([...graph.getPredecessors(getNewSummariesCommand)]).to.deep.eq([
                getSummaryFieldIdCommand,
                extractIssueKeysCommand,
                getUpdatedIssuesCommand,
            ]);
            expect([...graph.getPredecessors(getNewLabelsCommand)]).to.deep.eq([
                getLabelsFieldIdCommand,
                extractIssueKeysCommand,
                getUpdatedIssuesCommand,
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

        it("reuses existing commands", () => {
            const logger = getMockedLogger();
            const graph = new ExecutableGraph<Command>();
            const fetchAllFieldsCommand = graph.place(
                new FetchAllFieldsCommand({ jiraClient: clients.jiraClient }, logger)
            );
            const getSummaryFieldIdCommand = graph.place(
                new ExtractFieldIdCommand(
                    { field: JiraField.SUMMARY },
                    logger,
                    fetchAllFieldsCommand
                )
            );
            const getLabelsFieldIdCommand = graph.place(
                new ExtractFieldIdCommand(
                    { field: JiraField.LABELS },
                    logger,
                    fetchAllFieldsCommand
                )
            );
            graph.connect(fetchAllFieldsCommand, getSummaryFieldIdCommand);
            graph.connect(fetchAllFieldsCommand, getLabelsFieldIdCommand);
            addSynchronizationCommands(file, ".", options, clients, graph, logger);
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

        it("uses preconfigured jira field ids", () => {
            const logger = getMockedLogger();
            const graph = new ExecutableGraph<Command>();
            options.jira.fields.summary = "customfield_12345";
            options.jira.fields.labels = "customfield_98765";
            addSynchronizationCommands(file, ".", options, clients, graph, logger);
            expect(graph.size("vertices")).to.eq(15);
            const commands = [...graph.getVertices()];
            const extractIssueKeysCommand = commands[2];
            const constantSummaryFieldIdCommand = commands[3];
            const constantLabelsFieldIdCommand = commands[4];
            const getCurrentSummariesCommand = commands[5];
            const getCurrentLabelsCommand = commands[6];
            const getUpdatedIssuesCommand = commands[8];
            const getNewSummariesCommand = commands[9];
            const getNewLabelsCommand = commands[10];
            assertIsInstanceOf(extractIssueKeysCommand, ExtractIssueKeysCommand);
            assertIsInstanceOf(constantSummaryFieldIdCommand, ConstantCommand);
            expect(constantSummaryFieldIdCommand.getValue()).to.eq("customfield_12345");
            assertIsInstanceOf(constantLabelsFieldIdCommand, ConstantCommand);
            expect(constantLabelsFieldIdCommand.getValue()).to.eq("customfield_98765");
            expect(graph.size("edges")).to.eq(24);
            expect([...graph.getPredecessors(getCurrentSummariesCommand)]).to.deep.eq([
                constantSummaryFieldIdCommand,
                extractIssueKeysCommand,
            ]);
            expect([...graph.getPredecessors(getCurrentLabelsCommand)]).to.deep.eq([
                constantLabelsFieldIdCommand,
                extractIssueKeysCommand,
            ]);
            expect([...graph.getPredecessors(getNewSummariesCommand)]).to.deep.eq([
                constantSummaryFieldIdCommand,
                extractIssueKeysCommand,
                getUpdatedIssuesCommand,
            ]);
            expect([...graph.getPredecessors(getNewLabelsCommand)]).to.deep.eq([
                constantLabelsFieldIdCommand,
                extractIssueKeysCommand,
                getUpdatedIssuesCommand,
            ]);
        });
    });
});
