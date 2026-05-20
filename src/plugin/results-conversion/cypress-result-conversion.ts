import { basename, extname, parse } from "node:path";
import { lt } from "semver";
import type { ScreenshotDetails } from "../../models/cypress";
import { CypressStatus } from "../../models/cypress/status";
import type { InternalXrayOptions } from "../../models/plugin";
import type {
    XrayEvidenceItem,
    XrayIterationResult,
    XrayTest,
    XrayTestExecutionResults,
} from "../../models/xray/import-test-execution-results";
import { encodeFile } from "../../util/base64";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/errors";
import { normalizedFilename } from "../../util/files";
import { HELP } from "../../util/help";
import type { Logger } from "../../util/logging";
import { earliestDate, latestDate, truncateIsoTime } from "../../util/time";
import type { EvidenceCollection, IterationParameterCollection } from "../context";
import type { MinimalRunResult } from "../cypress-xray-plugin";
import type {
    ProcessedResultFailure,
    ProcessedResultSuccess,
    RunConverter,
} from "./cypress-run-conversion";
import { RunConverterLatest, RunConverterV12 } from "./cypress-run-conversion";
import { getXrayStatus } from "./cypress-status";

function convertCypressResults(parameters: {
    context: {
        evidence: Pick<EvidenceCollection, "getEvidence">;
        iterationParameters: Pick<IterationParameterCollection, "getIterationParameters">;
        screenshots: ScreenshotDetails[];
    };
    cypress: {
        results: {
            cypressVersion: string;
            runs: (RunConversionParametersLatest | RunConversionParametersV12)[];
        };
    };
    isCloudEnvironment: boolean;
    logger: Pick<Logger, "message">;
    options: {
        cucumber: {
            featureFileExtension?: string;
        };
        jira: {
            projectKey: string;
            testExecutionIssueKey?: string;
        };
        plugin: {
            normalizeScreenshotNames: boolean;
            uploadLastAttempt: boolean;
        };
        xray: {
            uploadScreenshots: boolean;
            xrayStatus: InternalXrayOptions["status"];
        };
    };
}) {
    const conversions = convertCypressTests({
        context: {
            evidence: parameters.context.evidence,
            iterationParameters: parameters.context.iterationParameters,
            screenshots: parameters.context.screenshots,
        },
        cypress: { results: parameters.cypress.results },
        isCloudEnvironment: parameters.isCloudEnvironment,
        options: {
            cucumber: {
                featureFileExtension: parameters.options.cucumber.featureFileExtension,
            },
            jira: {
                projectKey: parameters.options.jira.projectKey,
            },
            plugin: {
                normalizeScreenshotNames: parameters.options.plugin.normalizeScreenshotNames,
                uploadLastAttempt: parameters.options.plugin.uploadLastAttempt,
            },
            xray: {
                uploadScreenshots: parameters.options.xray.uploadScreenshots,
                xrayStatus: parameters.options.xray.xrayStatus,
            },
        },
    });
    for (const { error, filePath, testTitle } of conversions.failedConversions) {
        parameters.logger.message(
            "warning",
            dedent(`
                ${filePath}

                  Test: ${testTitle}

                    Skipping result upload.

                      Caused by: ${errorMessage(error)}
            `)
        );
    }
    for (const screenshotPath of conversions.nonAttributableScreenshots) {
        const screenshotName = parse(screenshotPath).name;
        parameters.logger.message(
            "warning",
            dedent(`
                ${screenshotPath}

                  Screenshot cannot be attributed to a test and will not be uploaded.

                  To upload screenshots, include test issue keys anywhere in their name:

                    cy.screenshot("${parameters.options.jira.projectKey}-123 ${screenshotName}")
            `)
        );
    }
    if (conversions.successfulConversions.length === 0) {
        throw new Error(
            "Failed to convert Cypress tests into Xray tests: No Cypress tests to upload"
        );
    }
    const xrayJson: XrayTestExecutionResults = {
        testExecutionKey: parameters.options.jira.testExecutionIssueKey,
        tests: [
            conversions.successfulConversions[0],
            ...conversions.successfulConversions.slice(1),
        ],
    };
    return xrayJson;
}

