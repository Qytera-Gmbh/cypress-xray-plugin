import { basename } from "path";
import { CONTEXT } from "../../context";
import { logWarning } from "../../logging/logging";
import { Status } from "../../types/testStatus";
import { DateTimeISO, OneOf } from "../../types/util";
import {
    XrayTestCloud,
    XrayTestExecutionInfo,
    XrayTestExecutionResults,
    XrayTestInfoCloud,
    XrayTestInfoServer,
    XrayTestServer,
} from "../../types/xray/importTestExecutionResults";

/**
 * @template XrayTestType - the Xray test type
 * @template XrayTestInfoType - the Xray test information type
 */
export abstract class ImportExecutionResultsConverter<
    XrayTestType extends OneOf<[XrayTestServer, XrayTestCloud]>,
    XrayTestInfoType extends OneOf<[XrayTestInfoServer, XrayTestInfoCloud]>
> {
    /**
     * Convert Cypress run results into Xray JSON format, ready to be sent to
     * Xray's import execution results endpoint.
     *
     * @param results the run results
     * @returns the Xray JSON data
     */
    public convertExecutionResults(
        results: CypressCommandLine.CypressRunResult
    ): XrayTestExecutionResults<XrayTestType> {
        const json: XrayTestExecutionResults<XrayTestType> = {
            testExecutionKey: CONTEXT.config.jira.testExecutionIssueKey,
        };
        json.info = this.getTestExecutionInfo(results);
        const testsByIssueKey = this.mapTestsToIssueKeys(results);
        const attemptsByIssueKey = this.mapAttemptsToIssueKeys(testsByIssueKey);
        testsByIssueKey.forEach(
            (tests: CypressCommandLine.TestResult[], key: string) => {
                let test: XrayTestType;
                const attempts = attemptsByIssueKey.get(key);
                try {
                    test = this.getTest(attempts[attempts.length - 1], key);
                    if (CONTEXT.config.plugin.overwriteIssueSummary) {
                        test.testInfo = this.getTestInfo(
                            tests[tests.length - 1]
                        );
                    }
                    if (!json.tests) {
                        json.tests = [test];
                    } else {
                        json.tests.push(test);
                    }
                } catch (error: unknown) {
                    let reason = error;
                    if (error instanceof Error) {
                        reason = error.message;
                    }
                    logWarning(
                        `${reason}. Skipping result upload for test ${key}.`
                    );
                }
            }
        );
        return json;
    }

    /**
     * Builds a test entity for an executed test.
     *
     * @param testResult the Cypress test result
     * @param testIssueKey the test's Jira issue key
     * @return the test entity
     */
    protected abstract getTest(
        attempt: CypressCommandLine.AttemptResult,
        testIssueKey: string
    ): XrayTestType;

    /**
     * Extract the Xray status from a {@link Status} value.
     *
     * @param attempt the status value
     * @returns the corresponding Xray test status
     */
    protected abstract getXrayStatus(status: Status): string;

    /**
     * Constructs an {@link XrayTestInfoType} object based on a single
     * {@link CypressCommandLine.TestResult}.
     *
     * @param testResult the Cypress test result
     * @returns the test information
     */
    protected abstract getTestInfo(
        testResult: CypressCommandLine.TestResult
    ): XrayTestInfoType;

    /**
     * Remove milliseconds from ISO time string. Some Jira Xray instances cannot handle milliseconds in the string.
     *
     * @param time a date time string in ISO format
     * @returns the truncated date time string
     * @example
     *   const time = truncateISOTime("2022-12-01T02:30:44.744Z")
     *   console.log(time); // "2022-12-01T02:30:44Z"
     */
    protected truncateISOTime(time: DateTimeISO): string {
        return time.split(".")[0] + "Z";
    }

    /**
     * Normalizes a filename by replacing invalid character sequences with `_`.
     *
     * @param filename any filename
     * @returns the normalized filename
     */
    protected normalizedFilename(filename: string): string {
        let normalizedFilename = basename(filename);
        if (CONTEXT.config.plugin.normalizeScreenshotNames) {
            normalizedFilename = normalizedFilename.replaceAll(
                /[^\.a-zA-Z0-9]+/g,
                "_"
            );
        }
        return normalizedFilename;
    }

    /**
     * Retrieve the overall start date of multiple Cypress test results.
     *
     * @param attempts the Cypress test results
     * @returns the tests' start date
     */
    protected getAttemptsStartDate(
        attempts: CypressCommandLine.AttemptResult[]
    ): Date | null {
        let start: Date = null;
        attempts.forEach((attempt: CypressCommandLine.AttemptResult) => {
            const attemptDate = this.getAttemptStartDate(attempt);
            if (!start || attemptDate < start) {
                start = attemptDate;
            }
        });
        return start;
    }

    /**
     * Retrieve the start date of a single Cypress test result.
     *
     * @param attempt the Cypress test result
     * @returns the test's start date
     */
    protected getAttemptStartDate(
        attempt: CypressCommandLine.AttemptResult
    ): Date {
        return new Date(attempt.startedAt);
    }

    /**
     * Retrieve the end date of multiple Cypress test results.
     *
     * @param attempts the Cypress test results
     * @returns the tests' end date
     */
    protected getAttemptsEndDate(
        attempts: CypressCommandLine.AttemptResult[]
    ): Date | null {
        let end: Date = null;
        attempts.forEach((attempt: CypressCommandLine.AttemptResult) => {
            const attemptEndDate = this.getAttemptEndDate(attempt);
            if (!end || attemptEndDate > end) {
                end = attemptEndDate;
            }
        });
        return end;
    }

    /**
     * Retrieve the end date of a single Cypress test result.
     *
     * @param attempt the Cypress test result
     * @returns the test's end date
     */
    protected getAttemptEndDate(
        attempt: CypressCommandLine.AttemptResult
    ): Date {
        const date = this.getAttemptStartDate(attempt);
        date.setMilliseconds(date.getMilliseconds() + attempt.duration);
        return date;
    }

    /**
     * Returns a {@link Status} enum value for a single Cypress test result.
     *
     * @param attempt the Cypress test result
     * @returns a corresponding status
     */
    protected getStatus(attempt: CypressCommandLine.AttemptResult): Status {
        switch (attempt.state) {
            case "passed":
                return Status.PASSED;
            case "failed":
                return Status.FAILED;
            default:
                throw new Error(
                    `Unknown Cypress test status: ${attempt.state}`
                );
        }
    }

    private mapTestsToIssueKeys(
        results: CypressCommandLine.CypressRunResult
    ): Map<string, CypressCommandLine.TestResult[]> {
        const map = new Map<string, CypressCommandLine.TestResult[]>();
        results.runs.forEach((run: CypressCommandLine.RunResult) => {
            run.tests.forEach((result: CypressCommandLine.TestResult) => {
                try {
                    const testIssueKey = this.getTestIssueKey(result);
                    if (!testIssueKey) {
                        const title = result.title.join(" ");
                        throw new Error(
                            `No test issue key found for test "${title}"`
                        );
                    }
                    if (!map.has(testIssueKey)) {
                        map.set(testIssueKey, [result]);
                    } else {
                        map.get(testIssueKey).push(result);
                    }
                } catch (error: unknown) {
                    let reason = error;
                    if (error instanceof Error) {
                        reason = error.message;
                    }
                    logWarning(
                        `${reason}. Skipping result upload for this test.`
                    );
                }
            });
        });
        return map;
    }

    private mapAttemptsToIssueKeys(
        resultsByIssueKey: Map<string, CypressCommandLine.TestResult[]>
    ): Map<string, CypressCommandLine.AttemptResult[]> {
        const map = new Map<string, CypressCommandLine.AttemptResult[]>();
        resultsByIssueKey.forEach(
            (value: CypressCommandLine.TestResult[], key: string) => {
                value.forEach((result: CypressCommandLine.TestResult) => {
                    result.attempts.forEach(
                        (attempt: CypressCommandLine.AttemptResult) => {
                            if (!map.has(key)) {
                                map.set(key, [attempt]);
                            } else {
                                map.get(key).push(attempt);
                            }
                        }
                    );
                });
            }
        );
        return map;
    }

    private getTestExecutionInfo(
        results: CypressCommandLine.CypressRunResult
    ): XrayTestExecutionInfo {
        return {
            project: CONTEXT.config.jira.projectKey,
            startDate: this.truncateISOTime(results.startedTestsAt),
            finishDate: this.truncateISOTime(results.endedTestsAt),
            description: this.getDescription(results),
            summary: this.getTextExecutionResultSummary(results),
            testPlanKey: CONTEXT.config.jira.testPlanIssueKey,
        };
    }

    private getTextExecutionResultSummary(
        results: CypressCommandLine.CypressRunResult
    ): string {
        return `Execution Results [${Date.now()}]`;
    }

    private getDescription(
        results: CypressCommandLine.CypressRunResult
    ): string {
        return (
            "Cypress version: " +
            results.cypressVersion +
            " Browser: " +
            results.browserName +
            " (" +
            results.browserVersion +
            ")"
        );
    }

    private getTestIssueKey(
        testResult: CypressCommandLine.TestResult
    ): string | null {
        const regex = new RegExp(
            `(${CONTEXT.config.jira.projectKey}-\\d+)`,
            "g"
        );
        // The last element usually refers to an individual test.
        // The ones before might be test suite titles.
        const testCaseTitle = testResult.title[testResult.title.length - 1];
        const matches = testCaseTitle.match(regex);
        if (!matches) {
            // Test case title does not contain the issue's key.
            // Maybe it was provided via Cucumber as a scenario tag?
            if (
                CONTEXT.config.cucumber.issues &&
                testCaseTitle in CONTEXT.config.cucumber.issues
            ) {
                return CONTEXT.config.cucumber.issues[testCaseTitle];
            }
        } else if (matches.length === 1) {
            return matches[0];
        } else {
            throw new Error(
                `Multiple test keys found in test "${testCaseTitle}": ${matches.join(
                    ", "
                )}`
            );
        }
        return null;
    }
}
