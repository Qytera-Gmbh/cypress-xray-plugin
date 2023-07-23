import { resolvePreprocessorConfiguration } from "@badeball/cypress-cucumber-preprocessor";
import dedent from "dedent";
import fs from "fs";
import path from "path";
import { JiraClientCloud } from "./client/jira/jiraClientCloud";
import { JiraClientServer } from "./client/jira/jiraClientServer";
import { XrayClientCloud } from "./client/xray/xrayClientCloud";
import { XrayClientServer } from "./client/xray/xrayClientServer";
import { ImportExecutionConverterCloud } from "./conversion/importExecution/importExecutionConverterCloud";
import { ImportExecutionConverterServer } from "./conversion/importExecution/importExecutionConverterServer";
import { ImportExecutionCucumberMultipartConverterCloud } from "./conversion/importExecutionCucumberMultipart/importExecutionCucumberMultipartConverterCloud";
import { ImportExecutionCucumberMultipartConverterServer } from "./conversion/importExecutionCucumberMultipart/importExecutionCucumberMultipartConverterServer";
import { preprocessFeatureFile } from "./cucumber/preprocessor";
import { logError, logInfo, logWarning } from "./logging/logging";
import { processRunResult } from "./processors";
import {
    IssueTypeDetailsCloud,
    IssueTypeDetailsServer,
} from "./types/jira/responses/issueTypeDetails";
import { InternalOptions } from "./types/plugin";
import {
    XrayTestExecutionResultsCloud,
    XrayTestExecutionResultsServer,
} from "./types/xray/importTestExecutionResults";
import {
    CucumberMultipartCloud,
    CucumberMultipartFeature,
    CucumberMultipartServer,
} from "./types/xray/requests/importExecutionCucumberMultipart";