function convertCypressTests(parameters: {
    context: {
        evidence: Pick<EvidenceCollection, "getEvidence">;
        iterationParameters: Pick<IterationParameterCollection, "getIterationParameters">;
        screenshots: ScreenshotDetails[];
    };
    cypress: {
        results: {
            cypressVersion: string;
            runs: (RunConversionParametersLatest | RunConversionParametersV12)[];
        };
    };
    isCloudEnvironment: boolean;
    options: {
        cucumber: {
            featureFileExtension?: string;
        };
        jira: {
            projectKey: string;
        };
        plugin: {
            normalizeScreenshotNames: boolean;
            uploadLastAttempt: boolean;
        };
        xray: {
            uploadScreenshots: boolean;
            xrayStatus: InternalXrayOptions["status"];
        };
    };
}) {
    const xrayTests: XrayTest[] = [];
    const failedConversions: {
        error: unknown;
        filePath: string;
        testTitle: string;
    }[] = [];
    const nonAttributableScreenshots: string[] = [];
    const version = lt(parameters.cypress.results.cypressVersion, "13.0.0") ? "<13" : ">=13";
    const conversionResult = convertTestRuns({
        context: {
            screenshots: parameters.context.screenshots,
        },
        cypress: {
            results: parameters.cypress.results,
        },
        options: {
            cucumber: {
                featureFileExtension: parameters.options.cucumber.featureFileExtension,
            },
            jira: {
                projectKey: parameters.options.jira.projectKey,
            },
            plugin: {
                normalizeScreenshotNames: parameters.options.plugin.normalizeScreenshotNames,
                uploadLastAttempt: parameters.options.plugin.uploadLastAttempt,
            },
            xray: {
                uploadScreenshots: parameters.options.xray.uploadScreenshots,
            },
        },
        version: version,
    });
    const runsByKey = new Map<string, [ProcessedResultSuccess, ...ProcessedResultSuccess[]]>();
    for (const { error, spec, title } of conversionResult.failedConversions) {
        failedConversions.push({ error: error, filePath: spec.filepath, testTitle: title });
    }
    for (const nonAttributableScreenshot of conversionResult.nonAttributableScreenshots) {
        nonAttributableScreenshots.push(nonAttributableScreenshot);
    }
    for (const convertedTest of conversionResult.successfulConversions) {
        const runs = runsByKey.get(convertedTest.issueKey);
        if (runs) {
            runs.push(convertedTest);
        } else {
            runsByKey.set(convertedTest.issueKey, [convertedTest]);
        }
    }
    for (const [issueKey, testRuns] of runsByKey) {
        xrayTests.push(
            getTest({
                evidence: [
                    ...(conversionResult.screenshotsByIssueKey.get(issueKey) ?? []),
                    ...parameters.context.evidence.getEvidence(issueKey),
                ],
                getIterationParameters:
                    parameters.context.iterationParameters.getIterationParameters.bind(
                        parameters.context.iterationParameters
                    ),
                isCloudEnvironment: parameters.isCloudEnvironment,
                issueKey: issueKey,
                runs: testRuns,
                xrayStatus: parameters.options.xray.xrayStatus,
            })
        );
    }
    return {
        failedConversions: failedConversions,
        nonAttributableScreenshots: nonAttributableScreenshots,
        successfulConversions: xrayTests,
    };
}

