import path from "path";
import { JiraClient } from "../../client/jira/jiraClient";
import { XrayClient } from "../../client/xray/xrayClient";
import { LOG, Level } from "../../logging/logging";
import {
    FeatureFileIssueData,
    FeatureFileIssueDataTest,
    getCucumberIssueData,
} from "../../preprocessing/preprocessing";
import { SupportedFields } from "../../repository/jira/fields/jiraIssueFetcher";
import { JiraRepository } from "../../repository/jira/jiraRepository";
import { ClientCombination, InternalOptions } from "../../types/plugin";
import { StringMap } from "../../types/util";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/errors";
import { HELP } from "../../util/help";
import { computeOverlap } from "../../util/set";

export async function synchronizeFeatureFile(
    file: Cypress.FileObject,
    projectRoot: string,
    options: InternalOptions,
    clients: ClientCombination
): Promise<string> {
    if (
        !options.cucumber ||
        !file.filePath.endsWith(options.cucumber.featureFileExtension) ||
        !options.cucumber.uploadFeatures
    ) {
        return file.filePath;
    }
    const relativePath = path.relative(projectRoot, file.filePath);
    LOG.message(Level.INFO, `Preprocessing feature file ${relativePath}...`);
    try {
        let issueData = getCucumberIssueData(
            file.filePath,
            options.jira.projectKey,
            clients.kind === "cloud",
            options.cucumber.prefixes
        );
        const issueKeys = [
            ...issueData.tests.map((data) => data.key),
            ...issueData.preconditions.map((data) => data.key),
        ];
        // Xray currently (almost) always overwrites issue summaries when importing feature
        // files to existing issues. Therefore, we manually need to backup and reset the
        // summary once the import is done.
        // See: https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
        // See: https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
        LOG.message(
            Level.DEBUG,
            dedent(`
                Creating issue backups (summaries, labels) for issues:
                  ${issueKeys.join("\n")}
            `)
        );
        LOG.message(Level.INFO, "Importing feature file to Xray...");
        const testSummaries = await clients.jiraRepository.getSummaries(...issueKeys);
        const testLabels = await clients.jiraRepository.getLabels(...issueKeys);
        const updatedIssues = await importKnownFeature(
            file.filePath,
            options.jira.projectKey,
            issueKeys,
            clients.xrayClient
        );
        // We can skip restoring issues which:
        // - Jira created (in overlap: right only)
        // - Jira did not update (in overlap: left only)
        issueData = {
            tests: issueData.tests.filter((test) => updatedIssues.includes(test.key)),
            preconditions: issueData.tests.filter((precondition) =>
                updatedIssues.includes(precondition.key)
            ),
        };
        await resetSummaries(issueData, testSummaries, clients.jiraClient, clients.jiraRepository);
        await resetLabels(issueData.tests, testLabels, clients.jiraClient, clients.jiraRepository);
    } catch (error: unknown) {
        LOG.message(
            Level.ERROR,
            dedent(`
                Feature file invalid, skipping synchronization: ${file.filePath}

                ${errorMessage(error)}
            `)
        );
    }
    return file.filePath;
}

/**
 * Imports a feature file to Xray containings tags which correspond to known issues.
 *
 * @param filePath - the feature file
 * @param projectKey - the project to import the features to
 * @param expectedIssues - all issue keys which are expected to be updated
 * @param xrayClient - the Xray client
 * @returns all issue keys within the feature file belonging to issues that were updated by Jira
 */
