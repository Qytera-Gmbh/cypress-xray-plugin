/// <reference types="cypress" />

import { resolvePreprocessorConfiguration } from "@badeball/cypress-cucumber-preprocessor";
import fs from "fs";
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
import {
    CucumberMultipartFeature,
    CucumberMultipartTag,
} from "./types/xray/requests/importExecutionCucumberMultipart";
import {
    CucumberMultipartInfoCloud,
    CucumberMultipartInfoServer,
} from "./types/xray/requests/importExecutionCucumberMultipartInfo";
import { parseFeatureFile } from "./util/parsing";

export async function beforeRunHook(
    config: Cypress.PluginConfigOptions,
    runDetails: Cypress.BeforeRunDetails,
    options?: InternalOptions,
    xrayClient?: OneOf<[XrayClientServer, XrayClientCloud]>,
    jiraClient?: OneOf<[JiraClientServer, JiraClientCloud]>
) {
    if (!options) {
        logError(
            "Plugin misconfigured: configureXrayPlugin() was not called. Skipping before:run hook.\n" +
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
            "Plugin misconfigured: Xray client not configured.\n" +
                "Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
    }
    if (!jiraClient) {
        throw new Error(
            "Plugin misconfigured: Jira client not configured.\n" +
                "Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
    }
    for (const spec of runDetails.specs) {
        if (
            spec.absolute.endsWith(options.cucumber.featureFileExtension) &&
            options.xray.uploadResults
        ) {
            options.cucumber.preprocessor = await resolvePreprocessorConfiguration(
                config,
                config.env,
                "/"
            );
            if (!options.cucumber.preprocessor.json.enabled) {
                throw new Error(
                    "Plugin misconfigured: Cucumber preprocessor JSON report disabled.\n" +
                        "Make sure to enable the JSON report as described in https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md"
                );
            } else if (!options.cucumber.preprocessor.json.output) {
                throw new Error(
                    "Plugin misconfigured: Cucumber preprocessor JSON report path was not set.\n" +
                        "Make sure to configure the JSOn report path as described in https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md"
                );
            }
            if (!options.jira.testExecutionIssueDetails) {
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
                            "Make sure to only make Xray test executions available in Jira."
                    );
                }
                options.jira.testExecutionIssueDetails = executionDetails[0];
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
                options.jira.testPlanIssueDetails = planDetails[0];
            }
        }
    }
}

export async function afterRunHook(
    results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult,
    options?: InternalOptions,
    xrayClient?: OneOf<[XrayClientServer, XrayClientCloud]>,
    jiraClient?: OneOf<[JiraClientServer, JiraClientCloud]>
) {
    if (!options) {
        logError(
            "Plugin misconfigured: configureXrayPlugin() was not called. Skipping after:run hook.\n" +
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
            "Plugin misconfigured: Xray client not configured.\n" +
                "Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/"
        );
    }
    if (!jiraClient) {
        throw new Error(
            "Plugin misconfigured: Jira client not configured.\n" +
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
    let issueKey: string;
    if (cypressRuns.length > 0) {
        issueKey = await uploadCypressResults(runResult, cypressRuns, options, xrayClient);
    }
    if (cucumberRuns.length > 0) {
        const cucumberIssueKey = await uploadCucumberResults(options, xrayClient);
        if (issueKey && cucumberIssueKey !== issueKey) {
            logWarning(
                "Cucumber execution results were imported to a different test execution issue. This might be a bug, please report it at https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues"
            );
        } else if (!issueKey && cucumberIssueKey) {
            issueKey = cucumberIssueKey;
        }
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

async function uploadCypressResults(
    runResult: CypressCommandLine.CypressRunResult,
    cypressRuns: CypressCommandLine.RunResult[],
    options?: InternalOptions,
    xrayClient?: OneOf<[XrayClientServer, XrayClientCloud]>
) {
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
    if (cypressExecution.tests.length > 0) {
        return await xrayClient.importExecution(cypressExecution);
    }
}

async function uploadCucumberResults(
    options?: InternalOptions,
    xrayClient?: OneOf<[XrayClientServer, XrayClientCloud]>
) {
    const results: CucumberMultipartFeature[] = JSON.parse(
        fs.readFileSync(options.cucumber.preprocessor.json.output, "utf-8")
    );
    if (options.jira.testExecutionIssueKey) {
        const testExecutionIssueTag: CucumberMultipartTag = {
            name: `@${options.jira.testExecutionIssueKey}`,
        };
        results.forEach((result: CucumberMultipartFeature) => {
            if (result.tags) {
                result.tags = [];
            }
            // Xray uses the first encountered issue tag for deducing the test execution issue.
            result.tags = [testExecutionIssueTag, ...result.tags];
        });
    }
    if (xrayClient instanceof XrayClientServer) {
        const info: CucumberMultipartInfoServer = {
            fields: {
                project: {
                    key: options.jira.projectKey,
                },
                summary: options.jira.testExecutionIssueSummary,
                issuetype: options.jira.testExecutionIssueDetails,
            },
        };
        info[options.jira.testPlanIssueDetails.id] = [options.jira.testPlanIssueKey];
        return await xrayClient.importExecutionCucumberMultipart(results, info);
    }
    const info: CucumberMultipartInfoCloud = {
        fields: {
            project: {
                key: options.jira.projectKey,
            },
            summary: options.jira.testExecutionIssueSummary,
            issuetype: options.jira.testExecutionIssueDetails,
        },
        xrayFields: {
            testPlanKey: options.jira.testPlanIssueKey,
        },
    };
    return await xrayClient.importExecutionCucumberMultipart(results, info);
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
                await xrayClient.importFeature(file.filePath, options.jira.projectKey);
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
