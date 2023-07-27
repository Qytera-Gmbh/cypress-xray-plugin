import { logWarning } from "../../logging/logging";
import { getNativeTestIssueKey } from "../../preprocessing/preprocessing";
import { Status } from "../../types/testStatus";
import { DateTimeISO, OneOf, StringMap, getEnumKeyByEnumValue } from "../../types/util";
import {
    XrayTestCloud,
    XrayTestExecutionInfo,
    XrayTestExecutionResultsCloud,
    XrayTestExecutionResultsServer,
    XrayTestInfoCloud,
    XrayTestInfoServer,
    XrayTestServer,
} from "../../types/xray/importTestExecutionResults";
import { Converter } from "../converter";

export type TestIssueData = {
    summaries: StringMap<string>;
    testTypes: StringMap<string>;
};

/**
 * @template XrayTestType - the Xray test type
 * @template XrayTestInfoType - the Xray test information type
 * @template XrayTestExecutionResultsType - the Xray JSON format type
 */
export abstract class ImportExecutionConverter<
    XrayTestType extends OneOf<[XrayTestServer, XrayTestCloud]>,
    XrayTestInfoType extends OneOf<[XrayTestInfoServer, XrayTestInfoCloud]>,
    XrayTestExecutionResultsType extends OneOf<
        [XrayTestExecutionResultsServer, XrayTestExecutionResultsCloud]
    >
> extends Converter<
    CypressCommandLine.CypressRunResult,
    XrayTestExecutionResultsType,
    TestIssueData