export async function importKnownFeature(
    filePath: string,
    projectKey: string,
    expectedIssues: string[],
    xrayClient: XrayClient
): Promise<string[]> {
    const importResponse = await xrayClient.importFeature(filePath, projectKey);
    if (importResponse.errors.length > 0) {
        LOG.message(
            Level.WARNING,
            dedent(`
                Encountered errors during feature file import:
                ${importResponse.errors.map((error) => `- ${error}`).join("\n")}
            `)
        );
    }
    const setOverlap = computeOverlap(expectedIssues, importResponse.updatedOrCreatedIssues);
    if (setOverlap.leftOnly.length > 0 || setOverlap.rightOnly.length > 0) {
        const mismatchLines: string[] = [];
        if (setOverlap.leftOnly.length > 0) {
            mismatchLines.push(
                "Issues contained in feature file tags which were not updated by Jira and might not exist:"
            );
            mismatchLines.push(...setOverlap.leftOnly.map((issueKey) => `  ${issueKey}`));
        }
        if (setOverlap.rightOnly.length > 0) {
            mismatchLines.push(
                "Issues updated by Jira which are not present in feature file tags and might have been created:"
            );
            mismatchLines.push(...setOverlap.rightOnly.map((issueKey) => `  ${issueKey}`));
        }
        LOG.message(
            Level.WARNING,
            dedent(`
                Mismatch between feature file issue tags and updated Jira issues detected

                ${mismatchLines.join("\n")}

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
}

async function resetSummaries(
    issueData: FeatureFileIssueData,
    testSummaries: StringMap<string>,
    jiraClient: JiraClient,
    jiraRepository: JiraRepository
) {
    const allIssues = [...issueData.tests, ...issueData.preconditions];
    for (const issue of allIssues) {
        const issueKey = issue.key;
        const oldSummary = testSummaries[issueKey];
        const newSummary = issue.summary;
        if (!oldSummary) {
            LOG.message(
                Level.ERROR,
                dedent(`
                    Failed to reset issue summary of issue to its old summary: ${issueKey}
                    The issue's old summary could not be fetched, make sure to restore it manually if needed

                    Summary post sync: ${newSummary}
                `)
            );
            continue;
        }
        if (oldSummary !== newSummary) {
            const summaryFieldId = await jiraRepository.getFieldId(SupportedFields.SUMMARY);
            LOG.message(
                Level.DEBUG,
                dedent(`
                    Resetting issue summary of issue: ${issueKey}

                    Summary pre sync:  ${oldSummary}
                    Summary post sync: ${newSummary}
                `)
            );
            const fields = { [summaryFieldId]: oldSummary };
            try {
                await jiraClient.editIssue(issueKey, { fields: fields });
            } catch (error: unknown) {
                LOG.message(
                    Level.ERROR,
                    dedent(`
                        Failed to reset issue summary of issue to its old summary: ${issueKey}

                        Summary pre sync:  ${oldSummary}
                        Summary post sync: ${newSummary}

                        Make sure to reset it manually if needed
                    `)
                );
            }
        } else {
            LOG.message(
                Level.DEBUG,
                `Issue summary is identical to scenario (outline) name already: ${issueKey} (${oldSummary})`
            );
        }
    }
}

async function resetLabels(
    issueData: FeatureFileIssueDataTest[],
    testLabels: StringMap<string[]>,
    jiraClient: JiraClient,
    jiraRepository: JiraRepository
) {
    for (const issue of issueData) {
        const issueKey = issue.key;
        const newLabels = issue.tags;
        if (!(issueKey in testLabels)) {
            LOG.message(
                Level.ERROR,
                dedent(`
                    Failed to reset issue labels of issue to its old labels: ${issueKey}
                    The issue's old labels could not be fetched, make sure to restore them manually if needed

                    Labels post sync: ${newLabels.join(",")}
                `)
            );
            continue;
        }
        const oldLabels = testLabels[issueKey];
        if (!newLabels.every((label) => oldLabels.includes(label))) {
            const labelFieldId = await jiraRepository.getFieldId(SupportedFields.LABELS);
            LOG.message(
                Level.DEBUG,
                dedent(`
                    Resetting issue labels of issue: ${issueKey}

                    Labels pre sync:  ${oldLabels.join(",")}
                    Labels post sync: ${newLabels.join(",")}
                `)
            );
            const fields = { [labelFieldId]: oldLabels };
            try {
                await jiraClient.editIssue(issueKey, { fields: fields });
            } catch (error: unknown) {
                LOG.message(
                    Level.ERROR,
                    dedent(`
                        Failed to reset issue labels of issue to its old labels: ${issueKey}

                        Labels pre sync:  ${oldLabels.join(",")}
                        Labels post sync: ${newLabels.join(",")}

                        Make sure to reset them manually if needed
                    `)
                );
            }
        } else {
            LOG.message(
                Level.DEBUG,
                `Issue labels are identical to scenario (outline) labels already: ${issueKey} (${oldLabels.join(
                    ","
                )})`
            );
        }
    }
}
