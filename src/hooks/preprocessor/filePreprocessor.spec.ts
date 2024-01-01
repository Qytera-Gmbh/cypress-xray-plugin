import { expect } from "chai";
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
import { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { ExecutableGraph } from "../../util/executable/executable";
import { Command } from "../command";
import { ConstantCommand } from "../util/commands/constantCommand";
import { EditIssueFieldCommand } from "../util/commands/jira/editIssueFieldCommand";
import { ExtractFieldIdCommand, JiraField } from "../util/commands/jira/extractFieldIdCommand";
import { FetchAllFieldsCommand } from "../util/commands/jira/fetchAllFieldsCommand";
import { GetLabelValuesCommand } from "../util/commands/jira/getLabelValuesCommand";
import { GetSummaryValuesCommand } from "../util/commands/jira/getSummaryValuesCommand";
import { ImportFeatureCommand } from "../util/commands/xray/importFeatureCommand";
import { ExtractFeatureFileIssuesCommand } from "./commands/extractFeatureFileIssuesCommand";
import { ExtractIssueKeysCommand } from "./commands/extractIssueKeysCommand";
import { GetLabelsToResetCommand } from "./commands/getLabelsToResetCommand";
import { GetSummariesToResetCommand } from "./commands/getSummariesToResetCommand";
import { GetUpdatedIssuesCommand } from "./commands/getUpdatedIssuesCommand";
import { ParseFeatureFileCommand } from "./commands/parseFeatureFileCommand";
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
            const commands = [...graph.getVertices()];
            assertIsInstanceOf(commands[0], ParseFeatureFileCommand);
            expect(commands[0].getFilePath()).to.eq("./path/to/file.feature");
            assertIsInstanceOf(commands[1], ExtractFeatureFileIssuesCommand);
            expect(commands[1].getProjectKey()).to.eq("CYP");
            expect(commands[1].getPrefixes()).to.deep.eq({
                test: "TestName:",
                precondition: "Precondition:",
            });
            assertIsInstanceOf(commands[2], ExtractIssueKeysCommand);
            assertIsInstanceOf(commands[3], FetchAllFieldsCommand);
            assertIsInstanceOf(commands[4], ExtractFieldIdCommand);
            expect(commands[4].getField()).to.eq(JiraField.SUMMARY);
            assertIsInstanceOf(commands[5], ExtractFieldIdCommand);
            expect(commands[5].getField()).to.eq(JiraField.LABELS);
            assertIsInstanceOf(commands[6], GetSummaryValuesCommand);
            assertIsInstanceOf(commands[7], GetLabelValuesCommand);
            assertIsInstanceOf(commands[8], ImportFeatureCommand);
            expect(commands[8].getFilePath()).to.eq(path.relative(".", "./path/to/file.feature"));
            expect(commands[8].getProjectKey()).to.eq("CYP");
            expect(commands[8].getProjectId()).to.be.undefined;
            expect(commands[8].getSource()).to.be.undefined;
            assertIsInstanceOf(commands[9], GetUpdatedIssuesCommand);
            assertIsInstanceOf(commands[10], GetSummaryValuesCommand);
            assertIsInstanceOf(commands[11], GetLabelValuesCommand);
            assertIsInstanceOf(commands[12], GetSummariesToResetCommand);
            assertIsInstanceOf(commands[13], GetLabelsToResetCommand);
            assertIsInstanceOf(commands[14], EditIssueFieldCommand);
            expect(commands[14].getField()).to.eq(JiraField.SUMMARY);
            assertIsInstanceOf(commands[15], EditIssueFieldCommand);
            expect(commands[15].getField()).to.eq(JiraField.LABELS);
        });

        it("correctly connects all commands", () => {
            const graph = new ExecutableGraph<Command>();
            addSynchronizationCommands(file, ".", options, clients, graph);
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
            const graph = new ExecutableGraph<Command>();
            const fetchAllFieldsCommand = graph.place(
                new FetchAllFieldsCommand(clients.jiraClient)
            );
            const getSummaryFieldIdCommand = graph.place(
                new ExtractFieldIdCommand(JiraField.SUMMARY, fetchAllFieldsCommand)
            );
            const getLabelsFieldIdCommand = graph.place(
                new ExtractFieldIdCommand(JiraField.LABELS, fetchAllFieldsCommand)
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

        it("uses preconfigured jira field ids", () => {
            const graph = new ExecutableGraph<Command>();
            options.jira.fields.summary = "customfield_12345";
            options.jira.fields.labels = "customfield_98765";
            addSynchronizationCommands(file, ".", options, clients, graph);
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
