import Path, { basename } from "path";
import { gte, lt } from "semver";
import { logWarning } from "../../logging/logging";
import { getNativeTestIssueKey } from "../../preprocessing/preprocessing";
import {
    CypressRunResult as CypressRunResult_V12,
    RunResult as RunResult_V12,
} from "../../types/cypress/12.0.0/api";
import {
    CypressRunResult as CypressRunResult_V13,
    RunResult as RunResult_V13,
    ScreenshotInformation as ScreenshotInformation_V13,
} from "../../types/cypress/13.0.0/api";
import {
    XrayEvidenceItem,
    XrayTestCloud,
    XrayTestServer,
} from "../../types/xray/importTestExecutionResults";
import { encodeFile } from "../../util/base64";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/error";
import { normalizedFilename } from "../../util/files";
import { Converter } from "../converter";
import { TestIssueData } from "./importExecutionConverter";
import { ITestRunData, getTestRunData_V12, getTestRunData_V13 } from "./runConversion";

export abstract class TestConverter<
    XrayTestType extends XrayTestServer | XrayTestCloud
> extends Converter<
    CypressRunResult_V12 | CypressRunResult_V13,
    [XrayTestType, ...XrayTestType[]],
    TestIssueData
> {
    public async convert(
        runResults: CypressRunResult_V12 | CypressRunResult_V13,
        issueData?: TestIssueData
    ): Promise<[XrayTestType, ...XrayTestType[]]> {
        const testRunData = await this.getTestRunData(runResults);
        const xrayTests: XrayTestType[] = [];
        testRunData.forEach((testData: ITestRunData) => {
            try {
                const issueKey = getNativeTestIssueKey(
                    testData.title,
                    this.options.jira.projectKey
                );
                if (!issueData?.summaries[issueKey]) {
                    throw new Error(`Summary of corresponding issue is unknown: ${issueKey}`);
                }
                if (!issueData?.testTypes[issueKey]) {
                    throw new Error(`Test type of corresponding issue is unknown: ${issueKey}`);
                }
                const test: XrayTestType = this.getTest(
                    testData,
                    issueKey,
                    {
                        summary: issueData.summaries[issueKey],
                        testType: issueData.testTypes[issueKey],
                    },
                    this.getXrayEvidence(testData)
                );
                xrayTests.push(test);
            } catch (error: unknown) {
                logWarning(
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

    protected abstract getTest(
        test: ITestRunData,
        issueKey: string,
        issueData: {
            summary: string;
            testType: string;
        },
        evidence: XrayEvidenceItem[]
    ): XrayTestType;

    private async getTestRunData(
        runResults: CypressRunResult_V12 | CypressRunResult_V13
    ): Promise<ITestRunData[]> {
        const testRunData: ITestRunData[] = [];
        const conversionPromises: [string, Promise<ITestRunData>][] = [];
        if (lt(runResults.cypressVersion, "13.0.0")) {
            const runs = runResults.runs as RunResult_V12[];
            if (
                runs.every((run: RunResult_V12) => {
                    return run.spec.relative.endsWith(this.options.cucumber.featureFileExtension);
                })
            ) {
                throw new Error("Failed to extract test run data: No Cypress tests were executed");
            }
            for (const run of runs) {
                getTestRunData_V12(run).forEach((promise, index) =>
                    conversionPromises.push([run.tests[index].title.join(" "), promise])
                );
            }
        } else {
            const runs = runResults.runs as RunResult_V13[];
            if (
                runs.every((run: RunResult_V13) => {
                    return run.spec.relative.endsWith(this.options.cucumber.featureFileExtension);
                })
            ) {
                throw new Error("Failed to extract test run data: No Cypress tests were executed");
            }
            for (const run of runs) {
                getTestRunData_V13(run, this.options.jira.projectKey).forEach((promise, index) =>
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
                logWarning(
                    dedent(`
                        Skipping result upload for test: ${conversionPromises[index][0]}

                        ${errorMessage(promise.reason)}
                    `)
                );
            }
        });
        if (this.options.xray.uploadScreenshots) {
            if (gte(runResults.cypressVersion, "13.0.0")) {
                for (const run of runResults.runs as RunResult_V13[]) {
                    for (const screenshot of run.screenshots) {
                        if (!this.willBeUploaded(screenshot, testRunData)) {
                            const path = Path.parse(screenshot.path);
                            logWarning(
                                dedent(`
                                    Screenshot will not be uploaded: ${screenshot.path}

                                    Its filename does not contain a test issue key.
                                    To upload screenshots, include a test issue key anywhere in their names:

                                    cy.screenshot("${this.options.jira.projectKey}-123 ${path.name}")
                                `)
                            );
                        }
                    }
                }
            }
        }
        return testRunData;
    }

    private getXrayEvidence(testRunData: ITestRunData): XrayEvidenceItem[] {
        const evidence: XrayEvidenceItem[] = [];
        if (this.options.xray.uploadScreenshots) {
            for (const screenshot of testRunData.screenshots) {
                let filename = basename(screenshot.filepath);
                if (this.options.plugin.normalizeScreenshotNames) {
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
        testRunData: ITestRunData[]
    ): boolean {
        return testRunData.some((testRunData) => {
            return testRunData.screenshots.some(({ filepath }) => {
                return screenshot.path === filepath;
            });
        });
    }
}
