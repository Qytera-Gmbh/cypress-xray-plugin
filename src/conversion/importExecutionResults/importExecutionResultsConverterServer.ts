import { basename } from "path";
import { Status } from "../../types/testStatus";
import {
    XrayEvidenceItem,
    XrayTestInfoServer,
    XrayTestServer,
} from "../../types/xray/importTestExecutionResults";
import { encodeFile } from "../../util/base64";
import { normalizedFilename } from "../../util/files";
import { ImportExecutionResultsConverter } from "./importExecutionResultsConverter";

/**
 * Converts Cypress run results into Xray Server JSON execution results.
 */
export class ImportExecutionResultsConverterServer extends ImportExecutionResultsConverter<
    XrayTestServer,
    XrayTestInfoServer
> {
    protected getTest(attempt: CypressCommandLine.AttemptResult): XrayTestServer {
        const json: XrayTestServer = {
            start: this.truncateISOTime(this.getAttemptStartDate(attempt).toISOString()),
            finish: this.truncateISOTime(this.getAttemptEndDate(attempt).toISOString()),
            status: this.getXrayStatus(this.getStatus(attempt)),
        };
        const evidence: XrayEvidenceItem[] = [];
        if (this.options.xray.uploadScreenshots) {
            attempt.screenshots.forEach((screenshot: CypressCommandLine.ScreenshotInformation) => {
                let filename: string = basename(screenshot.path);
                if (this.options.plugin.normalizeScreenshotNames) {
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
                return this.options.xray.statusPassed ?? "PASS";
            case Status.FAILED:
                return this.options.xray.statusFailed ?? "FAIL";
            case Status.PENDING:
                return this.options.xray.statusPending ?? "TODO";
            case Status.SKIPPED:
                return this.options.xray.statusSkipped ?? "FAIL";
            default:
                throw new Error(`Unknown status: '${status}'`);
        }
    }

    protected getTestInfo(testResult: CypressCommandLine.TestResult): XrayTestInfoServer {
        const testInfo: XrayTestInfoServer = {
            projectKey: this.options.jira.projectKey,
            summary: testResult.title.join(" "),
            testType: this.options.xray.testType,
        };
        if (this.options.xray.steps.update) {
            testInfo.steps = [{ action: this.truncateStepAction(testResult.body) }];
        }
        return testInfo;
    }
}
