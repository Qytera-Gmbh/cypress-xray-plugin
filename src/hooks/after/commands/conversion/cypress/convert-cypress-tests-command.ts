import path from "node:path";
import { lt } from "semver";
import type { EvidenceCollection, IterationParameterCollection } from "../../../../../context";
import type { RunResult as RunResult_V12 } from "../../../../../types/cypress/12.0.0/api";
import type { CypressRunResultType } from "../../../../../types/cypress/cypress";
import { CypressStatus } from "../../../../../types/cypress/status";
import type { InternalXrayOptions } from "../../../../../types/plugin";
import type {
    XrayEvidenceItem,
    XrayIterationResult,
    XrayTest,
} from "../../../../../types/xray/import-test-execution-results";
import { encodeFile } from "../../../../../util/base64";
import { dedent } from "../../../../../util/dedent";
import { errorMessage } from "../../../../../util/errors";
import { normalizedFilename } from "../../../../../util/files";
import type { Logger } from "../../../../../util/logging";
import { earliestDate, latestDate, truncateIsoTime } from "../../../../../util/time";
import type { Computable } from "../../../../command";
import { Command } from "../../../../command";
import { getTestIssueKeys } from "../../../util";
import type { FailedConversion, SuccessfulConversion } from "./util/run-conversion";
import {
    convertTestRuns_V12,
    convertTestRuns_V13,
    getScreenshotsByIssueKey_V12,
    getScreenshotsByIssueKey_V13,
} from "./util/run-conversion";
import { getXrayStatus } from "./util/status-conversion";

interface Parameters {
    evidenceCollection: EvidenceCollection;
    featureFileExtension?: string;
    iterationParameterCollection: IterationParameterCollection;
    normalizeScreenshotNames: boolean;
    projectKey: string;
    uploadScreenshots: boolean;
    useCloudStatusFallback?: boolean;
    xrayStatus: InternalXrayOptions["status"];
}

export class ConvertCypressTestsCommand extends Command<[XrayTest, ...XrayTest[]], Parameters> {
    private readonly results: Computable<CypressRunResultType>;
    constructor(parameters: Parameters, logger: Logger, results: Computable<CypressRunResultType>) {
        super(parameters, logger);
        this.results = results;
    }

    protected async computeResult(): Promise<[XrayTest, ...XrayTest[]]> {
        const results = await this.results.compute();
        const version = lt(results.cypressVersion, "13.0.0") ? "<13" : ">=13";
        const convertedTests = this.convertTestRuns(results, version);
        const runsByKey = new Map<string, [SuccessfulConversion, ...SuccessfulConversion[]]>();
        for (const convertedTest of convertedTests) {
            try {
                const issueKeys = getTestIssueKeys(convertedTest.title, this.parameters.projectKey);
                for (const issueKey of issueKeys) {
                    const runs = runsByKey.get(issueKey);
                    if (runs) {
                        runs.push(convertedTest);
                    } else {
                        runsByKey.set(issueKey, [convertedTest]);
                    }
                }
            } catch (error: unknown) {
                this.logger.message(
                    "warning",
                    dedent(`
                        ${convertedTest.spec.filepath}

                          Test: ${convertedTest.title}

                            Skipping result upload.

                              Caused by: ${errorMessage(error)}
                    `)
                );
            }
        }
        const xrayTests: XrayTest[] = [];
        for (const [issueKey, testRuns] of runsByKey) {
            xrayTests.push(this.getTest(testRuns, issueKey));
        }
        if (xrayTests.length === 0) {
            throw new Error(
                "Failed to convert Cypress tests into Xray tests: No Cypress tests to upload"
            );
        }
        return [xrayTests[0], ...xrayTests.slice(1)];
    }

    private convertTestRuns(
        runResults: CypressRunResultType,
        version: "<13" | ">=13"
    ): SuccessfulConversion[] {
        const conversions: [string, FailedConversion | SuccessfulConversion][] = [];
        const cypressRuns = runResults.runs.filter((run) => {
            return (
                !this.parameters.featureFileExtension ||
                !run.spec.relative.endsWith(this.parameters.featureFileExtension)
            );
        });
        if (cypressRuns.length === 0) {
            throw new Error("Failed to extract test run data: Only Cucumber tests were executed");
        }

        const extractor = (run: CypressRunResultType["runs"][number]) => {
            if (version === "<13") {
                return convertTestRuns_V12(run as RunResult_V12);
            } else {
                return convertTestRuns_V13(run as CypressCommandLine.RunResult);
            }
        };
        for (const run of cypressRuns) {
            const testRuns = extractor(run);
            for (const [title, runs] of testRuns) {
                for (const conversion of runs) {
                    conversions.push([title, conversion]);
                }
            }
        }
        if (this.parameters.uploadScreenshots) {
            this.addScreenshotEvidence(runResults, version);
        }

        const testRunData: SuccessfulConversion[] = [];
        for (const [title, conversion] of conversions) {
            if (conversion.kind === "error") {
                this.logger.message(
                    "warning",
                    dedent(`
                        Test: ${title}

                          Skipping result upload.

                            Caused by: ${errorMessage(conversion.error)}
                    `)
                );
            } else {
                testRunData.push(conversion);
            }
        }
        return testRunData;
    }

