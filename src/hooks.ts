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
import { logDebug, logError, logInfo, logWarning } from "./logging/logging";
import {
    FeatureFileIssueData,
    containsCucumberTest,
    containsNativeTest,
    getCucumberIssueData,
    getNativeTestIssueKeys,
} from "./preprocessing/preprocessing";
import { JiraRepositoryCloud } from "./repository/jira/jiraRepositoryCloud";
import { JiraRepositoryServer } from "./repository/jira/jiraRepositoryServer";
import {
    IssueTypeDetailsCloud,
    IssueTypeDetailsServer,
} from "./types/jira/responses/issueTypeDetails";
import { IssueUpdateCloud, IssueUpdateServer } from "./types/jira/responses/issueUpdate";
import { ClientCombination, InternalOptions } from "./types/plugin";
import { StringMap } from "./types/util";
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
    runDetails: Cypress.BeforeRunDetails,
    config?: Cypress.PluginConfigOptions,
    options?: InternalOptions,
    clients?: ClientCombination
) {
    if (!options) {
        // Don't throw here in case someone simply doesn't want the plugin to run but forgot to
        // remove the hook.
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
    if (!clients.xrayClient) {
        throw new Error(
            dedent(`
                Plugin misconfigured: Xray client was not configured

                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
        );
    }
    if (!clients.jiraClient) {
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
            if (!options.jira.testExecutionIssueDetails) {
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
    clients?: ClientCombination
) {
    if (!options) {
        // Don't throw here in case someone simply doesn't want the plugin to run but forgot to
        // remove the hook.
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
    if (!clients?.xrayClient) {
        throw new Error(
            dedent(`
                Plugin misconfigured: Xray client not configured

                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
        );
    }
    if (!clients?.jiraClient) {
        throw new Error(
            dedent(`
                Plugin misconfigured: Jira client not configured

                Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
            `)
        );
    }
    let issueKey: string = null;
    if (containsNativeTest(runResult, options)) {
        issueKey = await uploadCypressResults(
            runResult,
            options,
            clients.xrayClient,
            clients.jiraRepository
        );
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
        await attachVideos(runResult, issueKey, clients.jiraClient);
    }
}

async function uploadCypressResults(
    runResult: CypressCommandLine.CypressRunResult,
    options: InternalOptions,
    xrayClient: XrayClientServer | XrayClientCloud,
    jiraRepository: JiraRepositoryServer | JiraRepositoryCloud
) {
    const issueKeys = getNativeTestIssueKeys(runResult, options);
    const issueSummaries = await jiraRepository.getSummaries(...issueKeys);
    const issueTestTypes = await jiraRepository.getTestTypes(...issueKeys);
    let cypressExecution: XrayTestExecutionResultsServer | XrayTestExecutionResultsCloud;
    if (xrayClient instanceof XrayClientServer) {
        cypressExecution = await new ImportExecutionConverterServer(options).convert(runResult, {
            summaries: issueSummaries,
            testTypes: issueTestTypes,
        });
    } else {
        cypressExecution = await new ImportExecutionConverterCloud(options).convert(runResult, {
            summaries: issueSummaries,
            testTypes: issueTestTypes,
        });
    }
    return await xrayClient.importExecution(cypressExecution);
}

async function uploadCucumberResults(
    runResult: CypressCommandLine.CypressRunResult,
    options: InternalOptions,
    clients: ClientCombination
) {
    const results: CucumberMultipartFeature[] = JSON.parse(
        fs.readFileSync(options.cucumber.preprocessor.json.output, "utf-8")
    );
    let cucumberMultipart: CucumberMultipartServer | CucumberMultipartCloud;
    if (clients.kind === "server") {
        cucumberMultipart = await new ImportExecutionCucumberMultipartConverterServer(
            options,
            clients.jiraRepository
        ).convert(results, runResult);
    } else {
        cucumberMultipart = await new ImportExecutionCucumberMultipartConverterCloud(
            options
        ).convert(results, runResult);
    }
    return await clients.xrayClient.importExecutionCucumberMultipart(
        cucumberMultipart.features,
        cucumberMultipart.info
    );
}

async function attachVideos(
    runResult: CypressCommandLine.CypressRunResult,
    issueKey: string,
    jiraClient?: JiraClientServer | JiraClientCloud
): Promise<void> {
    const videos: string[] = runResult.runs.map((result: CypressCommandLine.RunResult) => {
        return result.video;
    });
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
                const issueData = getCucumberIssueData(
                    file.filePath,
                    options,
                    clients.kind === "cloud"
                );
                // Xray currently (almost) always overwrites issue summaries when importing feature
                // files to existing issues. Therefore, we manually need to backup and reset the
                // summary once the import is done.
                // See: https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
                // See: https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
                const testIssueKeys = [
                    ...issueData.tests.map((data) => data.key),
                    ...issueData.preconditions.map((data) => data.key),
                ];
                logDebug(
                    dedent(`
                        Creating issue summary backups for issues:
                        ${testIssueKeys.join("\n")}
                    `)
                );
                const testSummaries = await clients.jiraRepository.getSummaries(...testIssueKeys);
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
                }
            }
        } catch (error: unknown) {
            logError(`Feature file invalid, skipping synchronization: ${error}`);
        }
    }
    return file.filePath;
}

async function resetSummaries(
    issueData: FeatureFileIssueData,
    testSummaries: StringMap<string>,
    jiraClient: JiraClientServer | JiraClientCloud,
    jiraRepository: JiraRepositoryServer | JiraRepositoryCloud
) {
    const allIssues = [...issueData.tests, ...issueData.preconditions];
    for (let i = 0; i < allIssues.length; i++) {
        const issueKey = allIssues[i].key;
        const oldSummary = testSummaries[issueKey];
        const newSummary = allIssues[i].summary;
        if (oldSummary !== newSummary) {
            const issueUpdate: IssueUpdateServer | IssueUpdateCloud = {
                fields: {},
            };
            const summaryFieldId = await jiraRepository.getFieldId("Summary");
            issueUpdate.fields[summaryFieldId] = oldSummary;
            logDebug(
                dedent(`
                    Resetting issue summary of issue: ${issueKey}

                    Summary pre sync:  ${oldSummary}
                    Summary post sync: ${newSummary}
            `)
            );
            if (!(await jiraClient.editIssue(issueKey, issueUpdate))) {
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
