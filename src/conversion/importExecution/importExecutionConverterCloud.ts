import { basename } from "path";
import { Status } from "../../types/testStatus";
import {
    XrayEvidenceItem,
    XrayTestCloud,
    XrayTestExecutionResultsCloud,
    XrayTestInfoCloud,
} from "../../types/xray/importTestExecutionResults";
import { encodeFile } from "../../util/base64";
import { normalizedFilename } from "../../util/files";
import { ImportExecutionConverter } from "./importExecutionConverter";

/**
 * Converts Cypress run results into Xray Cloud JSON execution results.
 */
export class ImportExecutionConverterCloud extends ImportExecutionConverter<
    XrayTestCloud,
    XrayTestInfoCloud,
    XrayTestExecutionResultsCloud
> {
    protected initResult(): XrayTestExecutionResultsCloud {
        return {
            testExecutionKey: this.options.jira.testExecutionIssueKey,
        };
    }

    protected getTest(attempt: CypressCommandLine.AttemptResult): XrayTestCloud {
        const json: XrayTestCloud = {
            start: this.truncateISOTime(this.getAttemptStartDate(attempt).toISOString()),
            finish: this.truncateISOTime(this.getAttemptEndDate(attempt).toISOString()),
            status: this.getXrayStatus(this.getStatus(attempt)),
        };
        const evidence: XrayEvidenceItem[] = [];
        if (this.options.xray.uploadScreenshots) {
            attempt.screenshots.forEach((screenshot: CypressCommandLine.ScreenshotInformation) => {
                let filename = basename(screenshot.path);
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

    protected addTest(results: XrayTestExecutionResultsCloud, test: XrayTestCloud): void {
        if (!results.tests) {
            results.tests = [test];
        } else {
            results.tests.push(test);
        }
    }

    protected getXrayStatus(status: Status): string {
        switch (status) {
            case Status.PASSED:
                return this.options.xray.statusPassed ?? "PASSED";
            case Status.FAILED:
                return this.options.xray.statusFailed ?? "FAILED";
            case Status.PENDING:
                return this.options.xray.statusPending ?? "TODO";
            case Status.SKIPPED:
                return this.options.xray.statusSkipped ?? "FAILED";
            default:
                throw new Error(`Unknown status: ${status}`);
        }
    }

    protected getTestInfo(testResult: CypressCommandLine.TestResult): XrayTestInfoCloud {
        const testInfo: XrayTestInfoCloud = {
            projectKey: this.options.jira.projectKey,
            summary: testResult.title.join(" "),
            type: this.options.xray.testType,
        };
        if (this.options.xray.steps.update) {
            testInfo.steps = [{ action: this.truncateStepAction(testResult.body) }];
        }
        return testInfo;
    }
}