    private addScreenshotEvidence(runResults: CypressRunResultType, version: "<13" | ">=13") {
        const extractor = (run: CypressRunResultType["runs"][number]) => {
            if (version === "<13") {
                return getScreenshotsByIssueKey_V12(
                    run as RunResult_V12,
                    this.parameters.projectKey
                );
            } else {
                return getScreenshotsByIssueKey_V13(
                    run as CypressCommandLine.RunResult,
                    this.parameters.projectKey
                );
            }
        };
        const includedScreenshots: string[] = [];
        for (const run of runResults.runs) {
            const allScreenshots = extractor(run);
            for (const [issueKey, screenshots] of allScreenshots) {
                for (const screenshot of screenshots) {
                    let filename = path.basename(screenshot);
                    if (this.parameters.normalizeScreenshotNames) {
                        filename = normalizedFilename(filename);
                    }
                    this.parameters.evidenceCollection.addEvidence(issueKey, {
                        data: encodeFile(screenshot),
                        filename: filename,
                    });
                    includedScreenshots.push(screenshot);
                }
            }
        }
        if (version === ">=13") {
            for (const run of runResults.runs as CypressCommandLine.RunResult[]) {
                if (
                    this.parameters.featureFileExtension &&
                    run.spec.fileExtension.endsWith(this.parameters.featureFileExtension)
                ) {
                    continue;
                }
                for (const screenshot of run.screenshots) {
                    if (!includedScreenshots.includes(screenshot.path)) {
                        const screenshotName = path.parse(screenshot.path).name;
                        this.logger.message(
                            "warning",
                            dedent(`
                                ${screenshot.path}

                                  Screenshot cannot be attributed to a test and will not be uploaded.

                                  To upload screenshots, include test issue keys anywhere in their name:

                                    cy.screenshot("${this.parameters.projectKey}-123 ${screenshotName}")
                            `)
                        );
                    }
                }
            }
        }
    }

    private getTest(
        runs: [SuccessfulConversion, ...SuccessfulConversion[]],
        issueKey: string
    ): XrayTest {
        const xrayTest: XrayTest = {
            finish: truncateIsoTime(
                latestDate(
                    ...runs.map((test) => new Date(test.startedAt.getTime() + test.duration))
                ).toISOString()
            ),
            start: truncateIsoTime(
                earliestDate(...runs.map((test) => test.startedAt)).toISOString()
            ),
            status: this.getXrayStatus(runs),
            testKey: issueKey,
        };
        const evidence = this.getXrayEvidence(issueKey);
        if (evidence.length > 0) {
            xrayTest.evidence = evidence;
        }
        if (runs.length > 1) {
            const iterations: XrayIterationResult[] = [];
            for (const iteration of runs) {
                iterations.push({
                    parameters: [
                        {
                            name: "iteration",
                            value: (iterations.length + 1).toString(),
                        },
                        ...this.parameters.iterationParameterCollection.getIterationParameters(
                            issueKey
                        ),
                    ],
                    status: getXrayStatus(
                        iteration.status,
                        this.parameters.useCloudStatusFallback === true,
                        this.parameters.xrayStatus
                    ),
                });
            }
            xrayTest.iterations = iterations;
        }
        return xrayTest;
    }

    private getXrayStatus(tests: [SuccessfulConversion, ...SuccessfulConversion[]]): string {
        const statuses = tests.map((test) => test.status);
        if (statuses.length > 1) {
            const passed = statuses.filter((s) => s === CypressStatus.PASSED).length;
            const failed = statuses.filter((s) => s === CypressStatus.FAILED).length;
            const pending = statuses.filter((s) => s === CypressStatus.PENDING).length;
            const skipped = statuses.filter((s) => s === CypressStatus.SKIPPED).length;
            if (this.parameters.xrayStatus.aggregate) {
                return this.parameters.xrayStatus.aggregate({ failed, passed, pending, skipped });
            }
            if (passed > 0 && failed === 0 && skipped === 0) {
                return getXrayStatus(
                    CypressStatus.PASSED,
                    this.parameters.useCloudStatusFallback === true,
                    this.parameters.xrayStatus
                );
            }
            if (passed === 0 && failed === 0 && skipped === 0 && pending > 0) {
                return getXrayStatus(
                    CypressStatus.PENDING,
                    this.parameters.useCloudStatusFallback === true,
                    this.parameters.xrayStatus
                );
            }
            if (skipped > 0) {
                return getXrayStatus(
                    CypressStatus.SKIPPED,
                    this.parameters.useCloudStatusFallback === true,
                    this.parameters.xrayStatus
                );
            }
            return getXrayStatus(
                CypressStatus.FAILED,
                this.parameters.useCloudStatusFallback === true,
                this.parameters.xrayStatus
            );
        }
        return getXrayStatus(
            statuses[0],
            this.parameters.useCloudStatusFallback === true,
            this.parameters.xrayStatus
        );
    }

    private getXrayEvidence(issueKey: string): XrayEvidenceItem[] {
        const evidence: XrayEvidenceItem[] = [];
        this.parameters.evidenceCollection
            .getEvidence(issueKey)
            .forEach((item) => evidence.push(item));
        return evidence;
    }
}
