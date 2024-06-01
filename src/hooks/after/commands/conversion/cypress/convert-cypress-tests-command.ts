import { basename, parse } from "path";
import { gte, lt } from "semver";
import { EvidenceCollection } from "../../../../../context";
import { RunResult as RunResult_V12 } from "../../../../../types/cypress/12.0.0/api";
import { CypressRunResultType } from "../../../../../types/cypress/cypress";
import {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalPluginOptions,
    InternalXrayOptions,
} from "../../../../../types/plugin";
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
import { getNativeTestIssueKey } from "../../../util";
import { TestRunData, getTestRunData_V12, getTestRunData_V13 } from "./util/run";
import { getXrayStatus } from "./util/status";

interface Parameters {
    jira: Pick<InternalJiraOptions, "projectKey">;
    xray: Pick<InternalXrayOptions, "status" | "uploadScreenshots">;
    plugin: Pick<InternalPluginOptions, "normalizeScreenshotNames">;
    cucumber?: Pick<InternalCucumberOptions, "featureFileExtension">;
    useCloudStatusFallback?: boolean;
    evidenceCollection: EvidenceCollection;
}

export class ConvertCypressTestsCommand extends Command<[XrayTest, ...XrayTest[]], Parameters> {
    private readonly results: Computable<CypressRunResultType>;
    constructor(parameters: Parameters, logger: Logger, results: Computable<CypressRunResultType>) {
        super(parameters, logger);
        this.results = results;
    }

    protected async computeResult(): Promise<[XrayTest, ...XrayTest[]]> {
        const results = await this.results.compute();
        const testRunData = await this.getTestRunData(results);
        const xrayTests: XrayTest[] = [];
        testRunData.forEach((testData: TestRunData) => {
            try {
                const issueKey = getNativeTestIssueKey(
                    testData.title,
                    this.parameters.jira.projectKey
                );
                const test: XrayTest = this.getTest(
                    testData,
                    issueKey,
                    this.getXrayEvidence(issueKey, testData)
                );
                xrayTests.push(test);
            } catch (error: unknown) {
                this.logger.message(
                    Level.WARNING,
                    dedent(`
                        Skipping result upload for test: ${testData.title}

                        ${errorMessage(error)}
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

    private async getTestRunData(runResults: CypressRunResultType): Promise<TestRunData[]> {
        const testRunData: TestRunData[] = [];
        const conversionPromises: [string, Promise<TestRunData>][] = [];
        const cypressRuns = runResults.runs.filter((run) => {
            return (
                !this.parameters.cucumber ||
                !run.spec.relative.endsWith(this.parameters.cucumber.featureFileExtension)
            );
        });
        if (cypressRuns.length === 0) {
            throw new Error("Failed to extract test run data: Only Cucumber tests were executed");
        }
        if (lt(runResults.cypressVersion, "13.0.0")) {
            for (const run of cypressRuns as RunResult_V12[]) {
                getTestRunData_V12(run).forEach((promise, index) =>
                    conversionPromises.push([run.tests[index].title.join(" "), promise])
                );
            }
        } else {
            for (const run of cypressRuns as CypressCommandLine.RunResult[]) {
                getTestRunData_V13(run, this.parameters.jira.projectKey).forEach((promise, index) =>
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
                        Skipping result upload for test: ${conversionPromises[index][0]}

                        ${errorMessage(promise.reason)}
                    `)
                );
            }
        });
        if (this.parameters.xray.uploadScreenshots) {
            if (gte(runResults.cypressVersion, "13.0.0")) {
                for (const run of runResults.runs as CypressCommandLine.RunResult[]) {
                    for (const screenshot of run.screenshots) {
                        if (!this.willBeUploaded(screenshot, testRunData)) {
                            const path = parse(screenshot.path);
                            this.logger.message(
                                Level.WARNING,
                                dedent(`
                                    Screenshot will not be uploaded: ${screenshot.path}

                                    To upload screenshots, include a test issue key anywhere in their names:

                                      cy.screenshot("${this.parameters.jira.projectKey}-123 ${path.name}")
                                `)
                            );
                        }
                    }
                }
            }
        }
        return testRunData;
    }

    private getTest(test: TestRunData, issueKey: string, evidence: XrayEvidenceItem[]): XrayTest {
        // TODO: Support multiple iterations.
        const xrayTest: XrayTest = {
            testKey: issueKey,
            start: truncateIsoTime(test.startedAt.toISOString()),
            finish: truncateIsoTime(
                new Date(test.startedAt.getTime() + test.duration).toISOString()
            ),
            status: getXrayStatus(
                test.status,
                this.parameters.useCloudStatusFallback === true,
                this.parameters.xray.status
            ),
        };
        if (evidence.length > 0) {
            xrayTest.evidence = evidence;
        }
        return xrayTest;
    }

    private getXrayEvidence(issueKey: string, testRunData: TestRunData): XrayEvidenceItem[] {
        const evidence: XrayEvidenceItem[] = [];
        if (this.parameters.xray.uploadScreenshots) {
            for (const screenshot of testRunData.screenshots) {
                let filename = basename(screenshot.filepath);
                if (this.parameters.plugin.normalizeScreenshotNames) {
                    filename = normalizedFilename(filename);
                }
                evidence.push({
                    filename: filename,
                    data: encodeFile(screenshot.filepath),
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
