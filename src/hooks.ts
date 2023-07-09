/// <reference types="cypress" />

import path from "path";
import { JiraClientCloud } from "./client/jira/jiraClientCloud";
import { JiraClientServer } from "./client/jira/jiraClientServer";
import { XrayClientCloud } from "./client/xray/xrayClientCloud";
import { XrayClientServer } from "./client/xray/xrayClientServer";
import { ImportExecutionResultsConverterCloud } from "./conversion/importExecutionResults/importExecutionResultsConverterCloud";
import { ImportExecutionResultsConverterServer } from "./conversion/importExecutionResults/importExecutionResultsConverterServer";
import { issuesByScenario } from "./cucumber/tagging";
import { logError, logInfo, logWarning } from "./logging/logging";
import { InternalOptions } from "./types/plugin";
import { OneOf } from "./types/util";
import {
    XrayTestExecutionResultsCloud,
    XrayTestExecutionResultsServer,
} from "./types/xray/importTestExecutionResults";
import { parseFeatureFile } from "./util/parsing";

export async function beforeRunHook(
    runDetails: Cypress.BeforeRunDetails,
    options?: InternalOptions,
    xrayClient?: OneOf<[XrayClientServer, XrayClientCloud]>,
    jiraClient?: OneOf<[JiraClientServer, JiraClientCloud]>
) {
    if (!options) {
        logError(
            "Plugin misconfigured (no configuration was provided). Skipping before:run hook.\n" +
                "Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
        return;
    }
    if (!options.plugin.enabled) {
        logInfo("Plugin disabled. Skipping before:run hook.");
        return;
    }
    if (!xrayClient) {
        throw new Error(
            "Plugin misconfigured (Xray client not configured). Skipping after:run hook.\n" +
                "Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
    }
    if (!jiraClient) {
        throw new Error(
            "Plugin misconfigured (Jira client not configured). Skipping after:run hook.\n" +
                "Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
    }
    for (const spec of runDetails.specs) {
        if (
            spec.absolute.endsWith(options.cucumber.featureFileExtension) &&
            options.xray.uploadResults
        ) {
            const issueDetails = await jiraClient.getIssueTypes();
            const executionDetails = issueDetails.filter(
                (details) => details.name === options.jira.testExecutionIssueType
            );
            if (executionDetails.length === 0) {
                throw new Error(
                    `Failed to retrieve issue type information for issue type "${options.jira.testExecutionIssueType}".\n` +
                        "Make sure you have Xray installed."
                );
            } else if (executionDetails.length > 1) {
                throw new Error(
                    `Found multiple issue types named "${options.jira.testExecutionIssueType}".\n` +
                        "Make sure to only make Xray test executions available."
                );
            }
            options.cucumber.testExecutionIssueDetails = executionDetails[0];
            const planDetails = issueDetails.filter(
                (details) => details.name === options.jira.testPlanIssueType
            );
            if (planDetails.length === 0) {
                throw new Error(
                    `Failed to retrieve issue type information for issue type "${options.jira.testPlanIssueType}".\n` +
                        "Make sure you have Xray installed."
                );
            } else if (planDetails.length > 1) {
                throw new Error(
                    `Found multiple issue types named "${options.jira.testPlanIssueType}".\n` +
                        "Make sure to only make Xray test plans available."
                );
            }
            options.cucumber.testPlanIssueDetails = planDetails[0];
        }
    }
    console.log(runDetails);
}

export async function afterRunHook(
    results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult,
    options?: InternalOptions,
    xrayClient?: OneOf<[XrayClientServer, XrayClientCloud]>,
    jiraClient?: OneOf<[JiraClientServer, JiraClientCloud]>
) {
    if (!options) {
        logError(
            "Plugin misconfigured (no configuration was provided). Skipping after:run hook.\n" +
                "Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
        return;
    }
    if (!options.plugin.enabled) {
        logInfo("Plugin disabled. Skipping after:run hook.");
        return;
    }
    if (results.status === "failed") {
        logError(`Aborting: failed to run ${results.failures} tests:`, results.message);
        return;
    }
    if (!xrayClient) {
        throw new Error(
            "Plugin misconfigured (Xray client not configured). Skipping after:run hook.\n" +
                "Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
    }
    if (!jiraClient) {
        throw new Error(
            "Plugin misconfigured (Jira client not configured). Skipping after:run hook.\n" +
                "Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
    }
    const runResult = results as CypressCommandLine.CypressRunResult;
    if (!options.xray.uploadResults) {
        logInfo("Skipping results upload: Plugin is configured to not upload test results.");
        return;
    }
    const cypressRuns: CypressCommandLine.RunResult[] = [];
    const cucumberRuns: CypressCommandLine.RunResult[] = [];
    for (const run of runResult.runs) {
        if (run.spec.absolute.endsWith(options.cucumber.featureFileExtension)) {
            cucumberRuns.push(run);
        } else {
            cypressRuns.push(run);
        }
    }
    let cypressExecution: XrayTestExecutionResultsServer | XrayTestExecutionResultsCloud;
    if (xrayClient instanceof XrayClientServer) {
        cypressExecution = new ImportExecutionResultsConverterServer(
            options
        ).convertExecutionResults(runResult, cypressRuns);
    } else {
        cypressExecution = new ImportExecutionResultsConverterCloud(
            options
        ).convertExecutionResults(runResult, cypressRuns);
    }
    let issueKey: string;
    if (cypressExecution.tests.length > 0) {
        issueKey = await xrayClient.importExecution(cypressExecution);
    }
    if (issueKey === undefined) {
        logWarning("Execution results import failed. Skipping remaining tasks.");
        return;
    } else if (issueKey === null) {
        logWarning("Execution results import was skipped. Skipping remaining tasks.");
        return;
    }
    if (options.jira.attachVideos) {
        const videos: string[] = runResult.runs.map((result: CypressCommandLine.RunResult) => {
            return result.video;
        });
        if (videos.length === 0) {
            logWarning("No videos were uploaded: No videos have been captured.");
        } else {
            await jiraClient.addAttachment(issueKey, ...videos);
        }
    }
}

export async function synchronizeFile(
    file: Cypress.FileObject,
    projectRoot: string,
    options?: InternalOptions,
    xrayClient?: OneOf<[XrayClientServer, XrayClientCloud]>
): Promise<string> {
    if (!options) {
        logError(
            `Plugin misconfigured (no configuration was provided). Skipping feature file synchronization triggered by: ${file.filePath}\n` +
                "Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
        return;
    }
    if (!options.plugin.enabled) {
        logInfo(
            `Plugin disabled. Skipping feature file synchronization triggered by: ${file.filePath}`
        );
        return;
    }
    if (file.filePath.endsWith(options.cucumber.featureFileExtension)) {
        try {
            const relativePath = path.relative(projectRoot, file.filePath);
            logInfo(`Preprocessing feature file ${relativePath}...`);
            preprocessFeatureFile(file.filePath, options);
            if (options.cucumber.downloadFeatures) {
                // TODO: download feature file from Xray.
                throw new Error("feature not yet implemented");
            }
            if (options.cucumber.uploadFeatures) {
                await xrayClient.importCucumberTests(file.filePath, options.jira.projectKey);
            }
        } catch (error: unknown) {
            logError(`Feature file "${file.filePath}" invalid, skipping synchronization: ${error}`);
        }
    }
    return file.filePath;
}

function preprocessFeatureFile(filePath: string, options: InternalOptions) {
    // Extract tag information for later use, e.g. when uploading test results to specific issues.
    const feature = parseFeatureFile(filePath).feature;
    options.cucumber.issues = {
        ...options.cucumber.issues,
        ...issuesByScenario(feature, options.jira.projectKey),
    };
}
