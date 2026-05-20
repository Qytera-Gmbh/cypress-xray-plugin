import type {
    HasEditIssueEndpoint,
    HasGetFieldsEndpoint,
    HasSearchEndpoint,
} from "../client/jira/jira-client";
import type {
    HasImportExecutionCucumberMultipartEndpoint,
    HasImportExecutionMultipartEndpoint,
    HasImportFeatureEndpoint,
} from "../client/xray/xray-client";
import type {
    HasAddEvidenceToTestRunEndpoint,
    HasGetTestRunResultsEndpoint,
} from "../client/xray/xray-client-cloud";
import type {
    HasAddEvidenceEndpoint,
    HasGetTestRunEndpoint,
} from "../client/xray/xray-client-server";
import type { PluginConfigOptions, ScreenshotDetails } from "../models/cypress";
import type {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalPluginOptions,
    InternalXrayOptions,
    PluginIssueUpdate,
} from "../models/plugin";
import type { MultipartInfo } from "../models/xray/requests/import-execution-multipart-info";
import { dedent } from "../util/dedent";
import type { Logger } from "../util/logging";
import type {
    EvidenceCollection,
    IterationParameterCollection,
    PluginEventEmitter,
} from "./context";
import type { MinimalCypressRunResult } from "./cypress-xray-plugin";
import featureFileProcessing from "./feature-file-processing/feature-file-processing";
import featureFileUpload from "./feature-file-upload/feature-file-upload";
import jiraIssueSnapshots from "./jira-issue-snapshots/jira-issue-snapshots";
import cucumberResultConversion from "./results-conversion/cucumber-result-conversion";
import cypressResultConversion from "./results-conversion/cypress-result-conversion";
import multipartInfoConversion from "./results-conversion/multipart-info-conversion";
import cucumberResultUpload from "./results-upload/cucumber-result-upload";
import cypressResultUpload from "./results-upload/cypress-result-upload";

async function runFeatureFileUpload(parameters: {
    clients: {
        jira: HasSearchEndpoint & HasEditIssueEndpoint;
        xray: HasImportFeatureEndpoint;
    };
    context: { featureFilePaths: Iterable<string> };
    isCloudEnvironment: boolean;
    logger: Pick<Logger, "message">;
    options: {
        cucumber?: Partial<Pick<InternalCucumberOptions, "prefixes">>;
        jira: Pick<InternalJiraOptions, "projectKey"> & {
            testExecutionIssue?: Pick<PluginIssueUpdate, "key"> & { fields?: { summary?: string } };
        };
        xray: Pick<InternalXrayOptions, "uploadResults">;
    };
}): Promise<string | undefined> {
    const processedFeatureFiles = featureFileProcessing.processFeatureFiles({
        displayCloudHelp: parameters.isCloudEnvironment,
        featureFilePaths: parameters.context.featureFilePaths,
        logger: parameters.logger,
        options: {
            cucumber: { prefixes: parameters.options.cucumber?.prefixes },
            jira: { projectKey: parameters.options.jira.projectKey },
        },
    });
    // Xray currently (almost) always overwrites issue data when importing feature files to
    // existing issues. Therefore, we manually need to backup and reset the data once the
    // import is done.
    // See: https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
    // See: https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
    const issuesToSnapshot = new Set(
        processedFeatureFiles.flatMap((featureFile) => featureFile.allIssueKeys)
    );
    // If we have a test execution issue key defined and no summary, we need to fetch the existing
    // test execution issue summary so that we can later on reuse it during the result upload.
    if (
        parameters.options.xray.uploadResults &&
        parameters.options.jira.testExecutionIssue?.key &&
        !parameters.options.jira.testExecutionIssue.fields?.summary
    ) {
        issuesToSnapshot.add(parameters.options.jira.testExecutionIssue.key);
    }
    const issueSnapshot = await jiraIssueSnapshots.getIssueSnapshots({
        client: parameters.clients.jira,
        issues: [...issuesToSnapshot].map((key) => {
            return { key };
        }),
    });
    if (issueSnapshot.errorMessages.length > 0) {
        parameters.logger.message(
            "warning",
            dedent(`
                Backing up Jira issue data failed for some issues, which may result in undesired data being displayed after the plugin has run:

                  ${issueSnapshot.errorMessages.join("\n")}
            `)
        );
    }
    const affectedIssues = await featureFileUpload.uploadFeatureFiles({
        clients: { xray: parameters.clients.xray },
        logger: parameters.logger,
        options: { jira: { projectKey: parameters.options.jira.projectKey } },
        processedFeatureFiles: processedFeatureFiles,
    });
    const newIssueSnapshot = await jiraIssueSnapshots.getIssueSnapshots({
        client: parameters.clients.jira,
        issues: affectedIssues.map((key) => {
            return { key };
        }),
    });
    if (newIssueSnapshot.errorMessages.length > 0) {
        parameters.logger.message(
            "warning",
            dedent(`
                Comparison of updated Jira issue data to backed up data failed for some issues, which may result in undesired data being displayed after the plugin has run:

                  ${newIssueSnapshot.errorMessages.join("\n")}
            `)
        );
    }
    await jiraIssueSnapshots.restoreIssueSnapshots({
        client: parameters.clients.jira,
        logger: parameters.logger,
        newData: newIssueSnapshot.issues,
        previousData: issueSnapshot.issues,
    });
    if (
        parameters.options.xray.uploadResults &&
        parameters.options.jira.testExecutionIssue?.fields?.summary
    ) {
        return parameters.options.jira.testExecutionIssue.fields.summary;
    }
    return issueSnapshot.issues.find(
        (data) => data.key === parameters.options.jira.testExecutionIssue?.key
    )?.summary;
}

