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
            addSynchronizationCommands(file, options, clients, graph, logger);
            const commands = [...graph.getVertices()];
            assertIsInstanceOf(commands[0], ParseFeatureFileCommand);
            expect(commands[0].getParameters()).to.deep.eq({ filePath: "./path/to/file.feature" });
            assertIsInstanceOf(commands[1], ExtractFeatureFileIssuesCommand);
            expect(commands[1].getParameters()).to.deep.eq({
                displayCloudHelp: false,
                filePath: "./path/to/file.feature",
                prefixes: {
                    precondition: "Precondition:",
                    test: "TestName:",
                },
                projectKey: "CYP",
            });
            assertIsInstanceOf(commands[2], ExtractIssueKeysCommand);
            assertIsInstanceOf(commands[3], FetchAllFieldsCommand);
            assertIsInstanceOf(commands[4], ExtractFieldIdCommand);
            expect(commands[4].getParameters()).to.deep.eq({ field: JiraField.LABELS });
            assertIsInstanceOf(commands[5], GetSummaryValuesCommand);
            assertIsInstanceOf(commands[6], GetLabelValuesCommand);
            assertIsInstanceOf(commands[7], ImportFeatureCommand);
            expect(commands[7].getParameters()).to.deep.eq({
                filePath: "./path/to/file.feature",
                projectKey: "CYP",
                xrayClient: clients.xrayClient,
            });
            assertIsInstanceOf(commands[8], GetUpdatedIssuesCommand);
            assertIsInstanceOf(commands[9], GetSummaryValuesCommand);
            assertIsInstanceOf(commands[10], GetLabelValuesCommand);
            assertIsInstanceOf(commands[11], GetSummariesToResetCommand);
            assertIsInstanceOf(commands[12], GetLabelsToResetCommand);
            assertIsInstanceOf(commands[13], EditIssueFieldCommand);
            expect(commands[13].getParameters()).to.deep.eq({
                field: JiraField.SUMMARY,
                jiraClient: clients.jiraClient,
            });
            assertIsInstanceOf(commands[14], EditIssueFieldCommand);
            expect(commands[14].getParameters()).to.deep.eq({
                field: JiraField.LABELS,
                jiraClient: clients.jiraClient,
            });
            expect(graph.size("vertices")).to.eq(15);
        });

        it("correctly connects all commands", () => {
            const logger = getMockedLogger();
            const graph = new ExecutableGraph<Command>();
            addSynchronizationCommands(file, options, clients, graph, logger);
            const [
                parseFeatureFileCommand,
                extractIssueDataCommand,
                extractIssueKeysCommand,
                fetchAllFieldsCommand,
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
            expect([...graph.getPredecessors(getLabelsFieldIdCommand)]).to.deep.eq([
                fetchAllFieldsCommand,
            ]);
            expect([...graph.getPredecessors(getCurrentSummariesCommand)]).to.deep.eq([
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
                getSummariesToResetCommand,
            ]);
            expect([...graph.getPredecessors(editLabelsCommand)]).to.deep.eq([
                getLabelsFieldIdCommand,
                getLabelsToResetCommand,
            ]);
            expect(graph.size("edges")).to.eq(22);
        });

        it("reuses existing commands", () => {
            const logger = getMockedLogger();
            const graph = new ExecutableGraph<Command>();
            const fetchAllFieldsCommand = graph.place(
                new FetchAllFieldsCommand({ jiraClient: clients.jiraClient }, logger)
            );
            const getLabelsFieldIdCommand = graph.place(
                new ExtractFieldIdCommand(
                    { field: JiraField.LABELS },
                    logger,
                    fetchAllFieldsCommand
                )
            );
            graph.connect(fetchAllFieldsCommand, getLabelsFieldIdCommand);
            addSynchronizationCommands(file, options, clients, graph, logger);
            const commands = [...graph.getVertices()];
            const getCurrentLabelsCommand = commands[6];
            const getNewLabelsCommand = commands[10];
            const editLabelsCommand = commands[14];
            expect([...graph.getPredecessors(fetchAllFieldsCommand)]).to.deep.eq([]);
            expect([...graph.getSuccessors(fetchAllFieldsCommand)]).to.deep.eq([
                getLabelsFieldIdCommand,
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
            options.jira.fields.labels = "customfield_98765";
            addSynchronizationCommands(file, options, clients, graph, logger);
            const commands = [...graph.getVertices()];
            const extractIssueKeysCommand = commands[2];
            const constantLabelsFieldIdCommand = commands[3];
            const getCurrentSummariesCommand = commands[4];
            const getCurrentLabelsCommand = commands[5];
            const getUpdatedIssuesCommand = commands[7];
            const getNewSummariesCommand = commands[8];
            const getNewLabelsCommand = commands[9];
            assertIsInstanceOf(extractIssueKeysCommand, ExtractIssueKeysCommand);
            assertIsInstanceOf(constantLabelsFieldIdCommand, ConstantCommand);
            expect(constantLabelsFieldIdCommand.getValue()).to.eq("customfield_98765");
            expect([...graph.getPredecessors(getCurrentSummariesCommand)]).to.deep.eq([
                extractIssueKeysCommand,
            ]);
            expect([...graph.getPredecessors(getCurrentLabelsCommand)]).to.deep.eq([
                constantLabelsFieldIdCommand,
                extractIssueKeysCommand,
            ]);
            expect([...graph.getPredecessors(getNewSummariesCommand)]).to.deep.eq([
                extractIssueKeysCommand,
                getUpdatedIssuesCommand,
            ]);
            expect([...graph.getPredecessors(getNewLabelsCommand)]).to.deep.eq([
                constantLabelsFieldIdCommand,
                extractIssueKeysCommand,
                getUpdatedIssuesCommand,
            ]);
            expect(graph.size("vertices")).to.eq(14);
            expect(graph.size("edges")).to.eq(21);
        });
    });
});
