import { basename } from "path";
import { CONTEXT } from "../context";
import {
    dateTimeISO,
    XrayEvidenceItem,
    XrayExecutionResults,
    XrayTest,
    XrayTestInfo,
} from "../types/xray/xray";
import { encodeFile } from "../util/base64";

/**
 * Remove milliseconds from ISO time string. Some Jira Xray instances cannot handle milliseconds in the string.
 * @param time a date time string in ISO format
 * @returns the truncated date time string
 * @example
 *   const time = truncateISOTime("2022-12-01T02:30:44.744Z")
 *   console.log(time); // "2022-12-01T02:30:44Z"
 */
function truncateISOTime(time: dateTimeISO): string {
    return time.split(".")[0] + "Z";
}

function toXrayStatus(status: string): string {
    switch (status) {
        case "passed":
            return CONTEXT.config.xray.statusPassed || "PASSED";
        case "failed":
            return CONTEXT.config.xray.statusFailed || "FAILED";
        default:
            throw new Error(`Unknown status: ${status}`);
    }
}

function normalizedFilename(filename: string): string {
    let normalizedFilename = basename(filename);
    if (CONTEXT.config.plugin.normalizeScreenshotNames) {
        normalizedFilename = normalizedFilename.replaceAll(
            /[^\.a-zA-Z0-9]+/g,
            "_"
        );
    }
    return normalizedFilename;
}

function addTestKeyIfPresent(
    json: XrayTest,
    testResult: CypressCommandLine.TestResult
): boolean {
    const regex = new RegExp(`(${CONTEXT.config.jira.projectKey}-\\d+)`, "g");
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
            json.testKey = CONTEXT.config.cucumber.issues[testCaseTitle];
            return true;
        }
        return false;
    } else if (matches.length === 1) {
        json.testKey = matches[0];
        return true;
    } else {
        throw new Error(
            `Multiple test keys found in test case title "${testCaseTitle}": ${matches}`
        );
    }
}

function toXrayTest(testResult: CypressCommandLine.TestResult): XrayTest {
    const json: XrayTest = {
        start: truncateISOTime(getStartDate(testResult).toISOString()),
        finish: truncateISOTime(getEndDate(testResult).toISOString()),
        status: toXrayStatus(testResult.state),
    };
    if (
        !addTestKeyIfPresent(json, testResult) ||
        CONTEXT.config.plugin.overwriteIssueSummary
    ) {
        json.testInfo = toXrayTestInfo(testResult);
    }
    testResult.attempts.forEach(
        (attemptResult: CypressCommandLine.AttemptResult) => {
            const evidence: XrayEvidenceItem[] = [];
            attemptResult.screenshots.forEach(
                (screenshot: CypressCommandLine.ScreenshotInformation) => {
                    const suffix = screenshot.path.substring(
                        screenshot.path.indexOf("cypress")
                    );
                    evidence.push({
                        filename: normalizedFilename(suffix),
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
        }
    );
    return json;
}

/**
 * @example
 * // An example test result could look like this:
 * {
 *   title: [ 'the demo test suite', 'should search for a button' ],
 *   state: 'passed',
 *   body: 'function () {\r\n  cy.get("button").should("exist");\r\n}',
 *   displayError: null,
 *   attempts: [ [Object] ]
 * }
 */
function toXrayTestInfo(
    testResult: CypressCommandLine.TestResult
): XrayTestInfo {
    return {
        projectKey: CONTEXT.config.jira.projectKey,
        summary: testResult.title.join(" "),
        type: CONTEXT.config.xray.testType,
    };
}

function getStartDate(testResult: CypressCommandLine.TestResult): Date | null {
    let start: Date = null;
    testResult.attempts.forEach((attempt: CypressCommandLine.AttemptResult) => {
        const attemptDate = new Date(attempt.startedAt);
        if (!start || attemptDate < start) {
            start = attemptDate;
        }
    });
    return start;
}

function getEndDate(testResult: CypressCommandLine.TestResult): Date | null {
    let end: Date = null;
    testResult.attempts.forEach((attempt: CypressCommandLine.AttemptResult) => {
        const attemptEndDate = new Date(attempt.startedAt);
        attemptEndDate.setMilliseconds(
            attemptEndDate.getMilliseconds() + attempt.duration
        );
        if (!end || attemptEndDate > end) {
            end = attemptEndDate;
        }
    });
    return end;
}

function getSummary(results: CypressCommandLine.CypressRunResult): string {
    return `Execution Results [${Date.now()}]`;
}

function getDescription(results: CypressCommandLine.CypressRunResult): string {
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

export function toXrayJSON(
    results: CypressCommandLine.CypressRunResult
): XrayExecutionResults {
    const json: XrayExecutionResults = {
        testExecutionKey: CONTEXT.config.jira.testExecutionIssueKey,
        info: {
            project: CONTEXT.config.jira.projectKey,
            startDate: truncateISOTime(results.startedTestsAt),
            finishDate: truncateISOTime(results.endedTestsAt),
            description: getDescription(results),
            summary: getSummary(results),
            testPlanKey: CONTEXT.config.jira.testPlanIssueKey,
        },
    };
    results.runs.forEach((specResult: CypressCommandLine.RunResult) => {
        specResult.tests.forEach(
            (testResult: CypressCommandLine.TestResult) => {
                if (
                    testResult.state !== "pending" &&
                    testResult.state !== "skipped"
                ) {
                    if (!json.tests) {
                        json.tests = [toXrayTest(testResult)];
                    } else {
                        json.tests = [...json.tests, toXrayTest(testResult)];
                    }
                }
            }
        );
    });
    return json;
}