async function runMultipartConversion(parameters: {
    clients: { jira: HasGetFieldsEndpoint };
    cypress: { results: MinimalCypressRunResult };
    isCloudEnvironment: boolean;
    logger: Pick<Logger, "message">;
    options: {
        jira: Pick<InternalJiraOptions, "projectKey"> & {
            fields: Pick<InternalJiraOptions["fields"], "testEnvironments" | "testPlan">;
            testExecutionIssue?: PluginIssueUpdate & {
                testEnvironments?: readonly [string, ...string[]];
                testPlan?: string;
            };
        };
    };
}): Promise<MultipartInfo> {
    let multipartInfoData: { errorMessages: string[]; multipartInfo: MultipartInfo };
    if (parameters.isCloudEnvironment) {
        multipartInfoData = multipartInfoConversion.convertMultipartInfoCloud({
            cypress: {
                config: {
                    browserName: parameters.cypress.results.browserName,
                    browserVersion: parameters.cypress.results.browserVersion,
                    cypressVersion: parameters.cypress.results.cypressVersion,
                },
            },
            options: {
                jira: {
                    projectKey: parameters.options.jira.projectKey,
                    testExecutionIssue: parameters.options.jira.testExecutionIssue,
                },
            },
        });
    } else {
        multipartInfoData = await multipartInfoConversion.convertMultipartInfoServer({
            client: parameters.clients.jira,
            cypress: {
                config: {
                    browserName: parameters.cypress.results.browserName,
                    browserVersion: parameters.cypress.results.browserVersion,
                    cypressVersion: parameters.cypress.results.cypressVersion,
                },
            },
            options: {
                jira: {
                    fields: {
                        testEnvironments: parameters.options.jira.fields.testEnvironments,
                        testPlan: parameters.options.jira.fields.testPlan,
                    },
                    projectKey: parameters.options.jira.projectKey,
                    testExecutionIssue: parameters.options.jira.testExecutionIssue,
                },
            },
        });
    }
    for (const message of multipartInfoData.errorMessages) {
        parameters.logger.message("warning", message);
    }
    return multipartInfoData.multipartInfo;
}

