import { CONTEXT } from "./context";
import { issuesByScenario } from "./cucumber/tagging";
import { logError, logInfo, logWarning } from "./logging/logging";
import { parseEnvironmentVariables } from "./util/config";
import { parseFeatureFile } from "./util/parsing";

function verifyProjectKey(projectKey?: string) {
    if (!projectKey) {
        throw new Error(
            "Xray plugin misconfiguration: Jira project key was not set"
        );
    }
}

function verifyTestExecutionIssueKey(
    projectKey: string,
    testExecutionIssueKey?: string
) {
    if (
        testExecutionIssueKey &&
        !testExecutionIssueKey.startsWith(projectKey)
    ) {
        throw new Error(
            `Xray plugin misconfiguration: test execution issue key ${testExecutionIssueKey} does not belong to project ${projectKey}`
        );
    }
}

function verifyTestPlanIssueKey(projectKey: string, testPlanIssueKey?: string) {
    if (testPlanIssueKey && !testPlanIssueKey.startsWith(projectKey)) {
        throw new Error(
            `Xray plugin misconfiguration: test plan issue key ${testPlanIssueKey} does not belong to project ${projectKey}`
        );
    }
}

export async function beforeRunHook(runDetails: Cypress.BeforeRunDetails) {
    if (!CONTEXT) {
        throw new Error(
            "Xray plugin misconfiguration: no configuration found." +
                " Make sure your project has been set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
    }
    parseEnvironmentVariables(runDetails.config.env);
    verifyProjectKey(CONTEXT.config.jira.projectKey);
    verifyTestExecutionIssueKey(
        CONTEXT.config.jira.projectKey,
        CONTEXT.config.jira.testExecutionIssueKey
    );
    verifyTestPlanIssueKey(
        CONTEXT.config.jira.projectKey,
        CONTEXT.config.jira.testPlanIssueKey
    );
}

export async function afterRunHook(
    results:
        | CypressCommandLine.CypressRunResult
        | CypressCommandLine.CypressFailedRunResult
) {
    if (results.status === "failed") {
        logError(
            `Aborting: failed to run ${results.failures} tests:`,
            results.message
        );
        return;
    }
    if (!CONTEXT.config.xray.uploadResults) {
        logWarning(
            "Skipping results upload: Plugin is configured to not upload test results."
        );
        return;
    }
    const runResult = results as CypressCommandLine.CypressRunResult;
    const issueKey = await CONTEXT.xrayClient.importTestExecutionResults(
        runResult
    );
    if (!issueKey) {
        logWarning(
            "Execution results import failed, skipping remaining tasks."
        );
        return;
    }
    if (CONTEXT.jiraClient && CONTEXT.config.jira.attachVideo) {
        const videos: string[] = runResult.runs.map(
            (result: CypressCommandLine.RunResult) => {
                return result.video;
            }
        );
        if (videos.length === 0) {
            logWarning(
                "No videos were uploaded: No videos have been captured."
            );
        } else {
            await CONTEXT.jiraClient.addAttachments(issueKey, ...videos);
        }
    }
}

export async function filePreprocessorHook(
    file: Cypress.FileObject
): Promise<string> {
    if (file.filePath.endsWith(CONTEXT.config.cucumber.featureFileExtension)) {
        const relativePath = file.filePath.substring(
            file.filePath.indexOf("cypress")
        );
        try {
            // Extract tag information for later use, e.g. when uploading test
            // results to specific issues.
            const feature = parseFeatureFile(file.filePath).feature;
            CONTEXT.config.cucumber.issues = issuesByScenario(
                feature,
                CONTEXT.config.jira.projectKey
            );
            if (CONTEXT.config.cucumber.downloadFeatures) {
                // TODO: download feature file from Xray.
                throw new Error("feature not yet implemented");
            }
            if (CONTEXT.config.cucumber.uploadFeatures) {
                logInfo(
                    `Synchronizing upstream Cucumber tests (${relativePath})`
                );
                await CONTEXT.xrayClient.importCucumberTests(
                    file.filePath,
                    CONTEXT.config.jira.projectKey
                );
            }
        } catch (error: unknown) {
            logError(
                `Feature file invalid, skipping synchronization: ${error}`
            );
        }
    }
    return file.filePath;
}
