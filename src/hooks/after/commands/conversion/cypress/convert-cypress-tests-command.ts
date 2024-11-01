import path from "node:path";
import { lt } from "semver";
import { EvidenceCollection } from "../../../../../context";
import { RunResult as RunResult_V12 } from "../../../../../types/cypress/12.0.0/api";
import { CypressRunResultType } from "../../../../../types/cypress/cypress";
import { InternalXrayOptions } from "../../../../../types/plugin";
import {
    XrayEvidenceItem,
    XrayTest,
} from "../../../../../types/xray/import-test-execution-results";
import { encodeFile } from "../../../../../util/base64";
import { dedent } from "../../../../../util/dedent";
import { errorMessage } from "../../../../../util/errors";
import { normalizedFilename } from "../../../../../util/files";
import { Level, Logger } from "../../../../../util/logging";
import { truncateIsoTime } from "../../../../../util/time";
import { Command, Computable } from "../../../../command";
import { getTestIssueKeys } from "../../../util";
import { TestRunData, getTestRunData_V12, getTestRunData_V13 } from "./util/run";
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
        testRunData.forEach((testData: TestRunData) => {
            try {
                const issueKeys = getTestIssueKeys(testData.title, this.parameters.projectKey);
                for (const issueKey of issueKeys) {
                    const test: XrayTest = this.getTest(
                        testData,
                        issueKey,
                        this.getXrayEvidence(issueKey, testData, version)
                    );
                    xrayTests.push(test);
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
        const testRunData: TestRunData[] = [];
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
        if (version === "<13") {
            for (const run of cypressRuns as RunResult_V12[]) {
                getTestRunData_V12(run).forEach((promise, index) =>
                    conversionPromises.push([run.tests[index].title.join(" "), promise])
                );
            }
        } else {
            for (const run of cypressRuns as CypressCommandLine.RunResult[]) {
                getTestRunData_V13(run, this.parameters.projectKey).forEach((promise, index) =>
                    conversionPromises.push([run.tests[index].title.join(" "), promise])
                );
            }
        }
        const convertedTests = await Promise.allSettled(
            conversionPromises.map((tuple) => tuple[1])
        );
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
        if (this.parameters.uploadScreenshots && version === ">=13") {
            for (const run of runResults.runs as CypressCommandLine.RunResult[]) {
                if (
                    this.parameters.featureFileExtension &&
                    run.spec.fileExtension.endsWith(this.parameters.featureFileExtension)
                ) {
                    continue;
                }
                for (const screenshot of run.screenshots) {
                    if (!this.willBeUploaded(screenshot, testRunData)) {
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
        return testRunData;
    }

    private getTest(test: TestRunData, issueKey: string, evidence: XrayEvidenceItem[]): XrayTest {
        // TODO: Support multiple iterations.
        const xrayTest: XrayTest = {
            finish: truncateIsoTime(
                new Date(test.startedAt.getTime() + test.duration).toISOString()
            ),
            start: truncateIsoTime(test.startedAt.toISOString()),
            status: getXrayStatus(
                test.status,
                this.parameters.useCloudStatusFallback === true,
                this.parameters.xrayStatus
            ),
            testKey: issueKey,
        };
        if (evidence.length > 0) {
            xrayTest.evidence = evidence;
        }
        return xrayTest;
    }

    private getXrayEvidence(
        issueKey: string,
        testRunData: TestRunData,
        version: "<13" | ">=13"
    ): XrayEvidenceItem[] {
        const evidence: XrayEvidenceItem[] = [];
        if (this.parameters.uploadScreenshots) {
            for (const screenshot of testRunData.screenshots) {
                let filename = path.basename(screenshot.filepath);
                if (version === ">=13" && !filename.includes(issueKey)) {
                    continue;
                }
                if (this.parameters.normalizeScreenshotNames) {
                    filename = normalizedFilename(filename);
                }
                evidence.push({
                    data: encodeFile(screenshot.filepath),
                    filename: filename,
                });
            }
        }
        this.parameters.evidenceCollection
            .getEvidence(issueKey)
            .forEach((item) => evidence.push(item));
        return evidence;
    }

    private willBeUploaded(
        screenshot: CypressCommandLine.ScreenshotInformation,
        testRunData: TestRunData[]
    ): boolean {
        return testRunData.some((testRun: TestRunData) => {
            return testRun.screenshots.some(({ filepath }) => {
                return screenshot.path === filepath;
            });
        });
    }
}
