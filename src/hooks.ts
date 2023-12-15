import fs from "fs";
import path from "path";
import { IJiraClient } from "./client/jira/jiraClient";
import { ImportExecutionConverter } from "./conversion/importExecution/importExecutionConverter";
import { ImportExecutionCucumberMultipartConverter } from "./conversion/importExecutionCucumberMultipart/importExecutionCucumberMultipartConverter";
import { logDebug, logError, logInfo, logSuccess, logWarning } from "./logging/logging";
import {
    FeatureFileIssueData,
    FeatureFileIssueDataTest,
    containsCucumberTest,
    containsNativeTest,
    getCucumberIssueData,
} from "./preprocessing/preprocessing";
import { SupportedFields } from "./repository/jira/fields/jiraIssueFetcher";
import { IJiraRepository } from "./repository/jira/jiraRepository";
import { IIssueTypeDetails } from "./types/jira/responses/issueTypeDetails";
import { ClientCombination, InternalOptions } from "./types/plugin";
import { StringMap, nonNull } from "./types/util";
import { CucumberMultipartFeature } from "./types/xray/requests/importExecutionCucumberMultipart";
import { dedent } from "./util/dedent";
import { errorMessage } from "./util/errors";
import { HELP } from "./util/help";

export async function beforeRunHook(
    specs: Cypress.Spec[],
    options: InternalOptions,
    clients: ClientCombination
) {
    // Cucumber upload requires additional test execution issue information.
    if (
        specs.some(
            (spec: Cypress.Spec) =>
                options.cucumber &&
                options.xray.uploadResults &&
                spec.absolute.endsWith(options.cucumber.featureFileExtension)
        )
    ) {
        logInfo(
            "Fetching necessary Jira issue type information in preparation for Cucumber result uploads..."
        );
        const issueDetails = await clients.jiraClient.getIssueTypes();
        if (!issueDetails) {
            throw new Error(
                dedent(`
                    Jira issue type information could not be fetched.

                    Please make sure project ${options.jira.projectKey} exists at ${options.jira.url}

                    For more information, visit:
                    - ${HELP.plugin.configuration.jira.projectKey}
                    - ${HELP.plugin.configuration.jira.url}
                `)
            );
        }
        options.jira.testExecutionIssueDetails = retrieveIssueTypeInformation(
            options.jira.testExecutionIssueType,
            issueDetails,
            options.jira.projectKey
        );
    }
}

function retrieveIssueTypeInformation(
    type: string,
    issueDetails: IIssueTypeDetails[],
    projectKey: string
): IIssueTypeDetails {
    const details = issueDetails.filter((details) => details.name === type);
    if (details.length === 0) {
        throw new Error(
            dedent(`
                Failed to retrieve issue type information for issue type: ${type}

                Make sure you have Xray installed.

                For more information, visit:
                - ${HELP.plugin.configuration.jira.testExecutionIssueType}
                - ${HELP.plugin.configuration.jira.testPlanIssueType}
            `)
        );
    } else if (details.length > 1) {
        throw new Error(
            dedent(`
                Found multiple issue types named: ${type}

                Make sure to only make a single one available in project ${projectKey}.

                For more information, visit:
                - ${HELP.plugin.configuration.jira.testExecutionIssueType}
                - ${HELP.plugin.configuration.jira.testPlanIssueType}
            `)
        );
    }
    return details[0];
}

