import { basename } from "path";
import { lt } from "semver";
import { logWarning } from "../../logging/logging";
import { getNativeTestIssueKey } from "../../preprocessing/preprocessing";
import {
    CypressRunResult as CypressRunResult_V12,
    RunResult as RunResult_V12,
} from "../../types/cypress/12.16.0/api";
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
import { normalizedFilename } from "../../util/files";
import { Converter } from "../converter";
import { TestIssueData } from "./importExecutionConverter";
import { ITestRunData, getTestRunData_V12, getTestRunData_V13 } from "./testConversion";

export abstract class TestConverter<
    XrayTestType extends XrayTestServer | XrayTestCloud
> extends Converter<
    CypressRunResult_V12 | CypressRunResult_V13,
    [XrayTestType, ...XrayTestType[]],
    TestIssueData
> {
    public async convert(
        run: CypressRunResult_V12 | CypressRunResult_V13,
        issueData?: TestIssueData
    ): Promise<[XrayTestType, ...XrayTestType[]]> {
        let testRunData: ITestRunData[];
        if (lt(run.cypressVersion, "13.0.0")) {
            testRunData = getTestRunData_V12(run.runs as RunResult_V12[]);
        } else {
            const runResults = run.runs as RunResult_V13[];
            testRunData = getTestRunData_V13(runResults, this.options.jira.projectKey);
            for (const runResult of runResults) {
                for (const screenshot of runResult.screenshots) {
                    if (!this.willBeUploaded(screenshot, testRunData)) {
                        logWarning(
                            dedent(`
                                Screenshot will not be uploaded: ${screenshot.path}

                                Its filename neither contains the title of any test, nor a test issue key.
                                To consistently upload manually taken screenshots, include a test issue key anywhere in their name:

                                cy.screenshot("${this.options.jira.projectKey}-123 after login")
                            `)
                        );
                    }
                }
            }
        }
        let xrayTests: [XrayTestType, ...XrayTestType[]];
        testRunData.forEach((testData: ITestRunData) => {
            try {
                const issueKey = getNativeTestIssueKey(
                    testData.title,
                    this.options.jira.projectKey
                );
                const test: XrayTestType = this.getTest(
                    testData,
                    issueKey,
                    issueData,
                    this.getXrayEvidence(testData)
                );
                if (!xrayTests) {
                    xrayTests = [test];
                } else {
                    xrayTests.push(test);
                }
            } catch (error: unknown) {
                let reason = error;
                if (error instanceof Error) {
                    reason = error.message;
                }
                logWarning(
                    dedent(`
                        Skipping result upload for test: ${testData.title}

                        ${reason}
                    `)
                );
            }
        });
        return xrayTests;
    }

    protected abstract getTest(
        test: ITestRunData,
        issueKey: string,
        issueData?: TestIssueData,
        evidence?: XrayEvidenceItem[]
    ): XrayTestType;

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
