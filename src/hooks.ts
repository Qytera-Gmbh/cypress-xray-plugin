import path from "path";
import { JiraClientCloud } from "./client/jira/jiraClientCloud";
import { JiraClientServer } from "./client/jira/jiraClientServer";
import { XrayClientCloud } from "./client/xray/xrayClientCloud";
import { XrayClientServer } from "./client/xray/xrayClientServer";
import { ImportExecutionResultsConverterCloud } from "./conversion/importExecutionResults/importExecutionResultsConverterCloud";
import { ImportExecutionResultsConverterServer } from "./conversion/importExecutionResults/importExecutionResultsConverterServer";
import { logError, logInfo, logWarning } from "./logging/logging";
import { processFeatureFile, processRunResult } from "./processors";
import { InternalOptions } from "./types/plugin";
import { OneOf } from "./types/util";
import {
    XrayTestExecutionResultsCloud,
    XrayTestExecutionResultsServer,
} from "./types/xray/importTestExecutionResults";

export async function afterRunHook(
    results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult,
    options?: InternalOptions,
    xrayClient?: OneOf<[XrayClientServer, XrayClientCloud]>,
    jiraClient?: OneOf<[JiraClientServer, JiraClientCloud]>
) {
    if (!options) {
        logError("Plugin misconfigured (no configuration was provided). Skipping after:run hook.");
        logError(
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
    const runResult = results as CypressCommandLine.CypressRunResult;
    if (!options.xray.uploadResults) {
        logInfo("Skipping results upload: Plugin is configured to not upload test results.");
        return;
    }
    const issueKeys = processRunResult(runResult, options);
    const testTypes = await xrayClient.getTestTypes(options.jira.projectKey, ...issueKeys);
    let cypressExecution: XrayTestExecutionResultsServer | XrayTestExecutionResultsCloud;
    if (xrayClient instanceof XrayClientServer) {
        cypressExecution = new ImportExecutionResultsConverterServer(
            options
        ).convertExecutionResults(runResult);
    } else {
        cypressExecution = new ImportExecutionResultsConverterCloud(
            options
        ).convertExecutionResults(runResult);
    }
    const issueKey = await xrayClient.importExecution(cypressExecution);
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
            `Plugin misconfigured (no configuration was provided). Skipping feature file synchronization triggered by: ${file.filePath}`
        );
        logError(
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
            processFeatureFile(file.filePath, options);
            if (options.cucumber.downloadFeatures) {
                // TODO: download feature file from Xray.
                throw new Error("feature not yet implemented");
            }
            if (options.cucumber.uploadFeatures) {
                await xrayClient.importFeature(file.filePath, options.jira.projectKey);
            }
        } catch (error: unknown) {
            logError(`Feature file "${file.filePath}" invalid, skipping synchronization: ${error}`);
        }
    }
    return file.filePath;
}