export async function afterRunHook(
    results: CypressCommandLine.CypressRunResult,
    options: InternalOptions,
    clients: ClientCombination
) {
    const runResult = results as CypressCommandLine.CypressRunResult;
    let issueKey: string | null | undefined = null;
    if (containsNativeTest(runResult, options.cucumber?.featureFileExtension)) {
        logInfo("Uploading native Cypress test results...");
        issueKey = await uploadCypressResults(runResult, options, clients);
        if (
            options.jira.testExecutionIssueKey &&
            issueKey &&
            issueKey !== options.jira.testExecutionIssueKey
        ) {
            logWarning(
                dedent(`
                    Cypress execution results were imported to test execution ${issueKey}, which is different from the configured one: ${options.jira.testExecutionIssueKey}

                    Make sure issue ${options.jira.testExecutionIssueKey} actually exists and is of type: ${options.jira.testExecutionIssueType}
                `)
            );
        } else if (!options.jira.testExecutionIssueKey && issueKey) {
            // Prevents Cucumber results upload from creating yet another execution issue.
            options.jira.testExecutionIssueKey = issueKey;
        }
    }
    if (containsCucumberTest(runResult, options.cucumber?.featureFileExtension)) {
        logInfo("Uploading Cucumber test results...");
        const cucumberIssueKey = await uploadCucumberResults(runResult, options, clients);
        if (
            options.jira.testExecutionIssueKey &&
            cucumberIssueKey &&
            cucumberIssueKey !== options.jira.testExecutionIssueKey
        ) {
            logWarning(
                dedent(`
                    Cucumber execution results were imported to test execution ${cucumberIssueKey}, which is different from the configured one: ${options.jira.testExecutionIssueKey}

                    Make sure issue ${options.jira.testExecutionIssueKey} actually exists and is of type: ${options.jira.testExecutionIssueType}
                `)
            );
        }
        if (
            options.jira.testExecutionIssueKey &&
            issueKey &&
            cucumberIssueKey &&
            cucumberIssueKey !== issueKey
        ) {
            logWarning(
                dedent(`
                    Cucumber execution results were imported to a different test execution issue than the Cypress execution results.

                    This might be a bug, please report it at: https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues
                `)
            );
        } else if (!issueKey && cucumberIssueKey) {
            issueKey = cucumberIssueKey;
        }
    }
    if (issueKey === undefined) {
        logWarning("Execution results import failed. Skipping remaining tasks");
        return;
    } else if (issueKey === null) {
        logWarning("Execution results import was skipped. Skipping remaining tasks");
        return;
    }
    logSuccess(
        `Uploaded test results to issue: ${issueKey} (${options.jira.url}/browse/${issueKey})`
    );
    if (options.jira.attachVideos) {
        await attachVideos(runResult, issueKey, clients.jiraClient);
    }
}

async function uploadCypressResults(
    runResult: CypressCommandLine.CypressRunResult,
    options: InternalOptions,
    clients: ClientCombination
) {
    const converter = new ImportExecutionConverter(options, clients.kind === "cloud");
    try {
        const cypressExecution = await converter.toXrayJson(runResult);
        return await clients.xrayClient.importExecution(cypressExecution);
    } catch (error: unknown) {
        logError(errorMessage(error));
    }
}

async function uploadCucumberResults(
    runResult: CypressCommandLine.CypressRunResult,
    options: InternalOptions,
    clients: ClientCombination
) {
    if (!options.cucumber?.preprocessor?.json.output) {
        throw new Error(
            "Failed to upload Cucumber results: Cucumber preprocessor JSON report path not configured"
        );
    }
    const results: CucumberMultipartFeature[] = JSON.parse(
        fs.readFileSync(options.cucumber.preprocessor.json.output, "utf-8")
    );
    const converter = new ImportExecutionCucumberMultipartConverter(
        options,
        clients.kind === "cloud",
        clients.jiraRepository
    );
    const cucumberMultipart = await converter.convert(results, runResult);
    return await clients.xrayClient.importExecutionCucumberMultipart(
        cucumberMultipart.features,
        cucumberMultipart.info
    );
}

async function attachVideos(
    runResult: CypressCommandLine.CypressRunResult,
    issueKey: string,
    jiraClient: IJiraClient
): Promise<void> {
    const videos: string[] = runResult.runs
        .map((result: CypressCommandLine.RunResult) => {
            return result.video;
        })
        .filter(nonNull);
    if (videos.length === 0) {
        logWarning("No videos were uploaded: No videos have been captured");
    } else {
        await jiraClient.addAttachment(issueKey, ...videos);
    }
}

