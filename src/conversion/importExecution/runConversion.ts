import { getNativeTestIssueKey } from "../../preprocessing/preprocessing";
import {
    RunResult as RunResult_V12,
    ScreenshotInformation as ScreenshotInformation_V12,
    TestResult as TestResult_V12,
} from "../../types/cypress/12.16.0/api";
import {
    RunResult as RunResult_V13,
    ScreenshotInformation as ScreenshotInformation_V13,
    TestResult as TestResult_V13,
} from "../../types/cypress/13.0.0/api";
import { Status } from "../../types/testStatus";
import { toCypressStatus } from "./statusConversion";

export interface ITestRunData {
    duration: number;
    screenshots: {
        filepath: string;
    }[];
    spec: {
        filepath: string;
    };
    startedAt: Date;
    status: Status;
    title: string;
}

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

export function getTestRunData_V13(
    runResult: RunResult_V13,
    projectKey: string
): Promise<ITestRunData>[] {
    const testRuns: Promise<ITestRunData>[] = [];
    const testStarts: Map<string, Date> = startTimesByTest(runResult);
    const testScreenshots: Map<string, ScreenshotInformation_V13[]> = screenshotsByTest(
        runResult,
        projectKey
    );
    runResult.tests.forEach((test: TestResult_V13) => {
        const title = test.title.join(" ");
        testRuns.push(
            new Promise((resolve) => {
                resolve({
                    duration: test.duration,
                    screenshots: testScreenshots
                        .get(title)
                        .map((screenshot: ScreenshotInformation_V13) => {
                            return { filepath: screenshot.path };
                        }),
                    spec: {
                        filepath: runResult.spec.absolute,
                    },
                    startedAt: testStarts.get(title),
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
): Map<string, ScreenshotInformation_V13[]> {
    const map = new Map<string, ScreenshotInformation_V13[]>();
    for (const screenshot of run.screenshots) {
        for (const test of run.tests) {
            const title = test.title.join(" ");
            if (!map.has(title)) {
                map.set(title, []);
            }
            if (screenshotNameMatchesTestTitle(screenshot, projectKey, test.title)) {
                map.get(title).push(screenshot);
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
        if (screenshot.path.includes(testTitleKey)) {
            return true;
        }
    } catch (error: unknown) {
        // Do nothing.
    }
    return false;
}
