import fs from "fs";
import { JiraClient } from "../client/jira/jiraClient";
import { EvidenceCollection } from "../context";
import { ImportExecutionConverter } from "../conversion/importExecution/importExecutionConverter";
import { ImportExecutionCucumberMultipartConverter } from "../conversion/importExecutionCucumberMultipart/importExecutionCucumberMultipartConverter";
import { LOG, Level } from "../logging/logging";
import { containsCucumberTest, containsNativeTest } from "../preprocessing/preprocessing";
import { CypressRunResultType, RunResultType } from "../types/cypress/cypress";
import { IssueTypeDetails } from "../types/jira/responses/issueTypeDetails";
import { ClientCombination, InternalOptions } from "../types/plugin";
import { nonNull } from "../types/util";
import { CucumberMultipartFeature } from "../types/xray/requests/importExecutionCucumberMultipart";
import { dedent } from "../util/dedent";
import { errorMessage } from "../util/errors";
import { HELP } from "../util/help";

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
        LOG.message(
            Level.INFO,
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
    issueDetails: IssueTypeDetails[],
    projectKey: string
): IssueTypeDetails {
    const details = issueDetails.filter((issueDetail) => issueDetail.name === type);
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
    results: CypressRunResultType,
    options: InternalOptions,
    clients: ClientCombination,
    evidenceCollection: EvidenceCollection
) {
    const runResult = results;
    let issueKey: string | null | undefined = null;
    if (containsNativeTest(runResult, options.cucumber?.featureFileExtension)) {
        LOG.message(Level.INFO, "Uploading native Cypress test results...");
        issueKey = await uploadCypressResults(runResult, options, clients, evidenceCollection);
        if (
            options.jira.testExecutionIssueKey &&
            issueKey &&
            issueKey !== options.jira.testExecutionIssueKey
        ) {
            LOG.message(
                Level.WARNING,
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
        LOG.message(Level.INFO, "Uploading Cucumber test results...");
        const cucumberIssueKey = await uploadCucumberResults(runResult, options, clients);
        if (
            options.jira.testExecutionIssueKey &&
            cucumberIssueKey &&
            cucumberIssueKey !== options.jira.testExecutionIssueKey
        ) {
            LOG.message(
                Level.WARNING,
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
            LOG.message(
                Level.WARNING,
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
        LOG.message(Level.WARNING, "Execution results import failed. Skipping remaining tasks");
        return;
    } else if (issueKey === null) {
        LOG.message(
            Level.WARNING,
            "Execution results import was skipped. Skipping remaining tasks"
        );
        return;
    }
    LOG.message(
        Level.SUCCESS,
        `Uploaded test results to issue: ${issueKey} (${options.jira.url}/browse/${issueKey})`
    );
    if (options.jira.attachVideos) {
        await attachVideos(runResult, issueKey, clients.jiraClient);
    }
}

async function uploadCypressResults(
    runResult: CypressRunResultType,
    options: InternalOptions,
    clients: ClientCombination,
    evidenceCollection: EvidenceCollection
) {
    const converter = new ImportExecutionConverter(
        options,
        clients.kind === "cloud",
        evidenceCollection
    );
    try {
        const cypressExecution = await converter.toXrayJson(runResult);
        return await clients.xrayClient.importExecution(cypressExecution);
    } catch (error: unknown) {
        LOG.message(Level.ERROR, errorMessage(error));
    }
}

async function uploadCucumberResults(
    runResult: CypressRunResultType,
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
    ) as CucumberMultipartFeature[];
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
    runResult: CypressRunResultType,
    issueKey: string,
    jiraClient: JiraClient
): Promise<void> {
    const videos: string[] = runResult.runs
        .map((result: RunResultType) => {
            return result.video;
        })
        .filter(nonNull);
    if (videos.length === 0) {
        LOG.message(Level.WARNING, "No videos were uploaded: No videos have been captured");
    } else {
        await jiraClient.addAttachment(issueKey, ...videos);
    }
}
