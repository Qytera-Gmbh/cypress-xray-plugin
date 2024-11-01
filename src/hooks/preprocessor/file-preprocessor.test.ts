import { expect } from "chai";
import { describe, it } from "node:test";
import path from "path";
import { getMockedJiraClient, getMockedLogger, getMockedXrayClient } from "../../../test/mocks.js";
import { assertIsInstanceOf } from "../../../test/util.js";
import {
    initCucumberOptions,
    initJiraOptions,
    initPluginOptions,
    initXrayOptions,
} from "../../context.js";
import type { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin.js";
import { ExecutableGraph } from "../../util/graph/executable-graph.js";
import type { Command } from "../command.js";
import { EditIssueFieldCommand } from "../util/commands/jira/edit-issue-field-command.js";
import { GetLabelValuesCommand } from "../util/commands/jira/get-label-values-command.js";
import { GetSummaryValuesCommand } from "../util/commands/jira/get-summary-values-command.js";
import { ImportFeatureCommand } from "../util/commands/xray/import-feature-command.js";
import { ExtractFeatureFileIssuesCommand } from "./commands/extract-feature-file-issues-command.js";
import { ExtractIssueKeysCommand } from "./commands/extract-issue-keys-command.js";
import { GetLabelsToResetCommand } from "./commands/get-labels-to-reset-command.js";
import { GetSummariesToResetCommand } from "./commands/get-summaries-to-reset-command.js";
import { GetUpdatedIssuesCommand } from "./commands/get-updated-issues-command.js";
import { ParseFeatureFileCommand } from "./commands/parse-feature-file-command.js";
import { addSynchronizationCommands } from "./file-preprocessor.js";

await describe(path.relative(process.cwd(), import.meta.filename), async () => {
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

    await describe(addSynchronizationCommands.name, async () => {
        const file = {
            ...({} as Cypress.FileObject),
            filePath: "./path/to/file.feature",
            outputPath: "no.idea",
            shouldWatch: false,
        };

        await it("adds all commands necessary for feature file upload", () => {
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
            assertIsInstanceOf(commands[3], GetSummaryValuesCommand);
            assertIsInstanceOf(commands[4], GetLabelValuesCommand);
            assertIsInstanceOf(commands[5], ImportFeatureCommand);
            expect(commands[5].getParameters()).to.deep.eq({
                filePath: "./path/to/file.feature",
                projectKey: "CYP",
                xrayClient: clients.xrayClient,
            });
            assertIsInstanceOf(commands[6], GetUpdatedIssuesCommand);
            assertIsInstanceOf(commands[7], GetSummaryValuesCommand);
            assertIsInstanceOf(commands[8], GetLabelValuesCommand);
            assertIsInstanceOf(commands[9], GetSummariesToResetCommand);
            assertIsInstanceOf(commands[10], GetLabelsToResetCommand);
            assertIsInstanceOf(commands[11], EditIssueFieldCommand);
            expect(commands[11].getParameters()).to.deep.eq({
                fieldId: "summary",
                jiraClient: clients.jiraClient,
            });
            assertIsInstanceOf(commands[12], EditIssueFieldCommand);
            expect(commands[12].getParameters()).to.deep.eq({
                fieldId: "labels",
                jiraClient: clients.jiraClient,
            });
            expect(graph.size("vertices")).to.eq(13);
        });

        await it("correctly connects all commands", () => {
            const logger = getMockedLogger();
            const graph = new ExecutableGraph<Command>();
            addSynchronizationCommands(file, options, clients, graph, logger);
            const [
                parseFeatureFileCommand,
                extractIssueDataCommand,
                extractIssueKeysCommand,
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
            expect([...graph.getPredecessors(getCurrentSummariesCommand)]).to.deep.eq([
                extractIssueKeysCommand,
            ]);
            expect([...graph.getPredecessors(getCurrentLabelsCommand)]).to.deep.eq([
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
                getLabelsToResetCommand,
            ]);
            expect(graph.size("edges")).to.eq(18);
        });

        await it("reuses existing commands", () => {
            const logger = getMockedLogger();
            const graph = new ExecutableGraph<Command>();
            const parseFeatureFileCommand = graph.place(
                new ParseFeatureFileCommand({ filePath: "./path/to/file.feature" }, logger)
            );
            addSynchronizationCommands(file, options, clients, graph, logger);
            const commands = [...graph.getVertices()];
            const extractIssueDataCommand = commands[1];
            expect([...graph.getPredecessors(extractIssueDataCommand)]).to.deep.eq([
                parseFeatureFileCommand,
            ]);
        });

        await it("uses preconfigured jira field ids", () => {
            const logger = getMockedLogger();
            const graph = new ExecutableGraph<Command>();
            addSynchronizationCommands(file, options, clients, graph, logger);
            const commands = [...graph.getVertices()];
            const extractIssueKeysCommand = commands[2];
            const getCurrentSummariesCommand = commands[3];
            const getCurrentLabelsCommand = commands[4];
            const getUpdatedIssuesCommand = commands[6];
            const getNewSummariesCommand = commands[7];
            const getNewLabelsCommand = commands[8];
            assertIsInstanceOf(extractIssueKeysCommand, ExtractIssueKeysCommand);
            expect([...graph.getPredecessors(getCurrentSummariesCommand)]).to.deep.eq([
                extractIssueKeysCommand,
            ]);
            expect([...graph.getPredecessors(getCurrentLabelsCommand)]).to.deep.eq([
                extractIssueKeysCommand,
            ]);
            expect([...graph.getPredecessors(getNewSummariesCommand)]).to.deep.eq([
                extractIssueKeysCommand,
                getUpdatedIssuesCommand,
            ]);
            expect([...graph.getPredecessors(getNewLabelsCommand)]).to.deep.eq([
                extractIssueKeysCommand,
                getUpdatedIssuesCommand,
            ]);
            expect(graph.size("vertices")).to.eq(13);
            expect(graph.size("edges")).to.eq(18);
        });
    });
});
