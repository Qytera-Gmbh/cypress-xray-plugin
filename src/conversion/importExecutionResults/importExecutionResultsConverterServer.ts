import { basename } from "path";
import { CONTEXT } from "../../context";
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
        if (CONTEXT.config.xray.uploadScreenshots) {
            attempt.screenshots.forEach((screenshot: CypressCommandLine.ScreenshotInformation) => {
                let filename: string = basename(screenshot.path);
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
                return CONTEXT.config.xray.statusPassed || "PASS";
            case Status.FAILED:
                return CONTEXT.config.xray.statusFailed || "FAIL";
            case Status.PENDING:
                return CONTEXT.config.xray.statusPending || "TODO";
            case Status.SKIPPED:
                return CONTEXT.config.xray.statusSkipped || "FAIL";
            default:
                throw new Error(`Unknown status: '${status}'`);
        }
    }

    protected getTestInfo(testResult: CypressCommandLine.TestResult): XrayTestInfoServer {
        const testInfo: XrayTestInfoServer = {
            projectKey: CONTEXT.config.jira.projectKey,
            summary: testResult.title.join(" "),
            testType: CONTEXT.config.xray.testType,
        };
        if (CONTEXT.config.xray.steps.update) {
            testInfo.steps = [{ action: this.truncateStepAction(testResult.body) }];
        }
        return testInfo;
    }
}
