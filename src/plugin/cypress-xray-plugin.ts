import type {
    HasAddAttachmentEndpoint,
    HasEditIssueEndpoint,
    HasGetFieldsEndpoint,
    HasSearchEndpoint,
    HasTransitionIssueEndpoint,
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
import type {
    CypressRunResult,
    CypressVersion,
    PluginConfigOptions,
    RunResult,
    ScreenshotDetails,
} from "../models/cypress";
import type {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalPluginOptions,
    InternalXrayOptions,
    PluginIssueUpdate,
} from "../models/plugin";
import { errorMessage } from "../util/errors";
import type { Logger } from "../util/logging";
import type {
    EvidenceCollection,
    IterationParameterCollection,
    PluginEventEmitter,
} from "./context";
import pluginPhases from "./plugin-phases";
import uploadValidation from "./results-upload/upload-validation";
import videoUpload from "./results-upload/video-upload";

async function runPlugin(parameters: RuntimeParameters) {
    // First, we upload all feature files to make sure the steps are up to date.
    const testExecutionIssueSummary = await pluginPhases.runFeatureFileUpload(parameters);
    // Now we can upload the results.
    if (!parameters.options.xray.uploadResults) {
        parameters.logger.message(
            "info",
            "Skipping results upload: Plugin is configured to not upload test results."
        );
        return;
    }
    const inspectionResult = inspectResults({
        cypress: { results: parameters.cypress.results },
        options: {
            cucumber: { featureFileExtension: parameters.options.cucumber?.featureFileExtension },
        },
    });
    const { containsCucumberTests, containsCypressTests } = inspectionResult;
    if (!containsCypressTests && !containsCucumberTests) {
        parameters.logger.message(
            "warning",
            "No test execution results to upload, skipping results upload."
        );
        return;
    }
    const multipartInfo = await pluginPhases.runMultipartConversion({
        ...parameters,
        cypress: { results: parameters.cypress.results },
        options: {
            jira: {
                ...parameters.options.jira,
                testExecutionIssue: {
                    ...parameters.options.jira.testExecutionIssue,
                    fields: {
                        ...parameters.options.jira.testExecutionIssue?.fields,
                        summary:
                            testExecutionIssueSummary ??
                            `Execution Results [${parameters.cypress.results.startedTestsAt}]`,
                    },
                },
            },
        },
    });
    let cypressExecutionIssueKey: string | undefined = undefined;
    let cucumberExecutionIssueKey: string | undefined = undefined;
    if (containsCypressTests) {
        try {
            cypressExecutionIssueKey = await pluginPhases.runCypressUpload({
                ...parameters,
                cypress: { results: parameters.cypress.results },
                multipartInfo: multipartInfo,
            });
        } catch (error: unknown) {
            parameters.logger.message("error", errorMessage(error));
        }
    }
    if (containsCucumberTests) {
        try {
            cucumberExecutionIssueKey = await pluginPhases.runCucumberUpload({
                ...parameters,
                multipartInfo: multipartInfo,
                options: {
                    ...parameters.options,
                    jira: {
                        ...parameters.options.jira,
                        testExecutionIssue: {
                            ...parameters.options.jira.testExecutionIssue,
                            key:
                                cypressExecutionIssueKey ??
                                parameters.options.jira.testExecutionIssue?.key,
                        },
                    },
                },
            });
        } catch (error: unknown) {
            parameters.logger.message("error", errorMessage(error));
        }
    }
    const finalTestExecutionIssueKey = uploadValidation.validateUploads({
        cucumberExecutionIssueKey: cucumberExecutionIssueKey,
        cypressExecutionIssueKey: cypressExecutionIssueKey,
        logger: parameters.logger,
        url: parameters.options.jira.url,
    });
    if (finalTestExecutionIssueKey && parameters.options.jira.attachVideos) {
        await videoUpload.uploadVideos({
            client: parameters.clients.jira,
            cypress: {
                results: {
                    videos: parameters.cypress.results.runs
                        .map((run) => run.video)
                        .filter((value) => value !== null),
                },
            },
            logger: parameters.logger,
            options: {
                jira: { testExecutionIssueKey: finalTestExecutionIssueKey },
            },
        });
    }
    // Workaround for: https://jira.atlassian.com/browse/JRASERVER-66881.
    if (
        finalTestExecutionIssueKey &&
        parameters.options.jira.testExecutionIssue?.transition &&
        !parameters.options.jira.testExecutionIssue.key &&
        !parameters.isCloudEnvironment
    ) {
        await parameters.clients.jira.transitionIssue(finalTestExecutionIssueKey, {
            transition: parameters.options.jira.testExecutionIssue.transition,
        });
    }
}

function inspectResults(parameters: {
    cypress: { results: MinimalCypressRunResult };
    options: { cucumber: { featureFileExtension?: string } };
}): { containsCucumberTests: boolean; containsCypressTests: boolean } {
    return {
        containsCucumberTests: parameters.cypress.results.runs.some((run) => {
            return (
                parameters.options.cucumber.featureFileExtension &&
                run.spec.absolute.endsWith(parameters.options.cucumber.featureFileExtension)
            );
        }),
        containsCypressTests: parameters.cypress.results.runs.some((run) => {
            return (
                !parameters.options.cucumber.featureFileExtension ||
                !run.spec.absolute.endsWith(parameters.options.cucumber.featureFileExtension)
            );
        }),
    };
}

export type MinimalRunResult<T extends CypressVersion = CypressVersion> = {
    ["<13"]: Pick<RunResult<"<13">, "video"> & {
        spec: Pick<RunResult<"<13">["spec"], "absolute" | "relative">;
        tests: {
            attempts: {
                duration: RunResult<"<13">["tests"][number]["attempts"][number]["duration"];
                screenshots: Pick<
                    RunResult<"<13">["tests"][number]["attempts"][number]["screenshots"][number],
                    "path"
                >[];
                startedAt: RunResult<"<13">["tests"][number]["attempts"][number]["startedAt"];
                state: RunResult<"<13">["tests"][number]["attempts"][number]["state"];
            }[];
            title: RunResult<"<13">["tests"][number]["title"];
        }[];
    };
    [">=14"]: Pick<RunResult<">=14">, "video"> & {
        spec: Pick<RunResult<">=14">["spec"], "absolute" | "relative">;
        stats: Pick<RunResult<">=14">["stats"], "startedAt">;
        tests: {
            attempts: Pick<RunResult<">=14">["tests"][number]["attempts"][number], "state">[];
            duration: RunResult<">=14">["tests"][number]["duration"];
            state: RunResult<">=14">["tests"][number]["state"];
            title: RunResult<">=14">["tests"][number]["title"];
        }[];
    };
    ["13"]: Pick<RunResult<"13">, "video"> & {
        spec: Pick<RunResult<"13">["spec"], "absolute" | "relative">;
        stats: Pick<RunResult<"13">["stats"], "startedAt">;
        tests: {
            attempts: Pick<RunResult<"13">["tests"][number]["attempts"][number], "state">[];
            duration: RunResult<"13">["tests"][number]["duration"];
            state: RunResult<"13">["tests"][number]["state"];
            title: RunResult<"13">["tests"][number]["title"];
        }[];
    };
}[T];

export type MinimalCypressRunResult<T extends CypressVersion = CypressVersion> = {
    ["<13"]: Pick<
        CypressRunResult<"<13">,
        "browserName" | "browserVersion" | "cypressVersion" | "startedTestsAt" | "status"
    > & { runs: MinimalRunResult<"<13">[] };
    [">=14"]: Pick<
        CypressRunResult<">=14">,
        "browserName" | "browserVersion" | "cypressVersion" | "startedTestsAt"
    > & { runs: MinimalRunResult<">=14">[] };
    ["13"]: Pick<
        CypressRunResult<"13">,
        "browserName" | "browserVersion" | "cypressVersion" | "startedTestsAt"
    > & { runs: MinimalRunResult<"13">[] };
}[T];

export interface RuntimeParameters {
    clients: {
        jira: HasAddAttachmentEndpoint &
            HasSearchEndpoint &
            HasEditIssueEndpoint &
            HasGetFieldsEndpoint &
            HasTransitionIssueEndpoint;
        xray: HasImportFeatureEndpoint &
            HasImportExecutionMultipartEndpoint &
            HasImportExecutionCucumberMultipartEndpoint &
            (
                | (HasGetTestRunEndpoint & HasAddEvidenceEndpoint)
                | (HasGetTestRunResultsEndpoint & HasAddEvidenceToTestRunEndpoint)
            );
    };
    context: {
        emitter: Pick<PluginEventEmitter, "emit">;
        evidence: Pick<EvidenceCollection, "getEvidence">;
        featureFilePaths: Iterable<string>;
        iterationParameters: Pick<IterationParameterCollection, "getIterationParameters">;
        screenshots: ScreenshotDetails[];
    };
    cypress: {
        config: Pick<PluginConfigOptions, "projectRoot">;
        results: MinimalCypressRunResult;
    };
    isCloudEnvironment: boolean;
    logger: Pick<Logger, "message">;
    options: {
        cucumber?: Partial<
            Pick<InternalCucumberOptions, "featureFileExtension" | "prefixes" | "preprocessor">
        >;
        jira: Pick<InternalJiraOptions, "attachVideos" | "projectKey" | "url"> & {
            fields: Pick<InternalJiraOptions["fields"], "testEnvironments" | "testPlan">;
            testExecutionIssue?: PluginIssueUpdate & {
                testEnvironments?: [string, ...string[]];
                testPlan?: string;
            };
        };
        plugin: Pick<
            InternalPluginOptions,
            "normalizeScreenshotNames" | "splitUpload" | "uploadLastAttempt"
        >;
        xray: Pick<InternalXrayOptions, "status" | "uploadResults" | "uploadScreenshots">;
    };
}

/**
 * Workaround until module mocking becomes a stable feature. The current approach allows replacing
 * the functions with a mocked one.
 *
 * @see https://nodejs.org/docs/latest-v23.x/api/test.html#mockmodulespecifier-options
 */
export default { runPlugin };
