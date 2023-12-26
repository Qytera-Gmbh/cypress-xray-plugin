import path from "path";
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
import { LOG, Level } from "../../logging/logging";
import { FeatureFileIssueData } from "../../preprocessing/preprocessing";
import { SupportedField } from "../../repository/jira/fields/jiraIssueFetcher";
import { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { StringMap } from "../../types/util";
import { dedent } from "../../util/dedent";
import { ExecutableGraph } from "../../util/executable/executable";
import { unknownToString } from "../../util/string";

export function synchronizeFeatureFile(
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
    const gatherIssueKeysCommand = new MapCommand((issueData: FeatureFileIssueData): string[] => {
        return [
            ...issueData.tests.map((data) => data.key),
            ...issueData.preconditions.map((data) => data.key),
        ];
    }, extractIssueDataCommand);
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
    const importFeatureCommand = new ImportFeatureCommand(
        clients.xrayClient,
        {
            file: path.relative(projectRoot, file.filePath),
            projectKey: options.jira.projectKey,
        },
        gatherIssueKeysCommand
    );
    graph.connect(gatherIssueKeysCommand, importFeatureCommand);
    // Only import the feature once the backups have been created.
    graph.connect(getCurrentSummariesCommand, importFeatureCommand);
    graph.connect(getCurrentLabelsCommand, importFeatureCommand);
    const getNewSummariesCommand = new GetSummaryValuesCommand(
        clients.jiraClient,
        getSummaryFieldIdCommand,
        gatherIssueKeysCommand
    );
    graph.connect(getSummaryFieldIdCommand, getNewSummariesCommand);
    graph.connect(gatherIssueKeysCommand, getNewSummariesCommand);
    graph.connect(importFeatureCommand, getNewSummariesCommand);
    const getNewLabelsCommand = new GetLabelValuesCommand(
        clients.jiraClient,
        getLabelsFieldIdCommand,
        gatherIssueKeysCommand
    );
    graph.connect(getLabelsFieldIdCommand, getNewLabelsCommand);
    graph.connect(gatherIssueKeysCommand, getNewLabelsCommand);
    graph.connect(importFeatureCommand, getNewLabelsCommand);
    const getSummariesToResetCommand = new MergeCommand(
        ([oldValues, newValues]) => {
            const toReset: StringMap<string> = {};
            for (const [issueKey, newSummary] of Object.entries(newValues)) {
                if (!(issueKey in oldValues)) {
                    LOG.message(
                        Level.WARNING,
                        dedent(`
                            Skipping resetting summary of issue: ${issueKey}
                            The previous summary could not be fetched, make sure to manually restore it if needed
                        `)
                    );
                    continue;
                }
                const oldSummary = oldValues[issueKey];
                if (oldSummary === newSummary) {
                    LOG.message(
                        Level.DEBUG,
                        dedent(`
                            Skipping resetting summary of issue: ${issueKey}
                            The current summary is identical to the previous one:

                            Previous summary: ${unknownToString(oldSummary)}
                            Current summary:  ${unknownToString(newSummary)}
                        `)
                    );
                    continue;
                }
                toReset[issueKey] = oldSummary;
            }
            return toReset;
        },
        getCurrentSummariesCommand,
        getNewSummariesCommand
    );
    graph.connect(getCurrentSummariesCommand, getSummariesToResetCommand);
    graph.connect(getNewSummariesCommand, getSummariesToResetCommand);
    const getLabelsToResetCommand = new MergeCommand(
        ([oldValues, newValues]) => {
            const toReset: StringMap<string[]> = {};
            for (const [issueKey, newLabels] of Object.entries(newValues)) {
                if (!(issueKey in oldValues)) {
                    LOG.message(
                        Level.WARNING,
                        dedent(`
                            Skipping resetting labels of issue: ${issueKey}
                            The previous labels could not be fetched, make sure to manually restore them if needed
                        `)
                    );
                    continue;
                }
                const oldLabels = oldValues[issueKey];
                if (
                    oldLabels.length === newLabels.length &&
                    newLabels.every((label) => oldLabels.includes(label))
                ) {
                    LOG.message(
                        Level.DEBUG,
                        dedent(`
                            Skipping resetting labels of issue: ${issueKey}
                            The current labels are identical to the previous ones:

                            Previous labels: ${unknownToString(oldLabels)}
                            Current labels:  ${unknownToString(newLabels)}
                        `)
                    );
                    continue;
                }
                toReset[issueKey] = oldLabels;
            }
            return toReset;
        },
        getCurrentLabelsCommand,
        getNewLabelsCommand
    );
    graph.connect(getCurrentSummariesCommand, getLabelsToResetCommand);
    graph.connect(getNewSummariesCommand, getLabelsToResetCommand);
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