async function runCypressUpload(parameters: {
    clients: {
        xray: HasImportExecutionMultipartEndpoint &
            (
                | (HasGetTestRunEndpoint & HasAddEvidenceEndpoint)
                | (HasGetTestRunResultsEndpoint & HasAddEvidenceToTestRunEndpoint)
            );
    };
    context: {
        emitter: Pick<PluginEventEmitter, "emit">;
        evidence: Pick<EvidenceCollection, "getEvidence">;
        iterationParameters: Pick<IterationParameterCollection, "getIterationParameters">;
        screenshots: ScreenshotDetails[];
    };
    cypress: { results: MinimalCypressRunResult };
    isCloudEnvironment: boolean;
    logger: Pick<Logger, "message">;
    multipartInfo: MultipartInfo;
    options: {
        cucumber?: Partial<Pick<InternalCucumberOptions, "featureFileExtension">>;
        jira: Pick<InternalJiraOptions, "projectKey"> & {
            testExecutionIssue?: Pick<PluginIssueUpdate, "key">;
        };
        plugin: Pick<
            InternalPluginOptions,
            "normalizeScreenshotNames" | "splitUpload" | "uploadLastAttempt"
        >;
        xray: Pick<InternalXrayOptions, "status" | "uploadScreenshots">;
    };
}) {
    const xrayJson = cypressResultConversion.convertCypressResults({
        context: {
            evidence: parameters.context.evidence,
            iterationParameters: parameters.context.iterationParameters,
            screenshots: parameters.context.screenshots,
        },
        cypress: { results: parameters.cypress.results },
        isCloudEnvironment: parameters.isCloudEnvironment,
        logger: parameters.logger,
        options: {
            cucumber: { featureFileExtension: parameters.options.cucumber?.featureFileExtension },
            jira: {
                projectKey: parameters.options.jira.projectKey,
                testExecutionIssueKey: parameters.options.jira.testExecutionIssue?.key,
            },
            plugin: {
                normalizeScreenshotNames: parameters.options.plugin.normalizeScreenshotNames,
                uploadLastAttempt: parameters.options.plugin.uploadLastAttempt,
            },
            xray: {
                uploadScreenshots: parameters.options.xray.uploadScreenshots,
                xrayStatus: parameters.options.xray.status,
            },
        },
    });
    const uploadAttempt = await cypressResultUpload.uploadCypressResults({
        client: parameters.clients.xray,
        logger: parameters.logger,
        multipartInfo: parameters.multipartInfo,
        options: { plugin: { splitUpload: parameters.options.plugin.splitUpload } },
        xrayJson: xrayJson,
    });
    await parameters.context.emitter.emit("upload:cypress", {
        info: parameters.multipartInfo,
        results: xrayJson,
        testExecutionIssueKey: uploadAttempt.testExecutionIssueKey,
    });
    return uploadAttempt.testExecutionIssueKey;
}

async function runCucumberUpload(parameters: {
    clients: { xray: HasImportExecutionCucumberMultipartEndpoint };
    context: { emitter: Pick<PluginEventEmitter, "emit"> };
    cypress: { config: Pick<PluginConfigOptions, "projectRoot"> };
    isCloudEnvironment: boolean;
    logger: Pick<Logger, "message">;
    multipartInfo: MultipartInfo;
    options: {
        cucumber?: Partial<Pick<InternalCucumberOptions, "prefixes" | "preprocessor">>;
        jira: Pick<InternalJiraOptions, "projectKey"> & {
            testExecutionIssue?: Pick<PluginIssueUpdate, "key">;
        };
        xray: {
            status?: {
                step?: {
                    failed?: string;
                    passed?: string;
                    pending?: string;
                    skipped?: string;
                };
            };
            uploadScreenshots: boolean;
        };
    };
}) {
    const reportData = await cucumberResultConversion.readCucumberReport({
        cypress: { config: parameters.cypress.config },
        options: {
            cucumber: { reportPath: parameters.options.cucumber?.preprocessor?.json.output },
        },
    });
    const cucumberJson = cucumberResultConversion.convertCucumberFeatures({
        cucumberResults: reportData,
        cypress: { config: parameters.cypress.config },
        isCloudEnvironment: parameters.isCloudEnvironment,
        logger: parameters.logger,
        options: {
            cucumber: { prefixes: { test: parameters.options.cucumber?.prefixes?.test } },
            jira: {
                projectKey: parameters.options.jira.projectKey,
                testExecutionIssue: { key: parameters.options.jira.testExecutionIssue?.key },
            },
            xray: {
                status: {
                    step: {
                        failed: parameters.options.xray.status?.step?.failed,
                        passed: parameters.options.xray.status?.step?.passed,
                        pending: parameters.options.xray.status?.step?.pending,
                        skipped: parameters.options.xray.status?.step?.skipped,
                    },
                },
                uploadScreenshots: parameters.options.xray.uploadScreenshots,
            },
        },
    });
    const uploadResult = await cucumberResultUpload.uploadCucumberResults({
        client: parameters.clients.xray,
        cucumberJson: cucumberJson,
        multipartInfo: parameters.multipartInfo,
    });
    await parameters.context.emitter.emit("upload:cucumber", {
        results: { features: cucumberJson, info: parameters.multipartInfo },
        testExecutionIssueKey: uploadResult.testExecutionIssueKey,
    });
    return uploadResult.testExecutionIssueKey;
}

/**
 * Workaround until module mocking becomes a stable feature. The current approach allows replacing
 * the functions with a mocked one.
 *
 * @see https://nodejs.org/docs/latest-v23.x/api/test.html#mockmodulespecifier-options
 */
export default {
    runCucumberUpload,
    runCypressUpload,
    runFeatureFileUpload,
    runMultipartConversion,
};
