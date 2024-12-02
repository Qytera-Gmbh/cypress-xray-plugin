import axios from "axios";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import { assertIsInstanceOf } from "../../../test/util";
import { PatCredentials } from "../../client/authentication/credentials";
import { AxiosRestClient } from "../../client/https/https";
import { BaseJiraClient } from "../../client/jira/jira-client";
import { ServerClient } from "../../client/xray/xray-client-server";
import globalContext from "../../context";
import type { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { ExecutableGraph } from "../../util/graph/executable-graph";
import { LOG } from "../../util/logging";
import type { Command } from "../command";
import { EditIssueFieldCommand } from "../util/commands/jira/edit-issue-field-command";
import { GetLabelValuesCommand } from "../util/commands/jira/get-label-values-command";
import { GetSummaryValuesCommand } from "../util/commands/jira/get-summary-values-command";
import { ImportFeatureCommand } from "../util/commands/xray/import-feature-command";
import { ExtractFeatureFileIssuesCommand } from "./commands/extract-feature-file-issues-command";
import { ExtractIssueKeysCommand } from "./commands/extract-issue-keys-command";
import { GetLabelsToResetCommand } from "./commands/get-labels-to-reset-command";
import { GetSummariesToResetCommand } from "./commands/get-summaries-to-reset-command";
import { GetUpdatedIssuesCommand } from "./commands/get-updated-issues-command";
import { ParseFeatureFileCommand } from "./commands/parse-feature-file-command";
import filePreprocessor from "./file-preprocessor";

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

    await describe(filePreprocessor.addSynchronizationCommands.name, async () => {
        const file = {
            ...({} as Cypress.FileObject),
            filePath: "./path/to/file.feature",
            outputPath: "no.idea",
            shouldWatch: false,
        };

        await it("adds all commands necessary for feature file upload", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const graph = new ExecutableGraph<Command>();
            filePreprocessor.addSynchronizationCommands(file, options, clients, graph, LOG);
            const commands = [...graph.getVertices()];
            assertIsInstanceOf(commands[0], ParseFeatureFileCommand);
            assert.deepStrictEqual(commands[0].getParameters(), {
                filePath: "./path/to/file.feature",
            });
            assertIsInstanceOf(commands[1], ExtractFeatureFileIssuesCommand);
            assert.deepStrictEqual(commands[1].getParameters(), {
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
            assert.deepStrictEqual(commands[5].getParameters(), {
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
            assert.deepStrictEqual(commands[11].getParameters(), {
                fieldId: "summary",
                jiraClient: clients.jiraClient,
            });
            assertIsInstanceOf(commands[12], EditIssueFieldCommand);
            assert.deepStrictEqual(commands[12].getParameters(), {
                fieldId: "labels",
                jiraClient: clients.jiraClient,
            });
            assert.strictEqual(graph.size("vertices"), 13);
        });

        await it("correctly connects all commands", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const graph = new ExecutableGraph<Command>();
            filePreprocessor.addSynchronizationCommands(file, options, clients, graph, LOG);
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
            assert.deepStrictEqual([...graph.getPredecessors(parseFeatureFileCommand)], []);
            assert.deepStrictEqual(
                [...graph.getPredecessors(extractIssueDataCommand)],
                [parseFeatureFileCommand]
            );
            assert.deepStrictEqual(
                [...graph.getPredecessors(extractIssueKeysCommand)],
                [extractIssueDataCommand]
            );
            assert.deepStrictEqual(
                [...graph.getPredecessors(getCurrentSummariesCommand)],
                [extractIssueKeysCommand]
            );
            assert.deepStrictEqual(
                [...graph.getPredecessors(getCurrentLabelsCommand)],
                [extractIssueKeysCommand]
            );
            assert.deepStrictEqual(
                [...graph.getPredecessors(importFeatureCommand)],
                [getCurrentSummariesCommand, getCurrentLabelsCommand]
            );
            assert.deepStrictEqual(
                [...graph.getPredecessors(getUpdatedIssuesCommand)],
                [extractIssueKeysCommand, importFeatureCommand]
            );
            assert.deepStrictEqual(
                [...graph.getPredecessors(getNewSummariesCommand)],
                [extractIssueKeysCommand, getUpdatedIssuesCommand]
            );
            assert.deepStrictEqual(
                [...graph.getPredecessors(getNewLabelsCommand)],
                [extractIssueKeysCommand, getUpdatedIssuesCommand]
            );
            assert.deepStrictEqual(
                [...graph.getPredecessors(getSummariesToResetCommand)],
                [getCurrentSummariesCommand, getNewSummariesCommand]
            );
            assert.deepStrictEqual(
                [...graph.getPredecessors(getLabelsToResetCommand)],
                [getCurrentLabelsCommand, getNewLabelsCommand]
            );
            assert.deepStrictEqual(
                [...graph.getPredecessors(editSummariesCommand)],
                [getSummariesToResetCommand]
            );
            assert.deepStrictEqual(
                [...graph.getPredecessors(editLabelsCommand)],
                [getLabelsToResetCommand]
            );
            assert.strictEqual(graph.size("edges"), 18);
        });

        await it("reuses existing commands", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const graph = new ExecutableGraph<Command>();
            const parseFeatureFileCommand = graph.place(
                new ParseFeatureFileCommand({ filePath: "./path/to/file.feature" }, LOG)
            );
            filePreprocessor.addSynchronizationCommands(file, options, clients, graph, LOG);
            const commands = [...graph.getVertices()];
            const extractIssueDataCommand = commands[1];
            assert.deepStrictEqual(
                [...graph.getPredecessors(extractIssueDataCommand)],
                [parseFeatureFileCommand]
            );
        });

        await it("uses preconfigured jira field ids", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const graph = new ExecutableGraph<Command>();
            filePreprocessor.addSynchronizationCommands(file, options, clients, graph, LOG);
            const commands = [...graph.getVertices()];
            const extractIssueKeysCommand = commands[2];
            const getCurrentSummariesCommand = commands[3];
            const getCurrentLabelsCommand = commands[4];
            const getUpdatedIssuesCommand = commands[6];
            const getNewSummariesCommand = commands[7];
            const getNewLabelsCommand = commands[8];
            assertIsInstanceOf(extractIssueKeysCommand, ExtractIssueKeysCommand);
            assert.deepStrictEqual(
                [...graph.getPredecessors(getCurrentSummariesCommand)],
                [extractIssueKeysCommand]
            );
            assert.deepStrictEqual(
                [...graph.getPredecessors(getCurrentLabelsCommand)],
                [extractIssueKeysCommand]
            );
            assert.deepStrictEqual(
                [...graph.getPredecessors(getNewSummariesCommand)],
                [extractIssueKeysCommand, getUpdatedIssuesCommand]
            );
            assert.deepStrictEqual(
                [...graph.getPredecessors(getNewLabelsCommand)],
                [extractIssueKeysCommand, getUpdatedIssuesCommand]
            );
            assert.strictEqual(graph.size("vertices"), 13);
            assert.strictEqual(graph.size("edges"), 18);
        });
    });
});
