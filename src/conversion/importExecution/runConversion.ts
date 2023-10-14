import { getNativeTestIssueKey } from "../../preprocessing/preprocessing";
import {
    RunResult as RunResult_V12,
    ScreenshotInformation as ScreenshotInformation_V12,
    TestResult as TestResult_V12,
} from "../../types/cypress/12.0.0/api";
import {
    RunResult as RunResult_V13,
    ScreenshotInformation as ScreenshotInformation_V13,
    TestResult as TestResult_V13,
} from "../../types/cypress/13.0.0/api";
import { Status } from "../../types/testStatus";
import { StringMap } from "../../types/util";
import { toCypressStatus } from "./statusConversion";

/**
 * Test data extracted from Cypress tests, ready to be converted into an Xray JSON test.
 */
export interface ITestRunData {
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
    status: Status;
    /**
     * The test's title.
     */
    title: string;
}

/**
 * Converts a Cypress v12 (or before) run result into several {@link ITestRunData} objects.
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
export function getTestRunData_V12(runResult: RunResult_V12): Promise<ITestRunData>[] {
    const testRuns: Promise<ITestRunData>[] = [];
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
 * Converts a Cypress v13 (and above) run result into several {@link ITestRunData} objects. The
 * project key is required for mapping screenshots to test cases.
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
export function getTestRunData_V13(
    runResult: RunResult_V13,
    projectKey: string
): Promise<ITestRunData>[] {
    const testRuns: Promise<ITestRunData>[] = [];
    const testStarts: Map<string, Date> = startTimesByTest(runResult);
    const testScreenshots: StringMap<ScreenshotInformation_V13[]> = screenshotsByTest(
        runResult,
        projectKey
    );
    runResult.tests.forEach((test: TestResult_V13) => {
        const title = test.title.join(" ");
        const screenshots = testScreenshots[title] ?? [];
        testRuns.push(
            new Promise((resolve) => {
                resolve({
                    duration: test.duration,
                    screenshots: screenshots.map((screenshot: ScreenshotInformation_V13) => {
                        return { filepath: screenshot.path };
                    }),
                    spec: {
                        filepath: runResult.spec.absolute,
                    },
                    startedAt: testStarts.get(title) ?? new Date(),
                    status: toCypressStatus(test.state),
                    title: title,
                });
            })
        );
    });
    return testRuns;
}

function startTimesByTest(run: RunResult_V13): Map<string, Date> {
    const map = new Map<string, Date>();
    const testStarts: Date[] = [];
    for (let i = 0; i < run.tests.length; i++) {
        let date: Date;
        if (i === 0) {
            date = new Date(run.stats.startedAt);
        } else {
            date = new Date(testStarts[i - 1].getTime() + run.tests[i - 1].duration);
        }
        testStarts.push(date);
        map.set(run.tests[i].title.join(" "), date);
    }
    return map;
}

function screenshotsByTest(
    run: RunResult_V13,
    projectKey: string
): StringMap<ScreenshotInformation_V13[]> {
    const map: StringMap<ScreenshotInformation_V13[]> = {};
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
    screenshot: ScreenshotInformation_V13,
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
