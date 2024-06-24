import {
    RunResult as RunResult_V12,
    ScreenshotInformation as ScreenshotInformation_V12,
    TestResult as TestResult_V12,
} from "../../../../../../types/cypress/12.0.0/api";
import { CypressStatus } from "../../../../../../types/cypress/status";
import { StringMap } from "../../../../../../types/util";
import { getNativeTestIssueKey } from "../../../../util";
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
     * Screenshots linked to the test.
     */
    screenshots: {
        /**
         * The screenshot's file path.
         */
        filepath: string;
    }[];
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
        testRuns.push(
            new Promise((resolve) => {
                resolve({
                    duration: test.attempts[test.attempts.length - 1].duration,
                    screenshots: test.attempts[test.attempts.length - 1].screenshots.map(
                        (screenshot: ScreenshotInformation_V12) => {
                            return { filepath: screenshot.path };
                        }
                    ),
                    spec: {
                        filepath: runResult.spec.absolute,
                    },
                    startedAt: new Date(test.attempts[test.attempts.length - 1].startedAt),
                    status: toCypressStatus(test.attempts[test.attempts.length - 1].state),
                    title: test.title.join(" "),
                });
            })
        );
    });
    return testRuns;
}

/**
 * Converts a Cypress v13 (and above) run result into several {@link TestRunData | `ITestRunData`}
 * objects. The project key is required for mapping screenshots to test cases.
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
 * @param projectKey - the project key
 * @returns an array of test data promises
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function getTestRunData_V13(
    runResult: CypressCommandLine.RunResult,
    projectKey: string
): Promise<TestRunData>[] {
    const testRuns: Promise<TestRunData>[] = [];
    const testStarts = startTimesByTest(runResult);
    const testScreenshots = screenshotsByTest(runResult, projectKey);
    runResult.tests.forEach((test: CypressCommandLine.TestResult) => {
        const title = test.title.join(" ");
        const screenshots = title in testScreenshots ? testScreenshots[title] : [];
        testRuns.push(
            new Promise((resolve) => {
                resolve({
                    duration: test.duration,
                    screenshots: screenshots.map(
                        (screenshot: CypressCommandLine.ScreenshotInformation) => {
                            return { filepath: screenshot.path };
                        }
                    ),
                    spec: {
                        filepath: runResult.spec.absolute,
                    },
                    startedAt: testStarts[title],
                    status: toCypressStatus(test.state),
                    title: title,
                });
            })
        );
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

function screenshotsByTest(
    run: CypressCommandLine.RunResult,
    projectKey: string
): StringMap<CypressCommandLine.ScreenshotInformation[]> {
    const map: StringMap<CypressCommandLine.ScreenshotInformation[]> = {};
    for (const screenshot of run.screenshots) {
        for (const test of run.tests) {
            const title = test.title.join(" ");
            if (screenshotNameMatchesTestTitle(screenshot, projectKey, test.title)) {
                if (title in map) {
                    map[title].push(screenshot);
                } else {
                    map[title] = [screenshot];
                }
            }
        }
    }
    return map;
}

function screenshotNameMatchesTestTitle(
    screenshot: CypressCommandLine.ScreenshotInformation,
    projectKey: string,
    testTitle: string[]
): boolean {
    try {
        const testTitleKey = getNativeTestIssueKey(testTitle[testTitle.length - 1], projectKey);
        if (testTitleKey && screenshot.path.includes(testTitleKey)) {
            return true;
        }
    } catch (error: unknown) {
        // Do nothing.
    }
    return false;
}