> {
    public convert(
        results: CypressCommandLine.CypressRunResult,
        issueData: TestIssueData
    ): XrayTestExecutionResultsType {
        const runs: CypressCommandLine.RunResult[] = results.runs.filter(
            (run: CypressCommandLine.RunResult) => {
                return !run.spec.absolute.endsWith(this.options.cucumber.featureFileExtension);
            }
        );
        const json = this.initResult();
        json.info = this.getTestExecutionInfo(results);
        const testsByTitle = this.mapTestsToTitles(runs);
        const attemptsByTitle = this.mapAttemptsToTitles(testsByTitle);
        testsByTitle.forEach((testResults: CypressCommandLine.TestResult[], title: string) => {
            let test: XrayTestType;
            // TODO: Support multiple iterations.
            const testResult = testResults[testResults.length - 1];
            try {
                const attempts = attemptsByTitle.get(title);
                // TODO: Support multiple iterations.
                test = this.getTest(attempts[attempts.length - 1]);
                const issueKey = getNativeTestIssueKey(title, this.options.jira.projectKey);
                test.testKey = issueKey;
                if (!issueData.summaries[issueKey]) {
                    throw new Error(`Summary of corresponding issue is missing: ${issueKey}`);
                }
                if (!issueData.testTypes[issueKey]) {
                    throw new Error(`Test type of corresponding issue is missing: ${issueKey}`);
                }
                test.testInfo = this.getTestInfo(
                    issueData.summaries[issueKey],
                    issueData.testTypes[issueKey],
                    testResult
                );
                this.addTest(json, test);
            } catch (error: unknown) {
                let reason = error;
                if (error instanceof Error) {
                    reason = error.message;
                }
                logWarning(`Skipping result upload for test: ${title}\n\n${reason}`);
            }
        });
        return json;
    }

    /**
     * Build the initial results object.
     *
     * @return the result object for further modifications
     */
    protected abstract initResult(): XrayTestExecutionResultsType;

    /**
     * Builds a test entity for an executed test.
     *
     * @param testResult the Cypress test result
     * @return the test entity
     */
    protected abstract getTest(attempt: CypressCommandLine.AttemptResult): XrayTestType;

    /**
     * Adds a test entity to the list of test execution results.
     *
     * @param testResult the test entity
     */
    protected abstract addTest(results: XrayTestExecutionResultsType, test: XrayTestType): void;

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
     * @param issueSummary the test issue summary
     * @param issueTestType the test issue test type
     * @param testResult the Cypress test result
     * @returns the test information
     */
    protected abstract getTestInfo(
        issueSummary: string,
        issueTestType: string,
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
     * Retrieve the overall start date of multiple Cypress test results.
     *
     * @param attempts the Cypress test results
     * @returns the tests' start date
     */
    protected getAttemptsStartDate(attempts: CypressCommandLine.AttemptResult[]): Date | null {
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
    protected getAttemptStartDate(attempt: CypressCommandLine.AttemptResult): Date {
        return new Date(attempt.startedAt);
    }

    /**
     * Retrieve the end date of multiple Cypress test results.
     *
     * @param attempts the Cypress test results
     * @returns the tests' end date
     */
    protected getAttemptsEndDate(attempts: CypressCommandLine.AttemptResult[]): Date | null {
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
    protected getAttemptEndDate(attempt: CypressCommandLine.AttemptResult): Date {
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
        const status: Status = Status[getEnumKeyByEnumValue(Status, attempt.state)];
        if (!status) {
            throw new Error(`Unknown Cypress test status: ${attempt.state}`);
        }
        return status;
    }

    /**
     * Returns a step action description truncated to the maximum length Xray
     * allows.
     *
     * @param action the step's action description
     * @returns the truncated or unmodified description if it's short enough
     */
    protected truncateStepAction(action: string): string {
        if (action.length <= this.options.xray.steps.maxLengthAction) {
            return action;
        }
        // Subtract 3 for the dots.
        const truncated = action.substring(0, this.options.xray.steps.maxLengthAction - 3);
        return `${truncated}...`;
    }

    private mapTestsToTitles(
        runs: CypressCommandLine.RunResult[]
    ): Map<string, CypressCommandLine.TestResult[]> {
        const map = new Map<string, CypressCommandLine.TestResult[]>();
        runs.forEach((run: CypressCommandLine.RunResult) => {
            run.tests.forEach((test: CypressCommandLine.TestResult) => {
                const title = test.title.join(" ");
                if (map.has(title)) {
                    map.get(title).push(test);
                } else {
                    map.set(title, [test]);
                }
            });
        });
        return map;
    }

    private mapAttemptsToTitles(
        testsByTitle: Map<string, CypressCommandLine.TestResult[]>
    ): Map<string, CypressCommandLine.AttemptResult[]> {
        const map = new Map<string, CypressCommandLine.AttemptResult[]>();
        testsByTitle.forEach((testResults: CypressCommandLine.TestResult[], title: string) => {
            const attempts = testResults.flatMap(
                (testResult: CypressCommandLine.TestResult) => testResult.attempts
            );
            if (map.has(title)) {
                map.set(title, map.get(title).concat(attempts));
            } else {
                map.set(title, attempts);
            }
        });
        return map;
    }

    private getTestExecutionInfo(
        results: CypressCommandLine.CypressRunResult
    ): XrayTestExecutionInfo {
        return {
            project: this.options.jira.projectKey,
            startDate: this.truncateISOTime(results.startedTestsAt),
            finishDate: this.truncateISOTime(results.endedTestsAt),
            description: this.getDescription(results),
            summary: this.getTextExecutionResultSummary(results),
            testPlanKey: this.options.jira.testPlanIssueKey,
        };
    }

    private getTextExecutionResultSummary(results: CypressCommandLine.CypressRunResult): string {
        return (
            this.options.jira.testExecutionIssueSummary ||
            `Execution Results [${new Date(results.startedTestsAt).getTime()}]`
        );
    }

    private getDescription(results: CypressCommandLine.CypressRunResult): string {
        return (
            this.options.jira.testExecutionIssueDescription ||
            "Cypress version: " +
                results.cypressVersion +
                " Browser: " +
                results.browserName +
                " (" +
                results.browserVersion +
                ")"
        );
    }
}
