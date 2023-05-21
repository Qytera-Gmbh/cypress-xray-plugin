import { basename } from "path";
import { CONTEXT } from "../../context";
import { Status } from "../../types/testStatus";
import {
    XrayEvidenceItem,
    XrayTestCloud,
    XrayTestInfoCloud,
} from "../../types/xray/importTestExecutionResults";
import { encodeFile } from "../../util/base64";
import { normalizedFilename } from "../../util/files";
import { ImportExecutionResultsConverter } from "./importExecutionResultsConverter";

/**
 * Converts Cypress run results into Xray Cloud JSON execution results.
 */
export class ImportExecutionResultsConverterCloud extends ImportExecutionResultsConverter<
    XrayTestCloud,
    XrayTestInfoCloud
> {
    protected getTest(attempt: CypressCommandLine.AttemptResult): XrayTestCloud {
        const json: XrayTestCloud = {
            start: this.truncateISOTime(this.getAttemptStartDate(attempt).toISOString()),
            finish: this.truncateISOTime(this.getAttemptEndDate(attempt).toISOString()),
            status: this.getXrayStatus(this.getStatus(attempt)),
        };
        const evidence: XrayEvidenceItem[] = [];
        if (CONTEXT.config.xray.uploadScreenshots) {
            attempt.screenshots.forEach((screenshot: CypressCommandLine.ScreenshotInformation) => {
                let filename = basename(screenshot.path);
                if (CONTEXT.config.plugin.normalizeScreenshotNames) {
                    filename = normalizedFilename(filename);
                }
                evidence.push({
                    filename: filename,
                    data: encodeFile(screenshot.path),
                });
            });
        }
        if (evidence.length > 0) {
            json.evidence = evidence;
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

    protected getTestInfo(testResult: CypressCommandLine.TestResult): XrayTestInfoCloud {
        const testInfo: XrayTestInfoCloud = {
            projectKey: CONTEXT.config.jira.projectKey,
            summary: testResult.title.join(" "),
            type: CONTEXT.config.xray.testType,
        };
        if (CONTEXT.config.xray.steps.update) {
            testInfo.steps = [{ action: this.truncateStepAction(testResult.body) }];
        }
        return testInfo;
    }
}
