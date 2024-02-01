import path from "path";
import { Command } from "../command";
import { EditIssueFieldCommand } from "../util/commands/jira/edit-issue-field-command";
import { JiraField } from "../util/commands/jira/extract-field-id-command";
import { GetLabelValuesCommand } from "../util/commands/jira/get-label-values-command";
import { GetSummaryValuesCommand } from "../util/commands/jira/get-summary-values-command";
import { ImportFeatureCommand } from "../util/commands/xray/import-feature-command";
import { ExtractFeatureFileIssuesCommand } from "./commands/extract-feature-file-issues-command";
import { ParseFeatureFileCommand } from "./commands/parse-feature-file-command";

import { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { ExecutableGraph } from "../../util/graph/executable";
import { ConstantCommand } from "../util/commands/constant-command";
import { createExtractFieldIdCommand } from "../util/util";
import { ExtractIssueKeysCommand } from "./commands/extract-issue-keys-command";
import { GetLabelsToResetCommand } from "./commands/get-labels-to-reset-command";
import { GetSummariesToResetCommand } from "./commands/get-summaries-to-reset-command";
import { GetUpdatedIssuesCommand } from "./commands/get-updated-issues-command";

export function addSynchronizationCommands(
    file: Cypress.FileObject,
    projectRoot: string,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination,
    graph: ExecutableGraph<Command>
): void {
    const parseFeatureFileCommand = graph.place(
        new ParseFeatureFileCommand({ filePath: file.filePath })
    );
    const extractIssueDataCommand = graph.place(
        new ExtractFeatureFileIssuesCommand(
            {
                projectKey: options.jira.projectKey,
                prefixes: options.cucumber?.prefixes,
                displayCloudHelp: clients.kind === "cloud",
            },
            parseFeatureFileCommand
        )
    );
    graph.connect(parseFeatureFileCommand, extractIssueDataCommand);
    const extractIssueKeysCommand = graph.place(
        new ExtractIssueKeysCommand(extractIssueDataCommand)
    );
    graph.connect(extractIssueDataCommand, extractIssueKeysCommand);
    const getSummaryFieldIdCommand = options.jira.fields.summary
        ? graph.place(new ConstantCommand(options.jira.fields.summary))
        : createExtractFieldIdCommand(JiraField.SUMMARY, clients.jiraClient, graph);
    const getLabelsFieldIdCommand = options.jira.fields.labels
        ? graph.place(new ConstantCommand(options.jira.fields.labels))
        : createExtractFieldIdCommand(JiraField.LABELS, clients.jiraClient, graph);
    // Xray currently (almost) always overwrites issue data when importing feature files to
    // existing issues. Therefore, we manually need to backup and reset the data once the
    // import is done.
    // See: https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
    // See: https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
    const getCurrentSummariesCommand = graph.place(
        new GetSummaryValuesCommand(
            { jiraClient: clients.jiraClient },
            getSummaryFieldIdCommand,
            extractIssueKeysCommand
        )
    );
    graph.connect(getSummaryFieldIdCommand, getCurrentSummariesCommand);
    graph.connect(extractIssueKeysCommand, getCurrentSummariesCommand);
    const getCurrentLabelsCommand = graph.place(
        new GetLabelValuesCommand(
            { jiraClient: clients.jiraClient },
            getLabelsFieldIdCommand,
            extractIssueKeysCommand
        )
    );
    graph.connect(getLabelsFieldIdCommand, getCurrentLabelsCommand);
    graph.connect(extractIssueKeysCommand, getCurrentLabelsCommand);
    // Only import the feature once the backups have been created.
    const importFeatureCommand = graph.place(
        new ImportFeatureCommand({
            xrayClient: clients.xrayClient,
            filePath: path.relative(projectRoot, file.filePath),
            projectKey: options.jira.projectKey,
        })
    );
    graph.connect(getCurrentSummariesCommand, importFeatureCommand);
    graph.connect(getCurrentLabelsCommand, importFeatureCommand);
    // Check which issues will need to have their backups restored.
    const getUpdatedIssuesCommand = graph.place(
        new GetUpdatedIssuesCommand(extractIssueKeysCommand, importFeatureCommand)
    );
    graph.connect(extractIssueKeysCommand, getUpdatedIssuesCommand);
    graph.connect(importFeatureCommand, getUpdatedIssuesCommand);
    const getNewSummariesCommand = graph.place(
        new GetSummaryValuesCommand(
            { jiraClient: clients.jiraClient },
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
            getLabelsFieldIdCommand,
            extractIssueKeysCommand
        )
    );
    graph.connect(getLabelsFieldIdCommand, getNewLabelsCommand);
    graph.connect(extractIssueKeysCommand, getNewLabelsCommand);
    graph.connect(getUpdatedIssuesCommand, getNewLabelsCommand);
    const getSummariesToResetCommand = graph.place(
        new GetSummariesToResetCommand(getCurrentSummariesCommand, getNewSummariesCommand)
    );
    graph.connect(getCurrentSummariesCommand, getSummariesToResetCommand);
    graph.connect(getNewSummariesCommand, getSummariesToResetCommand);
    const getLabelsToResetCommand = graph.place(
        new GetLabelsToResetCommand(getCurrentLabelsCommand, getNewLabelsCommand)
    );
    graph.connect(getCurrentLabelsCommand, getLabelsToResetCommand);
    graph.connect(getNewLabelsCommand, getLabelsToResetCommand);
    const editSummariesCommand = graph.place(
        new EditIssueFieldCommand(
            { jiraClient: clients.jiraClient, field: JiraField.SUMMARY },
            getSummaryFieldIdCommand,
            getSummariesToResetCommand
        )
    );
    graph.connect(getSummaryFieldIdCommand, editSummariesCommand);
    graph.connect(getSummariesToResetCommand, editSummariesCommand);
    const editLabelsCommand = graph.place(
        new EditIssueFieldCommand(
            { jiraClient: clients.jiraClient, field: JiraField.LABELS },
            getLabelsFieldIdCommand,
            getLabelsToResetCommand
        )
    );
    graph.connect(getLabelsFieldIdCommand, editLabelsCommand);
    graph.connect(getLabelsToResetCommand, editLabelsCommand);
}