function convertTestRuns(parameters: {
    context: {
        screenshots: ScreenshotDetails[];
    };
    cypress: {
        results: {
            runs: (RunConversionParametersLatest | RunConversionParametersV12)[];
        };
    };
    options: {
        cucumber: {
            featureFileExtension?: string;
        };
        jira: {
            projectKey: string;
        };
        plugin: {
            normalizeScreenshotNames: boolean;
            uploadLastAttempt: boolean;
        };
        xray: {
            uploadScreenshots: boolean;
        };
    };
    version: "<13" | ">=13";
}) {
    const cypressRuns = parameters.cypress.results.runs.filter(
        (run) =>
            !parameters.options.cucumber.featureFileExtension ||
            !run.spec.relative.endsWith(parameters.options.cucumber.featureFileExtension)
    );
    const converter: RunConverter =
        parameters.version === "<13"
            ? new RunConverterV12(
                  parameters.options.jira.projectKey,
                  cypressRuns as RunConversionParametersV12[]
              )
            : new RunConverterLatest(
                  parameters.options.jira.projectKey,
                  cypressRuns as RunConversionParametersLatest[],
                  parameters.context.screenshots
              );
    const processedRuns = converter.getConversions({
        onlyLastAttempt: parameters.options.plugin.uploadLastAttempt,
    });
    const successfulConversions: ProcessedResultSuccess[] = [];
    const failedConversions: ProcessedResultFailure[] = [];
    const nonAttributableScreenshots: string[] = [];
    const screenshotsByIssueKey = new Map<string, XrayEvidenceItem[]>();
    for (const processedRun of processedRuns) {
        if (processedRun.kind === "failure") {
            failedConversions.push(processedRun);
            continue;
        }
        if (processedRun.kind === "missing-issue-key") {
            failedConversions.push({
                ...processedRun,
                error: new Error(
                    dedent(`
                        Test: ${processedRun.title}

                          No test issue keys found in title.

                          You can target existing test issues by adding a corresponding issue key:

                            it("${parameters.options.jira.projectKey}-123 ${processedRun.title}", () => {
                              // ...
                            });

                          For more information, visit:
                          - ${HELP.plugin.guides.targetingExistingIssues}
                    `)
                ),
                kind: "failure",
            });
            continue;
        }
        successfulConversions.push(processedRun);
    }
    if (parameters.options.xray.uploadScreenshots) {
        const evidence = getScreenshotEvidence(
            successfulConversions,
            converter,
            parameters.options.plugin.uploadLastAttempt,
            parameters.options.plugin.normalizeScreenshotNames
        );
        nonAttributableScreenshots.push(...evidence.nonAttributableScreenshots);
        for (const [issueKey, screenshots] of evidence.screenshotsByIssueKey.entries()) {
            screenshotsByIssueKey.set(issueKey, screenshots);
        }
    }
    return {
        failedConversions,
        nonAttributableScreenshots,
        screenshotsByIssueKey,
        successfulConversions,
    };
}

function getScreenshotEvidence(
    conversions: ProcessedResultSuccess[],
    converter: RunConverter,
    uploadLastAttempt: boolean,
    normalizeScreenshotNames: boolean
): {
    nonAttributableScreenshots: string[];
    screenshotsByIssueKey: Map<string, Required<XrayEvidenceItem>[]>;
} {
    const testIssueKeys = conversions.map((conversion) => conversion.issueKey);
    const screenshotsByIssueKey = new Map<string, Required<XrayEvidenceItem>[]>();
    for (const issueKey of new Set(testIssueKeys)) {
        const screenshots = converter.getScreenshots(issueKey, {
            onlyLastAttempt: uploadLastAttempt,
        });
        for (const screenshot of screenshots) {
            let filename = basename(screenshot);
            if (normalizeScreenshotNames) {
                filename = normalizedFilename(filename);
            }
            const evidenceItem = {
                contentType: `image/${extname(screenshot).replace(".", "")}`,
                data: encodeFile(screenshot),
                filename: filename,
            };
            const currentScreenshots = screenshotsByIssueKey.get(issueKey);
            if (currentScreenshots) {
                currentScreenshots.push(evidenceItem);
            } else {
                screenshotsByIssueKey.set(issueKey, [evidenceItem]);
            }
        }
    }
    return {
        nonAttributableScreenshots: converter.getNonAttributableScreenshots({
            onlyLastAttempt: uploadLastAttempt,
        }),
        screenshotsByIssueKey: screenshotsByIssueKey,
    };
}

