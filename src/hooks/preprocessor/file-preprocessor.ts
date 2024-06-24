import { Command } from "../command";
import { EditIssueFieldCommand } from "../util/commands/jira/edit-issue-field-command";
import { JiraField } from "../util/commands/jira/extract-field-id-command";
import { GetLabelValuesCommand } from "../util/commands/jira/get-label-values-command";
import { GetSummaryValuesCommand } from "../util/commands/jira/get-summary-values-command";
import { ImportFeatureCommand } from "../util/commands/xray/import-feature-command";
import { ExtractFeatureFileIssuesCommand } from "./commands/extract-feature-file-issues-command";
import { ParseFeatureFileCommand } from "./commands/parse-feature-file-command";

import { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { ExecutableGraph } from "../../util/graph/executable-graph";
import { Logger } from "../../util/logging";
import { ConstantCommand } from "../util/commands/constant-command";
import { createExtractFieldIdCommand } from "../util/util";
import { ExtractIssueKeysCommand } from "./commands/extract-issue-keys-command";
import { GetLabelsToResetCommand } from "./commands/get-labels-to-reset-command";
import { GetSummariesToResetCommand } from "./commands/get-summaries-to-reset-command";
import { GetUpdatedIssuesCommand } from "./commands/get-updated-issues-command";

export function addSynchronizationCommands(
    file: Cypress.FileObject,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>,
    logger: Logger
): void {
    const parseFeatureFileCommand = graph.findOrDefault(
        ParseFeatureFileCommand,
        () => graph.place(new ParseFeatureFileCommand({ filePath: file.filePath }, logger)),
        (vertex) => {
            return vertex.getParameters().filePath === file.filePath;
        }
    );
    const extractIssueDataCommand = graph.place(
        new ExtractFeatureFileIssuesCommand(
            {
                displayCloudHelp: clients.kind === "cloud",
                filePath: file.filePath,
                prefixes: options.cucumber?.prefixes,
                projectKey: options.jira.projectKey,
            },
            logger,
            parseFeatureFileCommand
        )
    );
    graph.connect(parseFeatureFileCommand, extractIssueDataCommand);
    const extractIssueKeysCommand = graph.place(
        new ExtractIssueKeysCommand(logger, extractIssueDataCommand)
    );
    graph.connect(extractIssueDataCommand, extractIssueKeysCommand);
    const getSummaryFieldIdCommand = options.jira.fields.summary
        ? graph.place(new ConstantCommand(logger, options.jira.fields.summary))
        : createExtractFieldIdCommand(JiraField.SUMMARY, clients.jiraClient, graph, logger);
    const getLabelsFieldIdCommand = options.jira.fields.labels
        ? graph.place(new ConstantCommand(logger, options.jira.fields.labels))
        : createExtractFieldIdCommand(JiraField.LABELS, clients.jiraClient, graph, logger);
    // Xray currently (almost) always overwrites issue data when importing feature files to
    // existing issues. Therefore, we manually need to backup and reset the data once the
    // import is done.
    // See: https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
    // See: https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
    const getCurrentSummariesCommand = graph.place(
        new GetSummaryValuesCommand(
            { jiraClient: clients.jiraClient },
            logger,
            getSummaryFieldIdCommand,
            extractIssueKeysCommand
        )
    );
    graph.connect(getSummaryFieldIdCommand, getCurrentSummariesCommand);
    graph.connect(extractIssueKeysCommand, getCurrentSummariesCommand);
    const getCurrentLabelsCommand = graph.place(
        new GetLabelValuesCommand(
            { jiraClient: clients.jiraClient },
            logger,
            getLabelsFieldIdCommand,
            extractIssueKeysCommand
        )
    );
    graph.connect(getLabelsFieldIdCommand, getCurrentLabelsCommand);
    graph.connect(extractIssueKeysCommand, getCurrentLabelsCommand);
    // Only import the feature once the backups have been created.
    const importFeatureCommand = graph.place(
        new ImportFeatureCommand(
            {
                filePath: file.filePath,
                projectKey: options.jira.projectKey,
                xrayClient: clients.xrayClient,
            },
            logger
        )
    );
    graph.connect(getCurrentSummariesCommand, importFeatureCommand);
    graph.connect(getCurrentLabelsCommand, importFeatureCommand);
    // Check which issues will need to have their backups restored.
    const getUpdatedIssuesCommand = graph.place(
        new GetUpdatedIssuesCommand(logger, extractIssueKeysCommand, importFeatureCommand)
    );
    graph.connect(extractIssueKeysCommand, getUpdatedIssuesCommand);
    graph.connect(importFeatureCommand, getUpdatedIssuesCommand);
    const getNewSummariesCommand = graph.place(
        new GetSummaryValuesCommand(
            { jiraClient: clients.jiraClient },
            logger,
            getSummaryFieldIdCommand,
            extractIssueKeysCommand
        )
    );
    graph.connect(getSummaryFieldIdCommand, getNewSummariesCommand);
    graph.connect(extractIssueKeysCommand, getNewSummariesCommand);
    graph.connect(getUpdatedIssuesCommand, getNewSummariesCommand);
    const getNewLabelsCommand = graph.place(
        new GetLabelValuesCommand(
            { jiraClient: clients.jiraClient },
            logger,
            getLabelsFieldIdCommand,
            extractIssueKeysCommand
        )
    );
    graph.connect(getLabelsFieldIdCommand, getNewLabelsCommand);
    graph.connect(extractIssueKeysCommand, getNewLabelsCommand);
    graph.connect(getUpdatedIssuesCommand, getNewLabelsCommand);
    const getSummariesToResetCommand = graph.place(
        new GetSummariesToResetCommand(logger, getCurrentSummariesCommand, getNewSummariesCommand)
    );
    graph.connect(getCurrentSummariesCommand, getSummariesToResetCommand);
    graph.connect(getNewSummariesCommand, getSummariesToResetCommand);
    const getLabelsToResetCommand = graph.place(
        new GetLabelsToResetCommand(logger, getCurrentLabelsCommand, getNewLabelsCommand)
    );
    graph.connect(getCurrentLabelsCommand, getLabelsToResetCommand);
    graph.connect(getNewLabelsCommand, getLabelsToResetCommand);
    const editSummariesCommand = graph.place(
        new EditIssueFieldCommand(
            { field: JiraField.SUMMARY, jiraClient: clients.jiraClient },
            logger,
            getSummaryFieldIdCommand,
            getSummariesToResetCommand
        )
    );
    graph.connect(getSummaryFieldIdCommand, editSummariesCommand);
    graph.connect(getSummariesToResetCommand, editSummariesCommand);
    const editLabelsCommand = graph.place(
        new EditIssueFieldCommand(
            { field: JiraField.LABELS, jiraClient: clients.jiraClient },
            logger,
            getLabelsFieldIdCommand,
            getLabelsToResetCommand
        )
    );
    graph.connect(getLabelsFieldIdCommand, editLabelsCommand);
    graph.connect(getLabelsToResetCommand, editLabelsCommand);
}
