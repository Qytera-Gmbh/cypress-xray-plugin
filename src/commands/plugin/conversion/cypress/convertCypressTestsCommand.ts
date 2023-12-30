import { basename, parse } from "path";
import { gte, lt } from "semver";
import { LOG, Level } from "../../../../logging/logging";
import { getNativeTestIssueKey } from "../../../../preprocessing/preprocessing";
import {
    CypressRunResult as CypressRunResult_V12,
    RunResult as RunResult_V12,
} from "../../../../types/cypress/12.0.0/api";
import {
    CypressRunResult as CypressRunResult_V13,
    RunResult as RunResult_V13,
    ScreenshotInformation as ScreenshotInformation_V13,
} from "../../../../types/cypress/13.0.0/api";
import { CypressRunResultType } from "../../../../types/cypress/runResult";
import {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalPluginOptions,
    InternalXrayOptions,
} from "../../../../types/plugin";
import { XrayEvidenceItem, XrayTest } from "../../../../types/xray/importTestExecutionResults";
import { encodeFile } from "../../../../util/base64";
import { dedent } from "../../../../util/dedent";
import { errorMessage } from "../../../../util/errors";
import { normalizedFilename } from "../../../../util/files";
import { truncateIsoTime } from "../../../../util/time";
import { Command, Computable } from "../../../command";
import { TestRunData, getTestRunData_V12, getTestRunData_V13 } from "./util/run";
import { getXrayStatus } from "./util/status";

interface Parameters {
    jira: Pick<InternalJiraOptions, "projectKey">;
    xray: Pick<InternalXrayOptions, "status" | "uploadScreenshots">;
    plugin: Pick<InternalPluginOptions, "normalizeScreenshotNames">;
    cucumber?: Pick<InternalCucumberOptions, "featureFileExtension">;
    useCloudStatusFallback?: boolean;
}

export class ConvertCypressTestsCommand extends Command<[XrayTest, ...XrayTest[]]> {
    protected readonly parameters: Parameters;
    private readonly results: Computable<CypressRunResultType>;
    constructor(parameters: Parameters, results: Computable<CypressRunResultType>) {
        super();
        this.parameters = parameters;
        this.results = results;
    }

    public getParameters(): Parameters {
        return this.parameters;
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
                    this.getXrayEvidence(testData)
                );
                xrayTests.push(test);
            } catch (error: unknown) {
                LOG.message(
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

    private async getTestRunData(
        runResults: CypressRunResult_V12 | CypressRunResult_V13
    ): Promise<TestRunData[]> {
        const testRunData: TestRunData[] = [];
        const conversionPromises: [string, Promise<TestRunData>][] = [];
        const cypressRuns = runResults.runs.filter((run: RunResult_V12 | RunResult_V13) => {
            return (
                !this.parameters.cucumber ||
                !run.spec.relative.endsWith(this.parameters.cucumber.featureFileExtension)
            );
        });
        if (cypressRuns.length === 0) {
            throw new Error("Failed to extract test run data: Only Cucumber tests were executed");
        }
        if (lt(runResults.cypressVersion, "13.0.0")) {
            const runs = cypressRuns as RunResult_V12[];
            for (const run of runs) {
                getTestRunData_V12(run).forEach((promise, index) =>
                    conversionPromises.push([run.tests[index].title.join(" "), promise])
                );
            }
        } else {
            const runs = cypressRuns as RunResult_V13[];
            for (const run of runs) {
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
                LOG.message(
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
                for (const run of cypressRuns as RunResult_V13[]) {
                    for (const screenshot of run.screenshots) {
                        if (!this.willBeUploaded(screenshot, testRunData)) {
                            const path = parse(screenshot.path);
                            LOG.message(
                                Level.WARNING,
                                dedent(`
                                    Screenshot will not be uploaded: ${screenshot.path}

                                    Its filename does not contain a test issue key.
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

    private getXrayEvidence(testRunData: TestRunData): XrayEvidenceItem[] {
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
        return evidence;
    }

    private willBeUploaded(
        screenshot: ScreenshotInformation_V13,
        testRunData: TestRunData[]
    ): boolean {
        return testRunData.some((testRun: TestRunData) => {
            return testRun.screenshots.some(({ filepath }) => {
                return screenshot.path === filepath;
            });
        });
    }
}
