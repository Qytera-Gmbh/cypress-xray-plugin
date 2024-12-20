import path from "node:path";
import { lt } from "semver";
import type { EvidenceCollection } from "../../../../../context";
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
import { Level } from "../../../../../util/logging";
import { earliestDate, latestDate, truncateIsoTime } from "../../../../../util/time";
import type { Computable } from "../../../../command";
import { Command } from "../../../../command";
import { getTestIssueKeys } from "../../../util";
import type { TestRunData } from "./util/run";
import {
    getScreenshotsByIssueKey_V12,
    getScreenshotsByIssueKey_V13,
    getTestRunData_V12,
    getTestRunData_V13,
} from "./util/run";
import { getXrayStatus } from "./util/status";

interface Parameters {
    evidenceCollection: EvidenceCollection;
    featureFileExtension?: string;
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
        const testRunData = await this.getTestRunData(results, version);
        const xrayTests: XrayTest[] = [];
        const runsByKey = new Map<string, [TestRunData, ...TestRunData[]]>();
        testRunData.forEach((testData: TestRunData) => {
            try {
                const issueKeys = getTestIssueKeys(testData.title, this.parameters.projectKey);
                for (const issueKey of issueKeys) {
                    const runs = runsByKey.get(issueKey);
                    if (runs) {
                        runs.push(testData);
                    } else {
                        runsByKey.set(issueKey, [testData]);
                    }
                }
            } catch (error: unknown) {
                this.logger.message(
                    Level.WARNING,
                    dedent(`
                        ${testData.spec.filepath}

                          Test: ${testData.title}

                            Skipping result upload.

                              Caused by: ${errorMessage(error)}
                    `)
                );
            }
        });
        for (const [issueKey, testRuns] of runsByKey.entries()) {
            const test: XrayTest = this.getTest(testRuns, issueKey, this.getXrayEvidence(issueKey));
            xrayTests.push(test);
        }
        if (xrayTests.length === 0) {
            throw new Error(
                "Failed to convert Cypress tests into Xray tests: No Cypress tests to upload"
            );
        }
        return [xrayTests[0], ...xrayTests.slice(1)];
    }

    private async getTestRunData(
        runResults: CypressRunResultType,
        version: "<13" | ">=13"
    ): Promise<TestRunData[]> {
        const conversionPromises: [string, Promise<TestRunData>][] = [];
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
                return getTestRunData_V12(run as RunResult_V12);
            } else {
                return getTestRunData_V13(run as CypressCommandLine.RunResult);
            }
        };
        for (const run of cypressRuns) {
            const testRuns = extractor(run);
            testRuns.forEach((promise, index) =>
                conversionPromises.push([run.tests[index].title.join(" "), promise])
            );
        }
        if (this.parameters.uploadScreenshots) {
            this.addScreenshotEvidence(runResults, version);
        }

        const convertedTests = await Promise.allSettled(
            conversionPromises.map((tuple) => tuple[1])
        );
        const testRunData: TestRunData[] = [];
        convertedTests.forEach((promise, index) => {
            if (promise.status === "fulfilled") {
                testRunData.push(promise.value);
            } else {
                this.logger.message(
                    Level.WARNING,
                    dedent(`
                        Test: ${conversionPromises[index][0]}

                          Skipping result upload.

                            Caused by: ${errorMessage(promise.reason)}
                    `)
                );
            }
        });
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
            for (const [issueKey, screenshots] of allScreenshots.entries()) {
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
                            Level.WARNING,
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
        runs: [TestRunData, ...TestRunData[]],
        issueKey: string,
        evidence: XrayEvidenceItem[]
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
        if (evidence.length > 0) {
            xrayTest.evidence = evidence;
        }
        if (runs.length > 1) {
            const iterations: XrayIterationResult[] = [];
            for (const iteration of runs) {
                iterations.push({
                    parameters: [{ name: "iteration", value: (iterations.length + 1).toString() }],
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

    private getXrayStatus(tests: [TestRunData, ...TestRunData[]]): string {
        const statuses = tests.map((test) => test.status);
        if (statuses.length > 1) {
            const passed = statuses.filter((s) => s === CypressStatus.PASSED).length;
            const failed = statuses.filter((s) => s === CypressStatus.FAILED).length;
            const pending = statuses.filter((s) => s === CypressStatus.PENDING).length;
            const skipped = statuses.filter((s) => s === CypressStatus.SKIPPED).length;
            if (this.parameters.xrayStatus.reduce) {
                return this.parameters.xrayStatus.reduce({ failed, passed, pending, skipped });
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
