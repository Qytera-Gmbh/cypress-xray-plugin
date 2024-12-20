import type {
    RunResult as RunResult_V12,
    TestResult as TestResult_V12,
} from "../../../../../../types/cypress/12.0.0/api";
import type { CypressStatus } from "../../../../../../types/cypress/status";
import type { StringMap } from "../../../../../../types/util";
import { getTestIssueKeys } from "../../../../util";
import { toCypressStatus } from "./status";

/**
 * Test data extracted from Cypress tests, ready to be converted into an Xray JSON test.
 */
export interface TestRunData {
    /**
     * The duration of the test in milliseconds.
     */
    duration: number;
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
 * Converts a Cypress v12 (or before) run result into several {@link TestRunData} objects.
 *
 * The function returns an array of promises because the conversion of the test results contained
 * within the run can fail for individual tests. This makes sure that a single failing conversion
 * does not affect or cancel the conversion of the other test results.
 *
 * To retrieve the results, you should use the following approach:
 *
 * ```ts
 *   const testData = await Promise.allSettled(getTestRunData_V12(runResult));
 *   testData.forEach((promise) => {
 *     if (promise.status === "fulfilled") {
 *       // use test data
 *     } else {
 *       // handle failed test conversion
 *     }
 *   });
 * ```
 *
 * @param runResult - the run result
 * @returns an array of test data promises
 */

// eslint-disable-next-line @typescript-eslint/naming-convention
export function getTestRunData_V12(runResult: RunResult_V12): Promise<TestRunData>[] {
    const testRuns: Promise<TestRunData>[] = [];
    runResult.tests.forEach((test: TestResult_V12) => {
        const title = test.title.join(" ");
        test.attempts.forEach((attempt) => {
            testRuns.push(
                new Promise((resolve) => {
                    resolve({
                        duration: attempt.duration,
                        spec: {
                            filepath: runResult.spec.absolute,
                        },
                        startedAt: new Date(attempt.startedAt),
                        status: toCypressStatus(attempt.state),
                        title: title,
                    });
                })
            );
        });
    });
    return testRuns;
}

/**
 * Converts a Cypress v13 (and above) run result into several {@link TestRunData | `ITestRunData`}
 * objects.
 *
 * The function returns an array of promises because the conversion of the test results contained
 * within the run can fail for individual tests. This makes sure that a single failing conversion
 * does not affect or cancel the conversion of the other test results.
 *
 * To retrieve the results, you should use the following approach:
 *
 * ```ts
 *   const testData = await Promise.allSettled(getTestRunData_V13(runResult, projectKey));
 *   testData.forEach((promise) => {
 *     if (promise.status === "fulfilled") {
 *       // use test data
 *     } else {
 *       // handle failed test conversion
 *     }
 *   });
 * ```
 *
 * @param runResult - the run result
 * @param options - additional extraction options to consider
 * @returns an array of test data promises
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function getTestRunData_V13(
    runResult: CypressCommandLine.RunResult
): Promise<TestRunData>[] {
    const testRuns: Promise<TestRunData>[] = [];
    const testStarts = startTimesByTest(runResult);
    runResult.tests.forEach((test: CypressCommandLine.TestResult) => {
        const title = test.title.join(" ");
        test.attempts.forEach((attempt) => {
            testRuns.push(
                new Promise((resolve) => {
                    resolve({
                        duration: test.duration,
                        spec: {
                            filepath: runResult.spec.absolute,
                        },
                        startedAt: testStarts[title],
                        status: toCypressStatus(attempt.state),
                        title: title,
                    });
                })
            );
        });
    });
    return testRuns;
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
 * @param projectKey -  required for mapping screenshots to test cases
 * @returns the mapping of test issues to screenshots
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function getScreenshotsByIssueKey_V12(
    runResult: RunResult_V12,
    projectKey: string
): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const test of runResult.tests) {
        const title = test.title.join(" ");
        try {
            const testTitleKeys = getTestIssueKeys(title, projectKey);
            for (const issueKey of testTitleKeys) {
                for (const attempt of test.attempts) {
                    for (const screenshot of attempt.screenshots) {
                        const screenshots = map.get(issueKey);
                        if (!screenshots) {
                            map.set(issueKey, [screenshot.path]);
                        } else {
                            screenshots.push(screenshot.path);
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
 * @returns the mapping of test issues to screenshots
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function getScreenshotsByIssueKey_V13(
    run: CypressCommandLine.RunResult,
    projectKey: string
): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const test of run.tests) {
        const title = test.title.join(" ");
        try {
            const testTitleKeys = getTestIssueKeys(title, projectKey);
            for (const screenshot of run.screenshots) {
                for (const issueKey of testTitleKeys) {
                    if (screenshot.path.includes(issueKey)) {
                        const screenshots = map.get(issueKey);
                        if (screenshots) {
                            screenshots.push(screenshot.path);
                        } else {
                            map.set(issueKey, [screenshot.path]);
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
