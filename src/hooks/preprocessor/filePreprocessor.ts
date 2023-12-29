import path from "path";
import { CombineCommand } from "../../commands/combineCommand";
import { Command } from "../../commands/command";
import { ExtractFeatureFileIssuesCommand } from "../../commands/cucumber/extractFeatureFileIssuesCommand";
import { ParseFeatureFileCommand } from "../../commands/cucumber/parseFeatureFileCommand";
import { FunctionCommand } from "../../commands/functionCommand";
import { EditIssueFieldCommand } from "../../commands/jira/fields/editIssueFieldCommand";
import { JiraField } from "../../commands/jira/fields/extractFieldIdCommand";
import { GetLabelValuesCommand } from "../../commands/jira/fields/getLabelValuesCommand";
import { GetSummaryValuesCommand } from "../../commands/jira/fields/getSummaryValuesCommand";
import { ImportFeatureCommand } from "../../commands/xray/importFeatureCommand";
import { LOG, Level } from "../../logging/logging";
import { FeatureFileIssueData } from "../../preprocessing/preprocessing";

import { ConstantCommand } from "../../commands/constantCommand";
import { ClientCombination, InternalCypressXrayPluginOptions } from "../../types/plugin";
import { StringMap } from "../../types/util";
import { ImportFeatureResponse } from "../../types/xray/responses/importFeature";
import { dedent } from "../../util/dedent";
import { ExecutableGraph } from "../../util/executable/executable";
import { HELP } from "../../util/help";
import { computeOverlap } from "../../util/set";
import { unknownToString } from "../../util/string";
import { createExtractFieldIdCommand } from "../util";

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
    const gatherIssueKeysCommand = new FunctionCommand(
        (issueData: FeatureFileIssueData) => [
            ...issueData.tests.map((data) => data.key),
            ...issueData.preconditions.map((data) => data.key),
        ],
        extractIssueDataCommand
    );
    graph.connect(extractIssueDataCommand, gatherIssueKeysCommand);
    const getSummaryFieldIdCommand = options.jira.fields.summary
        ? new ConstantCommand(options.jira.fields.summary)
        : createExtractFieldIdCommand(JiraField.SUMMARY, clients.jiraClient, graph);
    const getLabelsFieldIdCommand = options.jira.fields.labels
        ? new ConstantCommand(options.jira.fields.labels)
        : createExtractFieldIdCommand(JiraField.LABELS, clients.jiraClient, graph);
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
    const getKnownAffectedIssuesCommand = new CombineCommand(
        ([expectedAffectedIssues, importResponse]: [string[], ImportFeatureResponse]) => {
            const setOverlap = computeOverlap(
                expectedAffectedIssues,
                importResponse.updatedOrCreatedIssues
            );
            if (setOverlap.leftOnly.length > 0 || setOverlap.rightOnly.length > 0) {
                const mismatchLinesFeatures: string[] = [];
                const mismatchLinesJira: string[] = [];
                if (setOverlap.leftOnly.length > 0) {
                    mismatchLinesFeatures.push(
                        "Issues contained in feature file tags which were not updated by Jira and might not exist:"
                    );
                    mismatchLinesFeatures.push(
                        ...setOverlap.leftOnly.map((issueKey) => `  ${issueKey}`)
                    );
                }
                if (setOverlap.rightOnly.length > 0) {
                    mismatchLinesJira.push(
                        "Issues updated by Jira which are not present in feature file tags and might have been created:"
                    );
                    mismatchLinesJira.push(
                        ...setOverlap.rightOnly.map((issueKey) => `  ${issueKey}`)
                    );
                }
                let mismatchLines: string;
                if (mismatchLinesFeatures.length > 0 && mismatchLinesJira.length > 0) {
                    mismatchLines = dedent(`
                        ${mismatchLinesFeatures.join("\n")}

                        ${mismatchLinesJira.join("\n")}
                    `);
                } else if (mismatchLinesFeatures.length > 0) {
                    mismatchLines = mismatchLinesFeatures.join("\n");
                } else {
                    mismatchLines = mismatchLinesJira.join("\n");
                }
                LOG.message(
                    Level.WARNING,
                    dedent(`
                        Mismatch between feature file issue tags and updated Jira issues detected

                        ${mismatchLines}

                        Make sure that:
                        - All issues present in feature file tags belong to existing issues
                        - Your plugin tag prefix settings are consistent with the ones defined in Xray

                        More information:
                        - ${HELP.plugin.guides.targetingExistingIssues}
                        - ${HELP.plugin.configuration.cucumber.prefixes}
                    `)
                );
            }
            return setOverlap.intersection;
        },
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
    const getSummariesToResetCommand = new CombineCommand(
        ([oldValues, newValues]: [StringMap<string>, StringMap<string>]) => {
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
    const getLabelsToResetCommand = new CombineCommand(
        ([oldValues, newValues]: [StringMap<string[]>, StringMap<string[]>]) => {
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
    graph.connect(getCurrentLabelsCommand, getLabelsToResetCommand);
    graph.connect(getNewLabelsCommand, getLabelsToResetCommand);
    const editSummariesCommand = new EditIssueFieldCommand(
        clients.jiraClient,
        JiraField.SUMMARY,
        getSummaryFieldIdCommand,
        getSummariesToResetCommand
    );
    graph.connect(getSummaryFieldIdCommand, editSummariesCommand);
    graph.connect(getSummariesToResetCommand, editSummariesCommand);
    const editLabelsCommand = new EditIssueFieldCommand(
        clients.jiraClient,
        JiraField.LABELS,
        getLabelsFieldIdCommand,
        getLabelsToResetCommand
    );
    graph.connect(getLabelsFieldIdCommand, editLabelsCommand);
    graph.connect(getLabelsToResetCommand, editLabelsCommand);
}
