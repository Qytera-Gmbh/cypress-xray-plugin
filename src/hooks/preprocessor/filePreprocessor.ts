import path from "path";
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
import { SupportedField } from "../../repository/jira/fields/jiraIssueFetcher";
import { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { ExecutableGraph } from "../../util/executable/executable";
import {
    gatherAllIssueKeys,
    getActualAffectedIssueKeys,
    getLabelsToReset,
    getSummariesToReset,
} from "./commands";

export function addSynchronizationCommands(
    file: Cypress.FileObject,
    projectRoot: string,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>
): void {
    const parseFeatureFileCommand = new ParseFeatureFileCommand(file.filePath);
    const extractIssueDataCommand = new ExtractFeatureFileIssuesCommand(
        options.jira.projectKey,
        options.cucumber?.prefixes,
        clients.kind === "cloud",
        parseFeatureFileCommand
    );
    graph.connect(parseFeatureFileCommand, extractIssueDataCommand);
    const gatherIssueKeysCommand = new ApplyFunctionCommand(
        gatherAllIssueKeys,
        extractIssueDataCommand
    );
    graph.connect(extractIssueDataCommand, gatherIssueKeysCommand);
    const fetchAllFieldsCommand = graph.findOrDefault(
        (vertex): vertex is FetchAllFieldsCommand => {
            return vertex instanceof FetchAllFieldsCommand;
        },
        () => new FetchAllFieldsCommand(clients.jiraClient)
    );
    const getSummaryFieldIdCommand = graph.findOrDefault(
        (command): command is ExtractFieldIdCommand => {
            return (
                command instanceof ExtractFieldIdCommand &&
                command.getField() === SupportedField.SUMMARY
            );
        },
        () => {
            const command = new ExtractFieldIdCommand(
                SupportedField.SUMMARY,
                fetchAllFieldsCommand
            );
            graph.connect(fetchAllFieldsCommand, command);
            return command;
        }
    );
    const getLabelsFieldIdCommand = graph.findOrDefault(
        (command): command is ExtractFieldIdCommand => {
            return (
                command instanceof ExtractFieldIdCommand &&
                command.getField() === SupportedField.LABELS
            );
        },
        () => {
            const command = new ExtractFieldIdCommand(SupportedField.LABELS, fetchAllFieldsCommand);
            graph.connect(fetchAllFieldsCommand, command);
            return command;
        }
    );
    // Xray currently (almost) always overwrites issue data when importing feature files to
    // existing issues. Therefore, we manually need to backup and reset the data once the
    // import is done.
    // See: https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
    // See: https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
    const getCurrentSummariesCommand = new GetSummaryValuesCommand(
        clients.jiraClient,
        getSummaryFieldIdCommand,
        gatherIssueKeysCommand
    );
    graph.connect(getSummaryFieldIdCommand, getCurrentSummariesCommand);
    graph.connect(gatherIssueKeysCommand, getCurrentSummariesCommand);
    const getCurrentLabelsCommand = new GetLabelValuesCommand(
        clients.jiraClient,
        getLabelsFieldIdCommand,
        gatherIssueKeysCommand
    );
    graph.connect(getLabelsFieldIdCommand, getCurrentLabelsCommand);
    graph.connect(gatherIssueKeysCommand, getCurrentLabelsCommand);
    // Only import the feature once the backups have been created.
    const importFeatureCommand = new ImportFeatureCommand(clients.xrayClient, {
        file: path.relative(projectRoot, file.filePath),
        projectKey: options.jira.projectKey,
    });
    graph.connect(getCurrentSummariesCommand, importFeatureCommand);
    graph.connect(getCurrentLabelsCommand, importFeatureCommand);
    // Check which issues will need to have their backups restored.
    const getKnownAffectedIssuesCommand = new MergeCommand(
        getActualAffectedIssueKeys,
        gatherIssueKeysCommand,
        importFeatureCommand
    );
    graph.connect(gatherIssueKeysCommand, getKnownAffectedIssuesCommand);
    graph.connect(importFeatureCommand, getKnownAffectedIssuesCommand);
    const getNewSummariesCommand = new GetSummaryValuesCommand(
        clients.jiraClient,
        getSummaryFieldIdCommand,
        gatherIssueKeysCommand
    );
    graph.connect(getSummaryFieldIdCommand, getNewSummariesCommand);
    graph.connect(gatherIssueKeysCommand, getNewSummariesCommand);
    graph.connect(getKnownAffectedIssuesCommand, getNewSummariesCommand);
    const getNewLabelsCommand = new GetLabelValuesCommand(
        clients.jiraClient,
        getLabelsFieldIdCommand,
        gatherIssueKeysCommand
    );
    graph.connect(getLabelsFieldIdCommand, getNewLabelsCommand);
    graph.connect(gatherIssueKeysCommand, getNewLabelsCommand);
    graph.connect(getKnownAffectedIssuesCommand, getNewLabelsCommand);
    const getSummariesToResetCommand = new MergeCommand(
        getSummariesToReset,
        getCurrentSummariesCommand,
        getNewSummariesCommand
    );
    graph.connect(getCurrentSummariesCommand, getSummariesToResetCommand);
    graph.connect(getNewSummariesCommand, getSummariesToResetCommand);
    const getLabelsToResetCommand = new MergeCommand(
        getLabelsToReset,
        getCurrentLabelsCommand,
        getNewLabelsCommand
    );
    graph.connect(getCurrentLabelsCommand, getLabelsToResetCommand);
    graph.connect(getNewLabelsCommand, getLabelsToResetCommand);
    const editSummariesCommand = new EditIssueFieldCommand(
        clients.jiraClient,
        SupportedField.SUMMARY,
        getSummaryFieldIdCommand,
        getSummariesToResetCommand
    );
    graph.connect(getSummaryFieldIdCommand, editSummariesCommand);
    graph.connect(getSummariesToResetCommand, editSummariesCommand);
    const editLabelsCommand = new EditIssueFieldCommand(
        clients.jiraClient,
        SupportedField.LABELS,
        getLabelsFieldIdCommand,
        getLabelsToResetCommand
    );
    graph.connect(getLabelsFieldIdCommand, editLabelsCommand);
    graph.connect(getLabelsToResetCommand, editLabelsCommand);
}
