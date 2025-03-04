import { basename, extname } from "node:path";
import type {
    RunResult as RunResult_V12,
    TestResult as TestResult_V12,
} from "../../../../../../types/cypress/12.0.0/api";
import { CypressStatus } from "../../../../../../types/cypress/status";
import type { StringMap } from "../../../../../../types/util";
import { getTestIssueKeys } from "../../../../util";
import { toCypressStatus } from "./status-conversion";

/**
 * Test data extracted from Cypress tests, ready to be converted into an Xray JSON test.
 */
export interface SuccessfulConversion {
    /**
     * The duration of the test in milliseconds.
     */
    duration: number;
    /**
     * Denotes a successful test run conversion.
     */
    kind: "success";
    /**
     * Information about the spec the test was run in.
     */
    spec: {
        /**
         * The spec's file path.
         */
        filepath: string;
    };
    /**
     * When the test was started.
     */
    startedAt: Date;
    /**
     * The test's status.
     */
    status: CypressStatus;
    /**
     * The test's title.
     */
    title: string;
}

/**
 * Models a failed test run conversion.
 */
export interface FailedConversion {
    /**
     * The conversion failure.
     */
    error: unknown;
    /**
     * Denotes a failed test run conversion.
     */
    kind: "error";
}

/**
 * Converts a Cypress v12 (or before) run result into several {@link SuccessfulConversion} objects.
 *
 * @param runResult - the run result
 * @param options - additional conversion options
 * @returns a mapping of test titles to their test data
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function convertTestRuns_V12(
    runResult: RunResult_V12,
    options: { uploadLastAttempt: boolean }
): Map<string, (FailedConversion | SuccessfulConversion)[]> {
    const map = new Map<string, (FailedConversion | SuccessfulConversion)[]>();
    runResult.tests.forEach((test: TestResult_V12) => {
        const title = test.title.join(" ");
        const attempts = options.uploadLastAttempt
            ? [test.attempts[test.attempts.length - 1]]
            : test.attempts;
        const runs: (FailedConversion | SuccessfulConversion)[] = attempts.map((attempt) => {
            try {
                return {
                    duration: attempt.duration,
                    kind: "success",
                    spec: {
                        filepath: runResult.spec.absolute,
                    },
                    startedAt: new Date(attempt.startedAt),
                    status: toCypressStatus(attempt.state),
                    title: title,
                };
            } catch (error: unknown) {
                return { error, kind: "error" };
            }
        });
        const testRuns = map.get(title);
        if (testRuns) {
            testRuns.push(...runs);
        } else {
            map.set(title, runs);
        }
    });
    return map;
}

/**
 * Converts a Cypress v13 (and above) run result into several {@link SuccessfulConversion | `ITestRunData`}
 * objects.
 *
 * @param runResult - the run result
 * @param options - additional conversion options
 * @returns a mapping of test titles to their test data
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function convertTestRuns_V13(
    runResult: CypressCommandLine.RunResult,
    options: { uploadLastAttempt: boolean }
): Map<string, (FailedConversion | SuccessfulConversion)[]> {
    const map = new Map<string, (FailedConversion | SuccessfulConversion)[]>();
    const testStarts = startTimesByTest(runResult);
    runResult.tests.forEach((test: CypressCommandLine.TestResult) => {
        const title = test.title.join(" ");
        const attempts = options.uploadLastAttempt
            ? [test.attempts[test.attempts.length - 1]]
            : test.attempts;
        const runs: (FailedConversion | SuccessfulConversion)[] = attempts.map((attempt) => {
            try {
                return {
                    duration: test.duration,
                    kind: "success",
                    spec: {
                        filepath: runResult.spec.absolute,
                    },
                    startedAt: testStarts[title],
                    status: toCypressStatus(attempt.state),
                    title: title,
                };
            } catch (error: unknown) {
                return {
                    error,
                    kind: "error",
                };
            }
        });
        const testRuns = map.get(title);
        if (testRuns) {
            testRuns.push(...runs);
        } else {
            map.set(title, runs);
        }
    });
    return map;
}

function startTimesByTest(run: CypressCommandLine.RunResult): StringMap<Date> {
    const map: StringMap<Date> = {};
    const testStarts: Date[] = [];
    for (let i = 0; i < run.tests.length; i++) {
        let date: Date;
        if (i === 0) {
            date = new Date(run.stats.startedAt);
        } else {
            date = new Date(testStarts[i - 1].getTime() + run.tests[i - 1].duration);
        }
        testStarts.push(date);
        map[run.tests[i].title.join(" ")] = date;
    }
    return map;
}

/**
 * Extracts screenshots from test results and maps them to their tests' corresponding issue keys.
 *
 * @param runResult - the run result
 * @param projectKey - required for mapping screenshots to test cases
 * @param options - additional screenshot extraction options
 * @returns the mapping of test issues to screenshots
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function getScreenshotsByIssueKey_V12(
    runResult: RunResult_V12,
    projectKey: string,
    options: { uploadLastAttempt: boolean }
): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    for (const test of runResult.tests) {
        const title = test.title.join(" ");
        const attempts = options.uploadLastAttempt
            ? [test.attempts[test.attempts.length - 1]]
            : test.attempts;
        try {
            const testTitleKeys = getTestIssueKeys(title, projectKey);
            for (const issueKey of testTitleKeys) {
                for (const attempt of attempts) {
                    for (const screenshot of attempt.screenshots) {
                        const screenshots = map.get(issueKey);
                        if (!screenshots) {
                            map.set(issueKey, new Set([screenshot.path]));
                        } else {
                            screenshots.add(screenshot.path);
                        }
                    }
                }
            }
        } catch {
            continue;
        }
    }
    return map;
}

/**
 * Extracts screenshots from test results and maps them to the corresponding issue keys.
 *
 * @param runResult - the run result
 * @param projectKey -  required for mapping screenshots to test cases
 * @param options - additional screenshot extraction options
 * @returns the mapping of test issues to screenshots
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function getScreenshotsByIssueKey_V13(
    run: CypressCommandLine.RunResult,
    projectKey: string,
    options: { uploadLastAttempt: boolean }
): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    const keysByTest = new Map<string, string[]>();
    for (const test of run.tests) {
        const title = test.title.join(" ");
        try {
            const testTitleKeys = getTestIssueKeys(title, projectKey);
            keysByTest.set(title, testTitleKeys);
            for (const issueKey of testTitleKeys) {
                for (const screenshot of run.screenshots) {
                    if (!screenshot.path.includes(issueKey)) {
                        continue;
                    }
                    const screenshots = map.get(issueKey);
                    if (!screenshots) {
                        map.set(issueKey, new Set([screenshot.path]));
                    } else {
                        screenshots.add(screenshot.path);
                    }
                }
            }
        } catch {
            continue;
        }
    }
    if (options.uploadLastAttempt) {
        removeAttemptScreenshots(run, map, keysByTest);
    }
    return map;
}

function removeAttemptScreenshots(
    run: CypressCommandLine.RunResult,
    screenshotsByKey: Map<string, Set<string>>,
    keysByTest: Map<string, string[]>
) {
    const screenshotsToUpload = new Set<string>();
    for (const test of run.tests) {
        const title = test.title.join(" ");
        const testKeys = keysByTest.get(title);
        // If a test does not contain any test issue keys, we cannot find its screenshots.
        if (!testKeys) {
            continue;
        }
        // See: https://docs.cypress.io/app/guides/test-retries#Screenshots
        // Initial run: template spec -- test passes eventually (failed).png
        //       Retry: template spec -- test passes eventually (failed) (attempt 2).png
        const attemptScreenshotRegex = new RegExp(
            `${test.title[test.title.length - 1]} \\(${CypressStatus.FAILED}|${CypressStatus.PASSED}|${CypressStatus.PENDING}|${CypressStatus.SKIPPED}\\)`
        );
        let lastAttemptSuffix = `${test.title[test.title.length - 1]} (${test.state})`;
        if (test.attempts.length > 1) {
            lastAttemptSuffix = `${lastAttemptSuffix} (attempt ${test.attempts.length.toString()})`;
        }
        for (const issueKey of testKeys) {
            for (const screenshot of screenshotsByKey.get(issueKey) ?? []) {
                const filename = basename(screenshot, extname(screenshot));
                if (attemptScreenshotRegex.exec(filename)) {
                    if (filename.endsWith(lastAttemptSuffix)) {
                        screenshotsToUpload.add(screenshot);
                    }
                } else {
                    screenshotsToUpload.add(screenshot);
                }
            }
        }
    }
    for (const [issueKey, screenshots] of [...screenshotsByKey.entries()]) {
        screenshotsByKey.set(
            issueKey,
            new Set([...screenshots].filter((s) => screenshotsToUpload.has(s)))
        );
        if (screenshotsByKey.get(issueKey)?.size === 0) {
            screenshotsByKey.delete(issueKey);
        }
    }
}
