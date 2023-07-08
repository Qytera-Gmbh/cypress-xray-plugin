import path from "path";
import { JiraClient } from "./client/jira/jiraClient";
import { XrayClientCloud } from "./client/xray/xrayClientCloud";
import { XrayClientServer } from "./client/xray/xrayClientServer";
import { issuesByScenario } from "./cucumber/tagging";
import { logError, logInfo, logWarning } from "./logging/logging";
import { InternalOptions } from "./types/plugin";
import { OneOf } from "./types/util";
import { parseFeatureFile } from "./util/parsing";

export async function afterRunHook(
    results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult,
    options?: InternalOptions,
    xrayClient?: OneOf<[XrayClientServer, XrayClientCloud]>,
    jiraClient?: JiraClient
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
    const issueKey = await xrayClient.importTestExecutionResults(runResult);
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
            await jiraClient.addAttachments(issueKey, ...videos);
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
