import { CONTEXT } from "../../context";
import { logWarning } from "../../logging/logging";
import { Status } from "../../types/testStatus";
import {
    XrayEvidenceItem,
    XrayIterationResultServer,
    XrayTestInfoServer,
    XrayTestServer,
} from "../../types/xray/importTestExecutionResults";
import { encodeFile } from "../../util/base64";
import { ImportExecutionResultsConverter } from "./importExecutionResultsConverter";

/**
 * Converts Cypress run results into Xray Server JSON execution results.
 */
export class ImportExecutionResultsConverterServer extends ImportExecutionResultsConverter<
    XrayTestServer,
    XrayTestInfoServer
> {
    protected getSingleTest(
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
            status: this.getXrayStatus(this.getStatusFromSingleTest(attempt)),
        };
        const evidence: XrayEvidenceItem[] = [];
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
        if (evidence.length > 0) {
            if (!json.evidence) {
                json.evidence = [];
            }
            json.evidence = [...json.evidence, ...evidence];
        }
        return json;
    }

    protected getIteratedTest(
        attempts: CypressCommandLine.AttemptResult[],
        testIssueKey: string
    ): XrayTestServer {
        const json: XrayTestServer = {
            testKey: testIssueKey,
            start: this.truncateISOTime(
                this.getAttemptsStartDate(attempts).toISOString()
            ),
            finish: this.truncateISOTime(
                this.getAttemptsEndDate(attempts).toISOString()
            ),
            status: this.getXrayStatus(
                this.getStatusFromIteratedTest(attempts)
            ),
        };
        json.iterations = [];
        attempts.forEach((attempt: CypressCommandLine.AttemptResult) => {
            const iteration: XrayIterationResultServer = {
                status: this.getXrayStatus(
                    this.getStatusFromSingleTest(attempt)
                ),
                steps: [],
            };
            const evidence: XrayEvidenceItem[] = [];
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
            if (evidence.length > 0) {
                iteration.steps[0].evidences = evidence;
            }
        });
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

    protected getTestInfoFromSingleTest(
        testResult: CypressCommandLine.TestResult
    ): XrayTestInfoServer {
        return {
            projectKey: CONTEXT.config.jira.projectKey,
            summary: testResult.title.join(" "),
            testType: CONTEXT.config.xray.testType,
        };
    }

    protected getTestInfoFromMultipleTests(
        testResult: CypressCommandLine.TestResult[],
        testIssueKey: string
    ): XrayTestInfoServer {
        const summaries = new Set<string>(
            testResult.map((result) => result.title.join(" "))
        );
        const summary: string = summaries.values().next().value;
        if (summaries.size > 1) {
            logWarning(
                `Found multiple potential issue summaries for ${testIssueKey}: ${summaries}. Choosing "${summary}".`
            );
        }
        const steps = new Set<string>(testResult.map((result) => result.body));
        const step: string = steps.values().next().value;
        if (steps.size > 1) {
            logWarning(
                `Found multiple potential steps for ${testIssueKey}: ${steps}. Choosing "${step}".`
            );
        }
        return {
            projectKey: CONTEXT.config.jira.projectKey,
            summary: summary,
            testType: CONTEXT.config.xray.testType,
            steps: [{ action: step }],
        };
    }
}
