import { expect } from "chai";
import path from "path";
import {
    getMockedJiraClient,
    getMockedJiraRepository,
    getMockedXrayClient,
} from "../../../test/mocks";
import { assertIsInstanceOf } from "../../../test/util";
import { Command } from "../../commands/command";
import { ExtractFeatureFileIssuesCommand } from "../../commands/cucumber/extractFeatureFileIssuesCommand";
import { ParseFeatureFileCommand } from "../../commands/cucumber/parseFeatureFileCommand";
import { EditIssueFieldCommand } from "../../commands/jira/fields/editIssueFieldCommand";
import { ExtractFieldIdCommand } from "../../commands/jira/fields/extractFieldIdCommand";
import { FetchAllFieldsCommand } from "../../commands/jira/fields/fetchAllFieldsCommand";
import { GetLabelValuesCommand } from "../../commands/jira/fields/getLabelValuesCommand";
import { GetSummaryValuesCommand } from "../../commands/jira/fields/getSummaryValuesCommand";
import { MapCommand } from "../../commands/mapCommand";
import { MergeCommand } from "../../commands/mergeCommand";
import { ImportFeatureCommand } from "../../commands/xray/importFeatureCommand";
import {
    initCucumberOptions,
    initJiraOptions,
    initPluginOptions,
    initSslOptions,
    initXrayOptions,
} from "../../context";
import { SupportedField } from "../../repository/jira/fields/jiraIssueFetcher";
import { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { ExecutableGraph } from "../../util/executable/executable";
import {
    gatherAllIssueKeys,
    getActualAffectedIssueKeys,
    getLabelsToReset,
    getSummariesToReset,
} from "./commands";
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
        it("adds all commands necessary for feature file upload", () => {
            const file = {
                ...({} as Cypress.FileObject),
                filePath: "./path/to/file.feature",
                outputPath: "no.idea",
                shouldWatch: false,
            };
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
            assertIsInstanceOf(parseFeatureFileCommand, ParseFeatureFileCommand);
            assertIsInstanceOf(extractIssueDataCommand, ExtractFeatureFileIssuesCommand);
            assertIsInstanceOf(gatherIssueKeysCommand, MapCommand);
            assertIsInstanceOf(fetchAllFieldsCommand, FetchAllFieldsCommand);
            assertIsInstanceOf(getSummaryFieldIdCommand, ExtractFieldIdCommand);
            assertIsInstanceOf(getLabelsFieldIdCommand, ExtractFieldIdCommand);
            assertIsInstanceOf(getCurrentSummariesCommand, GetSummaryValuesCommand);
            assertIsInstanceOf(getCurrentLabelsCommand, GetLabelValuesCommand);
            assertIsInstanceOf(importFeatureCommand, ImportFeatureCommand);
            assertIsInstanceOf(getKnownAffectedIssuesCommand, MergeCommand);
            assertIsInstanceOf(getNewSummariesCommand, GetSummaryValuesCommand);
            assertIsInstanceOf(getNewLabelsCommand, GetLabelValuesCommand);
            assertIsInstanceOf(getSummariesToResetCommand, MergeCommand);
            assertIsInstanceOf(getLabelsToResetCommand, MergeCommand);
            assertIsInstanceOf(editSummariesCommand, EditIssueFieldCommand);
            assertIsInstanceOf(editLabelsCommand, EditIssueFieldCommand);
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
            // Command values.
            expect(parseFeatureFileCommand.getFilePath()).to.eq("./path/to/file.feature");
            expect(extractIssueDataCommand.getProjectKey()).to.eq("CYP");
            expect(extractIssueDataCommand.getPrefixes()).to.deep.eq({
                test: "TestName:",
                precondition: "Precondition:",
            });
            expect(gatherIssueKeysCommand.getMapper()).to.eq(gatherAllIssueKeys);
            expect(getSummaryFieldIdCommand.getField()).to.eq(SupportedField.SUMMARY);
            expect(getLabelsFieldIdCommand.getField()).to.eq(SupportedField.LABELS);
            expect(importFeatureCommand.getFilePath()).to.eq(
                path.relative(".", "./path/to/file.feature")
            );
            expect(importFeatureCommand.getProjectKey()).to.eq("CYP");
            expect(importFeatureCommand.getProjectId()).to.be.undefined;
            expect(importFeatureCommand.getSource()).to.be.undefined;
            expect(getKnownAffectedIssuesCommand.getMerger()).to.eq(getActualAffectedIssueKeys);
            expect(getSummariesToResetCommand.getMerger()).to.eq(getSummariesToReset);
            expect(getLabelsToResetCommand.getMerger()).to.eq(getLabelsToReset);
            expect(editSummariesCommand.getField()).to.eq(SupportedField.SUMMARY);
            expect(editLabelsCommand.getField()).to.eq(SupportedField.LABELS);
        });
    });
});