export async function beforeRunHook(
    config: Cypress.PluginConfigOptions,
    runDetails: Cypress.BeforeRunDetails,
    options?: InternalOptions,
    xrayClient?: XrayClientServer | XrayClientCloud,
    jiraClient?: JiraClientServer | JiraClientCloud
) {
    if (!options) {
        logError(
            dedent(`
                Plugin misconfigured: configureXrayPlugin() was not called. Skipping before:run hook

                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
        );
        return;
    }
    if (!options.plugin.enabled) {
        logInfo("Plugin disabled. Skipping before:run hook");
        return;
    }
    if (!xrayClient) {
        throw new Error(
            dedent(`
                Plugin misconfigured: Xray client was not configured

                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
        );
    }
    if (!jiraClient) {
        throw new Error(
            dedent(`
                Plugin misconfigured: Jira client was not configured

                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
        );
    }
    for (const spec of runDetails.specs) {
        if (
            spec.absolute.endsWith(options.cucumber.featureFileExtension) &&
            options.xray.uploadResults
        ) {
            if (!options.cucumber.preprocessor) {
                options.cucumber.preprocessor = await resolvePreprocessorConfiguration(
                    config,
                    config.env,
                    "/"
                );
            }
            if (!options.cucumber.preprocessor.json.enabled) {
                throw new Error(
                    dedent(`
                        Plugin misconfigured: Cucumber preprocessor JSON report disabled

                        Make sure to enable the JSON report as described in https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md
                    `)
                );
            } else if (!options.cucumber.preprocessor.json.output) {
                throw new Error(
                    dedent(`
                        Plugin misconfigured: Cucumber preprocessor JSON report path was not set

                        Make sure to configure the JSON report path as described in https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md
                    `)
                );
            }
            if (
                !options.jira.testExecutionIssueDetails ||
                (options.jira.testPlanIssueKey && !options.jira.testPlanIssueDetails)
            ) {
                logInfo(
                    "Fetching necessary Jira issue type information in preparation for Cucumber result uploads..."
                );
                const issueDetails = await jiraClient.getIssueTypes();
                if (!issueDetails) {
                    throw new Error(
                        dedent(`
                            Jira issue type information could not be fetched.

                            Please make sure project ${options.jira.projectKey} exists at ${options.jira.url}

                            For more information, visit:
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#projectkey
                            - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                        `)
                    );
                }
                if (!options.jira.testExecutionIssueDetails) {
                    options.jira.testExecutionIssueDetails = retrieveIssueTypeInformation(
                        options.jira.testExecutionIssueType,
                        issueDetails,
                        options.jira.projectKey
                    );
                }
                // Test plan information might not be needed.
                if (options.jira.testPlanIssueKey && !options.jira.testPlanIssueDetails) {
                    options.jira.testPlanIssueDetails = retrieveIssueTypeInformation(
                        options.jira.testPlanIssueType,
                        issueDetails,
                        options.jira.projectKey
                    );
                }
            }
        }
    }
}

function retrieveIssueTypeInformation<
    IssueTypeDetails extends IssueTypeDetailsServer & IssueTypeDetailsCloud
>(type: string, issueDetails: IssueTypeDetails[], projectKey: string): IssueTypeDetails {
    const details = issueDetails.filter((details) => details.name === type);
    if (details.length === 0) {
        throw new Error(
            dedent(`
                Failed to retrieve issue type information for issue type: ${type}

                Make sure you have Xray installed.

                For more information, visit:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testExecutionIssueType
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testPlanIssueType
            `)
        );
    } else if (details.length > 1) {
        throw new Error(
            dedent(`
                Found multiple issue types named: ${type}

                Make sure to only make a single one available in project ${projectKey}.

                For more information, visit:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testExecutionIssueType
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testPlanIssueType
            `)
        );
    }
    return details[0];
}

export async function afterRunHook(
    results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult,
    options?: InternalOptions,
    xrayClient?: XrayClientServer | XrayClientCloud,
    jiraClient?: JiraClientServer | JiraClientCloud
) {
    if (!options) {
        // Don't throw here in case someone doesn't want the plugin to run.
        logError(
            dedent(`
                Skipping after:run hook: Plugin misconfigured: configureXrayPlugin() was not called

                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
        );
        return;
    }
    if (!options.plugin.enabled) {
        logInfo("Skipping after:run hook: Plugin disabled");
        return;
    }
    if (results.status === "failed") {
        logError(
            dedent(`
                Skipping after:run hook: Failed to run ${results.failures} tests

                ${results.message}
            `)
        );
        return;
    }
    const runResult = results as CypressCommandLine.CypressRunResult;
    if (!options.xray.uploadResults) {
        logInfo("Skipping results upload: Plugin is configured to not upload test results");
        return;
    }
    if (!xrayClient) {
        throw new Error(
            dedent(`
                Plugin misconfigured: Xray client not configured

                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
        );
    }
    if (!jiraClient) {
        throw new Error(
            dedent(`
                Plugin misconfigured: Jira client not configured

                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
        );
    }
    let issueKey: string = null;
    if (containsNativeTest(runResult, options)) {
        issueKey = await uploadCypressResults(runResult, options, xrayClient);
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
    if (containsCucumberTest(runResult, options)) {
        const cucumberIssueKey = await uploadCucumberResults(runResult, options, xrayClient);
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
        if (options.jira.testExecutionIssueKey && issueKey && cucumberIssueKey !== issueKey) {
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
    if (options.jira.attachVideos) {
        const videos: string[] = runResult.runs.map((result: CypressCommandLine.RunResult) => {
            return result.video;
        });
        if (videos.length === 0) {
            logWarning("No videos were uploaded: No videos have been captured");
        } else {
            await jiraClient.addAttachment(issueKey, ...videos);
        }
    }
}

function containsNativeTest(
    runResult: CypressCommandLine.CypressRunResult,
    options: InternalOptions
): boolean {
    return runResult.runs.some((run: CypressCommandLine.RunResult) => {
        if (options.cucumber && run.spec.absolute.endsWith(options.cucumber.featureFileExtension)) {
            return false;
        }
        return true;
    });
}

function containsCucumberTest(
    runResult: CypressCommandLine.CypressRunResult,
    options: InternalOptions
): boolean {
    return runResult.runs.some((run: CypressCommandLine.RunResult) => {
        if (options.cucumber && run.spec.absolute.endsWith(options.cucumber.featureFileExtension)) {
            return true;
        }
        return false;
    });
}

async function uploadCypressResults(
    runResult: CypressCommandLine.CypressRunResult,
    options?: InternalOptions,
    xrayClient?: XrayClientServer | XrayClientCloud
) {
    const issueKeys = processRunResult(runResult, options);
    const testTypes = await xrayClient.getTestTypes(options.jira.projectKey, ...issueKeys);
    options.xray.testTypes = testTypes;
    let cypressExecution: XrayTestExecutionResultsServer | XrayTestExecutionResultsCloud;
    if (xrayClient instanceof XrayClientServer) {
        cypressExecution = new ImportExecutionConverterServer(options).convert(runResult);
    } else {
        cypressExecution = new ImportExecutionConverterCloud(options).convert(runResult);
    }
    return await xrayClient.importExecution(cypressExecution);
}

async function uploadCucumberResults(
    runResult: CypressCommandLine.CypressRunResult,
    options?: InternalOptions,
    xrayClient?: XrayClientServer | XrayClientCloud
) {
    const results: CucumberMultipartFeature[] = JSON.parse(
        fs.readFileSync(options.cucumber.preprocessor.json.output, "utf-8")
    );
    let cucumberMultipart: CucumberMultipartServer | CucumberMultipartCloud;
    if (xrayClient instanceof XrayClientServer) {
        cucumberMultipart = new ImportExecutionCucumberMultipartConverterServer(options).convert(
            results,
            runResult
        );
    } else {
        cucumberMultipart = new ImportExecutionCucumberMultipartConverterCloud(options).convert(
            results,
            runResult
        );
    }
    return await xrayClient.importExecutionCucumberMultipart(
        cucumberMultipart.features,
        cucumberMultipart.info
    );
}

export async function synchronizeFile(
    file: Cypress.FileObject,
    projectRoot: string,
    options?: InternalOptions,
    xrayClient?: XrayClientServer | XrayClientCloud
): Promise<string> {
    if (!options) {
        logError(
            dedent(`
                Plugin misconfigured (no configuration was provided). Skipping feature file synchronization triggered by: ${file.filePath}

                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
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
            if (options.cucumber.downloadFeatures) {
                // TODO: download feature file from Xray.
                throw new Error("feature not yet implemented");
            }
            if (options.cucumber.uploadFeatures) {
                preprocessFeatureFile(
                    file.filePath,
                    options,
                    xrayClient instanceof XrayClientCloud
                );
                await xrayClient.importFeature(file.filePath, options.jira.projectKey);
            }
        } catch (error: unknown) {
            logError(`Feature file invalid, skipping synchronization: ${error}`);
        }
    }
    return file.filePath;
}
