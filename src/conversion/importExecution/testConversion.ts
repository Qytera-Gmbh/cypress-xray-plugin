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

export function getTestRunData_V12(runs: RunResult_V12[]): ITestRunData[] {
    const testRuns: ITestRunData[] = [];
    runs.forEach((run: RunResult_V12) => {
        run.tests.forEach((test: TestResult_V12) => {
            const runData: ITestRunData = {
                duration: test.attempts[test.attempts.length - 1].duration,
                screenshots: test.attempts[test.attempts.length - 1].screenshots.map(
                    (screenshot: ScreenshotInformation_V12) => {
                        return { filepath: screenshot.path };
                    }
                ),
                spec: {
                    filepath: run.spec.absolute,
                },
                startedAt: new Date(test.attempts[test.attempts.length - 1].startedAt),
                status: toCypressStatus(test.attempts[test.attempts.length - 1].state),
                title: test.title.join(" "),
            };
            testRuns.push(runData);
        });
    });
    return testRuns;
}

export function getTestRunData_V13(runs: RunResult_V13[], projectKey: string): ITestRunData[] {
    const testRuns: ITestRunData[] = [];
    runs.forEach((run: RunResult_V13) => {
        const testStarts: Map<string, Date> = startTimesByTest(run);
        const testScreenshots: Map<string, ScreenshotInformation_V13[]> = screenshotsByTest(
            run,
            projectKey
        );
        run.tests.forEach((test: TestResult_V13) => {
            const title = test.title.join(" ");
            const runData: ITestRunData = {
                duration: test.duration,
                screenshots: testScreenshots
                    .get(title)
                    .map((screenshot: ScreenshotInformation_V13) => {
                        return { filepath: screenshot.path };
                    }),
                spec: {
                    filepath: run.spec.absolute,
                },
                startedAt: testStarts.get(title),
                status: toCypressStatus(test.attempts[test.attempts.length - 1].state),
                title: title,
            };
            testRuns.push(runData);
        });
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
            date = new Date(testStarts[i - 1].getMilliseconds() + run.tests[i - 1].duration);
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
    if (screenshot.path.includes(testTitle[testTitle.length - 1])) {
        return true;
    }
    try {
        const testTitleKey = getNativeTestIssueKey(testTitle[testTitle.length - 1], projectKey);
        const screenshotKey = getNativeTestIssueKey(screenshot.path, projectKey);
        if (testTitleKey === screenshotKey) {
            return true;
        }
    } catch (error: unknown) {
        // Do nothing.
    }
    return false;
}
