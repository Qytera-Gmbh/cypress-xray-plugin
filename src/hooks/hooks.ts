import fs from "fs";
import { JiraClient } from "../client/jira/jiraClient";
import { ImportExecutionConverter } from "../conversion/importExecution/importExecutionConverter";
import { ImportExecutionCucumberMultipartConverter } from "../conversion/importExecutionCucumberMultipart/importExecutionCucumberMultipartConverter";
import { LOG, Level } from "../logging/logging";
import { containsCucumberTest, containsNativeTest } from "../preprocessing/preprocessing";
import { IssueTypeDetails } from "../types/jira/responses/issueTypeDetails";
import { ClientCombination, InternalCypressXrayPluginOptions } from "../types/plugin";
import { nonNull } from "../types/util";
import { CucumberMultipartFeature } from "../types/xray/requests/importExecutionCucumberMultipart";
import { dedent } from "../util/dedent";
import { errorMessage } from "../util/errors";
import { HELP } from "../util/help";

export async function beforeRunHook(
    specs: Cypress.Spec[],
    options: InternalCypressXrayPluginOptions,
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
    results: CypressCommandLine.CypressRunResult,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination
) {
    const runResult = results;
    let issueKey: string | null | undefined = null;
    if (containsNativeTest(runResult, options.cucumber?.featureFileExtension)) {
        LOG.message(Level.INFO, "Uploading native Cypress test results...");
        issueKey = await uploadCypressResults(runResult, options, clients);
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
    runResult: CypressCommandLine.CypressRunResult,
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination
) {
    const converter = new ImportExecutionConverter(options, clients.kind === "cloud");
    try {
        const cypressExecution = await converter.toXrayJson(runResult);
        if (!cypressExecution.tests || cypressExecution.tests.length === 0) {
            LOG.message(
                Level.WARNING,
                "No native Cypress tests were executed. Skipping native upload."
            );
            return null;
        }
        return await clients.xrayClient.importExecution(cypressExecution);
    } catch (error: unknown) {
        LOG.message(Level.ERROR, errorMessage(error));
    }
}

async function uploadCucumberResults(
    runResult: CypressCommandLine.CypressRunResult,
    options: InternalCypressXrayPluginOptions,
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
    try {
        const cucumberMultipart = await converter.convert(results, runResult);
        if (cucumberMultipart.features.length === 0) {
            LOG.message(
                Level.WARNING,
                "No Cucumber tests were executed. Skipping Cucumber upload."
            );
            return null;
        }
        return await clients.xrayClient.importExecutionCucumberMultipart(
            cucumberMultipart.features,
            cucumberMultipart.info
        );
    } catch (error: unknown) {
        LOG.message(Level.ERROR, errorMessage(error));
    }
}

async function attachVideos(
    runResult: CypressCommandLine.CypressRunResult,
    issueKey: string,
    jiraClient: JiraClient
): Promise<void> {
    const videos: string[] = runResult.runs
        .map((result: CypressCommandLine.RunResult) => {
            return result.video;
        })
        .filter(nonNull);
    if (videos.length === 0) {
        LOG.message(Level.WARNING, "No videos were uploaded: No videos have been captured");
    } else {
        await jiraClient.addAttachment(issueKey, ...videos);
    }
}