function getTest(parameters: {
    evidence: XrayEvidenceItem[];
    getIterationParameters: (issueKey: string, testId: string) => Record<string, string>;
    isCloudEnvironment?: boolean;
    issueKey: string;
    runs: [ProcessedResultSuccess, ...ProcessedResultSuccess[]];
    xrayStatus: InternalXrayOptions["status"];
}): XrayTest {
    const xrayTest: XrayTest = {
        finish: truncateIsoTime(
            latestDate(
                ...parameters.runs.map((test) => new Date(test.startedAt.getTime() + test.duration))
            ).toISOString()
        ),
        start: truncateIsoTime(
            earliestDate(...parameters.runs.map((test) => test.startedAt)).toISOString()
        ),
        status: aggregateXrayStatus(
            parameters.issueKey,
            parameters.runs,
            parameters.xrayStatus,
            parameters.isCloudEnvironment
        ),
        testKey: parameters.issueKey,
    };
    if (parameters.evidence.length) {
        xrayTest.evidence = parameters.evidence;
    }
    if (parameters.runs.length > 1) {
        const iterations: XrayIterationResult[] = [];
        for (const iteration of parameters.runs) {
            const definedParameters = parameters.getIterationParameters(
                parameters.issueKey,
                iteration.title
            );
            iterations.push({
                parameters: [
                    {
                        name: "iteration",
                        value: (iterations.length + 1).toString(),
                    },
                    ...Object.entries(definedParameters).map(([key, value]) => {
                        return {
                            name: key,
                            value: value,
                        };
                    }),
                ],
                status: getXrayStatus(
                    iteration.status,
                    parameters.isCloudEnvironment === true,
                    parameters.xrayStatus
                ),
            });
        }
        xrayTest.iterations = iterations;
    }
    return xrayTest;
}

function aggregateXrayStatus(
    issueKey: string,
    processedTests: [ProcessedResultSuccess, ...ProcessedResultSuccess[]],
    xrayStatus: InternalXrayOptions["status"],
    isCloudEnvironment?: boolean
): string {
    const statuses = processedTests.map((test) => test.status);
    if (statuses.length > 1) {
        const passed = statuses.filter((s) => s === CypressStatus.PASSED).length;
        const failed = statuses.filter((s) => s === CypressStatus.FAILED).length;
        const pending = statuses.filter((s) => s === CypressStatus.PENDING).length;
        const skipped = statuses.filter((s) => s === CypressStatus.SKIPPED).length;
        if (xrayStatus.aggregate) {
            // We need to cast here because the plugin internally works with the intersection of
            // result types of all Cypress versions (for type safety), but at runtime it will always
            // be the installed Cypress results type, so it should not be a problem.
            // Use sets to filter out duplicates (i.e. no need to pass the same spec twice).
            const specs = [
                ...new Set(processedTests.map((test) => test.cypressData.spec)),
            ] as CypressCommandLine.RunResult["spec"][];
            const tests = [
                ...new Set(processedTests.map((test) => test.cypressData.test)),
            ] as CypressCommandLine.RunResult["tests"];
            return xrayStatus.aggregate({
                failed,
                issueKey,
                passed,
                pending,
                skipped,
                specs,
                tests,
            });
        }
        if (passed > 0 && failed === 0 && skipped === 0) {
            return getXrayStatus(CypressStatus.PASSED, isCloudEnvironment === true, xrayStatus);
        }
        if (passed === 0 && failed === 0 && skipped === 0 && pending > 0) {
            return getXrayStatus(CypressStatus.PENDING, isCloudEnvironment === true, xrayStatus);
        }
        if (skipped > 0) {
            return getXrayStatus(CypressStatus.SKIPPED, isCloudEnvironment === true, xrayStatus);
        }
        return getXrayStatus(CypressStatus.FAILED, isCloudEnvironment === true, xrayStatus);
    }
    return getXrayStatus(statuses[0], isCloudEnvironment === true, xrayStatus);
}

interface RunConversionParametersV12 {
    spec: MinimalRunResult<"<13">["spec"];
    tests: MinimalRunResult<"<13">["tests"];
}

interface RunConversionParametersLatest {
    spec: MinimalRunResult<">=14" | "13">["spec"];
    stats: Pick<MinimalRunResult<">=14" | "13">["stats"], "startedAt">;
    tests: MinimalRunResult<">=14" | "13">["tests"];
}

/**
 * Workaround until module mocking becomes a stable feature. The current approach allows replacing
 * the functions with a mocked one.
 *
 * @see https://nodejs.org/docs/latest-v23.x/api/test.html#mockmodulespecifier-options
 */
export default { convertCypressResults };