export async function synchronizeFile(
    file: Cypress.FileObject,
    projectRoot: string,
    options: InternalOptions,
    clients: ClientCombination
): Promise<string> {
    if (options.cucumber && file.filePath.endsWith(options.cucumber.featureFileExtension)) {
        try {
            const relativePath = path.relative(projectRoot, file.filePath);
            logInfo(`Preprocessing feature file ${relativePath}...`);
            if (options.cucumber?.downloadFeatures) {
                // TODO: download feature file from Xray.
                throw new Error("feature not yet implemented");
            }
            if (options.cucumber?.uploadFeatures) {
                const issueData = getCucumberIssueData(
                    file.filePath,
                    options.jira.projectKey,
                    clients.kind === "cloud",
                    options.cucumber.prefixes
                );
                // Xray currently (almost) always overwrites issue summaries when importing feature
                // files to existing issues. Therefore, we manually need to backup and reset the
                // summary once the import is done.
                // See: https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                // See: https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                const issueKeys = [
                    ...issueData.tests.map((data) => data.key),
                    ...issueData.preconditions.map((data) => data.key),
                ];
                logDebug(
                    dedent(`
                        Creating issue summary backups for issues:
                          ${issueKeys.join("\n")}
                    `)
                );
                logInfo("Importing feature file to Xray...");
                const testSummaries = await clients.jiraRepository.getSummaries(...issueKeys);
                const testLabels = await clients.jiraRepository.getLabels(...issueKeys);
                const wasImportSuccessful = await clients.xrayClient.importFeature(
                    file.filePath,
                    options.jira.projectKey
                );
                if (wasImportSuccessful) {
                    await resetSummaries(
                        issueData,
                        testSummaries,
                        clients.jiraClient,
                        clients.jiraRepository
                    );
                    await resetLabels(
                        issueData.tests,
                        testLabels,
                        clients.jiraClient,
                        clients.jiraRepository
                    );
                }
            }
        } catch (error: unknown) {
            logError(
                dedent(`
                    Feature file invalid, skipping synchronization: ${file.filePath}

                    ${errorMessage(error)}
                `)
            );
        }
    }
    return file.filePath;
}

async function resetSummaries(
    issueData: FeatureFileIssueData,
    testSummaries: StringMap<string>,
    jiraClient: IJiraClient,
    jiraRepository: IJiraRepository
) {
    const allIssues = [...issueData.tests, ...issueData.preconditions];
    for (let i = 0; i < allIssues.length; i++) {
        const issueKey = allIssues[i].key;
        const oldSummary = testSummaries[issueKey];
        const newSummary = allIssues[i].summary;
        if (!oldSummary) {
            logError(
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
            const fields: StringMap<string> = {};
            fields[summaryFieldId] = oldSummary;
            logDebug(
                dedent(`
                    Resetting issue summary of issue: ${issueKey}

                    Summary pre sync:  ${oldSummary}
                    Summary post sync: ${newSummary}
                `)
            );
            if (!(await jiraClient.editIssue(issueKey, { fields: fields }))) {
                logError(
                    dedent(`
                        Failed to reset issue summary of issue to its old summary: ${issueKey}

                        Summary pre sync:  ${oldSummary}
                        Summary post sync: ${newSummary}

                        Make sure to reset it manually if needed
                    `)
                );
            }
        } else {
            logDebug(
                `Issue summary is identical to scenario (outline) name already: ${issueKey} (${oldSummary})`
            );
        }
    }
}

async function resetLabels(
    issueData: FeatureFileIssueDataTest[],
    testLabels: StringMap<string[]>,
    jiraClient: IJiraClient,
    jiraRepository: IJiraRepository
) {
    for (let i = 0; i < issueData.length; i++) {
        const issueKey = issueData[i].key;
        const oldLabels = testLabels[issueKey];
        const newLabels = issueData[i].tags;
        if (!oldLabels) {
            logError(
                dedent(`
                    Failed to reset issue labels of issue to its old labels: ${issueKey}
                    The issue's old labels could not be fetched, make sure to restore them manually if needed

                    Labels post sync: ${newLabels}
                `)
            );
            continue;
        }
        if (!newLabels.every((label) => oldLabels.includes(label))) {
            const labelFieldId = await jiraRepository.getFieldId(SupportedFields.LABELS);
            const fields: StringMap<string[]> = {};
            fields[labelFieldId] = oldLabels;
            logDebug(
                dedent(`
                    Resetting issue labels of issue: ${issueKey}

                    Labels pre sync:  ${oldLabels}
                    Labels post sync: ${newLabels}
                `)
            );
            if (!(await jiraClient.editIssue(issueKey, { fields: fields }))) {
                logError(
                    dedent(`
                        Failed to reset issue labels of issue to its old labels: ${issueKey}

                        Labels pre sync:  ${oldLabels}
                        Labels post sync: ${newLabels}

                        Make sure to reset them manually if needed
                    `)
                );
            }
        } else {
            logDebug(
                `Issue labels are identical to scenario (outline) labels already: ${issueKey} (${oldLabels})`
            );
        }
    }
}
