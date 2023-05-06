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
    protected getTest(
        attempt: CypressCommandLine.AttemptResult,
        testIssueKey: string
    ): XrayTestServer {
        const json: XrayTestServer = {
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
                        filename: normalizedFilename(basename(suffix)),
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
                return CONTEXT.config.xray.statusPassed || "PASS";
            case Status.FAILED:
                return CONTEXT.config.xray.statusFailed || "FAIL";
            default:
                throw new Error(`Unknown Cypress test status: ${status}`);
        }
    }

    protected getTestInfo(
        testResult: CypressCommandLine.TestResult
    ): XrayTestInfoServer {
        return {
            projectKey: CONTEXT.config.jira.projectKey,
            summary: testResult.title.join(" "),
            testType: CONTEXT.config.xray.testType,
        };
    }
}
