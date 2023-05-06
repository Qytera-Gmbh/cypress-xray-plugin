import { CONTEXT } from "../../context";
import { Status } from "../../types/testStatus";
import {
    XrayEvidenceItem,
    XrayTestCloud,
    XrayTestInfoCloud,
} from "../../types/xray/importTestExecutionResults";
import { encodeFile } from "../../util/base64";
import { ImportExecutionResultsConverter } from "./importExecutionResultsConverter";

/**
 * Converts Cypress run results into Xray Cloud JSON execution results.
 */
export class ImportExecutionResultsConverterCloud extends ImportExecutionResultsConverter<
    XrayTestCloud,
    XrayTestInfoCloud
> {
    protected getTest(
        attempt: CypressCommandLine.AttemptResult,
        testIssueKey: string
    ): XrayTestCloud {
        const json: XrayTestCloud = {
            testKey: testIssueKey,
            start: this.truncateISOTime(
                this.getAttemptStartDate(attempt).toISOString()
            ),
            finish: this.truncateISOTime(
                this.getAttemptEndDate(attempt).toISOString()
            ),
            status: this.getXrayStatus(this.getStatus(attempt)),
        };
        const evidence: XrayEvidenceItem[] = [];
        if (CONTEXT.config.xray.uploadScreenshots) {
            attempt.screenshots.forEach(
                (screenshot: CypressCommandLine.ScreenshotInformation) => {
                    const suffix = screenshot.path.substring(
                        screenshot.path.indexOf("cypress")
                    );
                    evidence.push({
                        filename: this.normalizedFilename(suffix),
                        data: encodeFile(screenshot.path),
                    });
                }
            );
        }
        if (evidence.length > 0) {
            if (!json.evidence) {
                json.evidence = [];
            }
            json.evidence = [...json.evidence, ...evidence];
        }
        return json;
    }

    protected getXrayStatus(status: Status): string {
        switch (status) {
            case Status.PASSED:
                return CONTEXT.config.xray.statusPassed || "PASSED";
            case Status.FAILED:
                return CONTEXT.config.xray.statusFailed || "FAILED";
            default:
                throw new Error(`Unknown status: ${status}`);
        }
    }

    protected getTestInfo(
        testResult: CypressCommandLine.TestResult
    ): XrayTestInfoCloud {
        return {
            projectKey: CONTEXT.config.jira.projectKey,
            summary: testResult.title.join(" "),
            type: CONTEXT.config.xray.testType,
            steps: [{ action: testResult.body }],
        };
    }
}
