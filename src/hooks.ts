import { CONTEXT } from "./context";
import { issuesByScenario } from "./cucumber/tagging";
import { logError, logInfo, logWarning } from "./logging/logging";
import { XrayStepOptions } from "./types/plugin";
import { initJiraClient, initXrayClient, parseEnvironmentVariables } from "./util/config";
import { parseFeatureFile } from "./util/parsing";

function verifyJiraProjectKey(projectKey?: string) {
    if (!projectKey) {
        throw new Error("Xray plugin misconfiguration: Jira project key was not set");
    }
}

function verifyJiraTestExecutionIssueKey(projectKey: string, testExecutionIssueKey?: string) {
    if (testExecutionIssueKey && !testExecutionIssueKey.startsWith(projectKey)) {
        throw new Error(
            `Xray plugin misconfiguration: test execution issue key ${testExecutionIssueKey} does not belong to project ${projectKey}`
        );
    }
}

function verifyJiraTestPlanIssueKey(projectKey: string, testPlanIssueKey?: string) {
    if (testPlanIssueKey && !testPlanIssueKey.startsWith(projectKey)) {
        throw new Error(
            `Xray plugin misconfiguration: test plan issue key ${testPlanIssueKey} does not belong to project ${projectKey}`
        );
    }
}

function verifyXraySteps(steps: XrayStepOptions) {
    if (steps.maxLengthAction <= 0) {
        throw new Error(
            `Xray plugin misconfiguration: max length of step actions must be a positive number: ${steps.maxLengthAction}`
        );
    }
}

function parseFeatureFiles(specs: Cypress.Spec[]) {
    specs.forEach((spec: Cypress.Spec) => {
        if (spec.absolute.endsWith(CONTEXT.config.cucumber.featureFileExtension)) {
            try {
                // Extract tag information for later use, e.g. when uploading test results to specific
                // issues.
                const feature = parseFeatureFile(spec.absolute).feature;
                CONTEXT.config.cucumber.issues = {
                    ...CONTEXT.config.cucumber.issues,
                    ...issuesByScenario(feature, CONTEXT.config.jira.projectKey),
                };
            } catch (error: unknown) {
                logError(
                    `Feature file "${spec.absolute}" invalid, skipping synchronization: ${error}`
                );
            }
        }
    });
}

export async function beforeRunHook(runDetails: Cypress.BeforeRunDetails) {
    if (!CONTEXT) {
        throw new Error(
            "Xray plugin misconfiguration: no configuration found." +
                " Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
    }
    parseEnvironmentVariables(runDetails.config.env);
    if (!CONTEXT.config.plugin.enabled) {
        logInfo("Plugin disabled. Skipping before:run hook.");
        return;
    }
    verifyJiraProjectKey(CONTEXT.config.jira.projectKey);
    verifyJiraTestExecutionIssueKey(
        CONTEXT.config.jira.projectKey,
        CONTEXT.config.jira.testExecutionIssueKey
    );
    verifyJiraTestPlanIssueKey(
        CONTEXT.config.jira.projectKey,
        CONTEXT.config.jira.testPlanIssueKey
    );
    verifyXraySteps(CONTEXT.config.xray.steps);
    initXrayClient(runDetails.config.env);
    initJiraClient(runDetails.config.env);
    parseFeatureFiles(runDetails.specs);
}

export async function afterRunHook(
    results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult
) {
    if (!CONTEXT.config.plugin.enabled) {
        logInfo("Plugin disabled. Skipping after:run hook.");
        return;
    }
    if (results.status === "failed") {
        logError(`Aborting: failed to run ${results.failures} tests:`, results.message);
        return;
    }
    if (!CONTEXT.config.xray.uploadResults) {
        logWarning("Skipping results upload: Plugin is configured to not upload test results.");
        return;
    }
    const runResult = results as CypressCommandLine.CypressRunResult;
    const issueKey = await CONTEXT.xrayClient.importTestExecutionResults(runResult);
    if (issueKey === undefined) {
        logWarning("Execution results import failed. Skipping remaining tasks.");
        return;
    } else if (issueKey === null) {
        logWarning("Execution results import was skipped. Skipping remaining tasks.");
        return;
    }
    if (CONTEXT.jiraClient && CONTEXT.config.jira.attachVideos) {
        const videos: string[] = runResult.runs.map((result: CypressCommandLine.RunResult) => {
            return result.video;
        });
        if (videos.length === 0) {
            logWarning("No videos were uploaded: No videos have been captured.");
        } else {
            await CONTEXT.jiraClient.addAttachments(issueKey, ...videos);
        }
    }
}

export async function filePreprocessorHook(file: Cypress.FileObject): Promise<string> {
    if (!CONTEXT.config.plugin.enabled) {
        logInfo(
            `Plugin disabled. Skipping file:preprocessor hook triggered by "${file.filePath}".`
        );
        return;
    }
    if (file.filePath.endsWith(CONTEXT.config.cucumber.featureFileExtension)) {
        const relativePath = file.filePath.substring(file.filePath.indexOf("cypress"));
        try {
            if (CONTEXT.config.cucumber.downloadFeatures) {
                // TODO: download feature file from Xray.
                throw new Error("feature not yet implemented");
            }
            if (CONTEXT.config.cucumber.uploadFeatures) {
                logInfo(`Synchronizing upstream Cucumber tests (${relativePath})`);
                await CONTEXT.xrayClient.importCucumberTests(
                    file.filePath,
                    CONTEXT.config.jira.projectKey
                );
            }
        } catch (error: unknown) {
            logError(`Feature file "${file.filePath}" invalid, skipping synchronization: ${error}`);
        }
    }
    return file.filePath;
}
