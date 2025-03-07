import { basename, extname } from "node:path";
import type { RunResult } from "../../../../../../types/cypress/12.0.0/api";
import { CypressStatus } from "../../../../../../types/cypress/status";
import { getTestIssueKeys } from "../../../../util";
import { toCypressStatus } from "./status-conversion";

export interface RunConverter {
    /**
     * Returns intermediate run results which the plugin can use further down the line.
     *
     * @param options - additional conversion options
     * @returns an array of successful and failed conversions
     */
    getConversions(options: {
        /**
         * Whether to convert and return the last attempts only.
         */
        onlyLastAttempt: boolean;
    }): (FailedConversion | SuccessfulConversion)[];
    /**
     * Returns all screenshots that cannot be attributed to any test issue.
     *
     * @param options - additional screenshot retrieval options
     * @returns the screenshot paths
     */
    getNonAttributableScreenshots(options: { onlyLastAttempt: boolean }): string[];
    /**
     * Returns all screenshots that can be attributed to the specified test.
     *
     * @param issueKey - the test issue
     * @param options - additional screenshot retrieval options
     * @returns the screenshot paths of all attributed screenshots
     */
    getScreenshots(issueKey: string, options: { onlyLastAttempt: boolean }): string[];
}

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

export class RunConverterV12 implements RunConverter {
    private readonly projectKey: string;
    private readonly runResults: RunResult[];

    constructor(projectKey: string, runResults: RunResult[]) {
        this.projectKey = projectKey;
        this.runResults = runResults;
    }

    public getConversions(options: {
        onlyLastAttempt: boolean;
    }): (FailedConversion | SuccessfulConversion)[] {
        const conversions: (FailedConversion | SuccessfulConversion)[] = [];
        for (const run of this.runResults) {
            for (const test of run.tests) {
                const title = test.title.join(" ");
                const attempts = options.onlyLastAttempt
                    ? [test.attempts[test.attempts.length - 1]]
                    : test.attempts;
                for (const attempt of attempts) {
                    try {
                        conversions.push({
                            duration: attempt.duration,
                            kind: "success",
                            spec: { filepath: run.spec.absolute },
                            startedAt: new Date(attempt.startedAt),
                            status: toCypressStatus(attempt.state),
                            title: title,
                        });
                    } catch (error: unknown) {
                        conversions.push({ error, kind: "error" });
                    }
                }
            }
        }
        return conversions;
    }

    public getNonAttributableScreenshots(): string[] {
        return [];
    }

    public getScreenshots(issueKey: string, options: { onlyLastAttempt: boolean }): string[] {
        const screenshots: string[] = [];
        for (const run of this.runResults) {
            for (const test of run.tests) {
                const title = test.title.join(" ");
                const attempts = options.onlyLastAttempt
                    ? [test.attempts[test.attempts.length - 1]]
                    : test.attempts;
                try {
                    const testTitleKeys = getTestIssueKeys(title, this.projectKey);
                    if (testTitleKeys.includes(issueKey)) {
                        for (const attempt of attempts) {
                            for (const screenshot of attempt.screenshots) {
                                screenshots.push(screenshot.path);
                            }
                        }
                    }
                } catch {
                    continue;
                }
            }
        }
        return [...new Set([...screenshots])];
    }
}

export class RunConverterV13 implements RunConverter {
    private readonly projectKey: string;
    private readonly runResults: CypressCommandLine.RunResult[];

    constructor(projectKey: string, runResults: CypressCommandLine.RunResult[]) {
        this.projectKey = projectKey;
        this.runResults = runResults;
    }

    public getConversions(options: {
        onlyLastAttempt: boolean;
    }): (FailedConversion | SuccessfulConversion)[] {
        const conversions: (FailedConversion | SuccessfulConversion)[] = [];
        const testStarts: Record<string, Date> = {};
        for (const run of this.runResults) {
            const startTime = new Date(run.stats.startedAt).getTime();
            let totalDuration = 0;
            for (let i = 0; i < run.tests.length; i++) {
                let date;
                if (i === 0) {
                    date = new Date(startTime);
                } else {
                    date = new Date(startTime + totalDuration);
                }
                totalDuration = totalDuration + run.tests[i].duration;
                testStarts[run.tests[i].title.join(" ")] = date;
            }
        }
        for (const run of this.runResults) {
            for (const test of run.tests) {
                const title = test.title.join(" ");
                const attempts = options.onlyLastAttempt
                    ? [test.attempts[test.attempts.length - 1]]
                    : test.attempts;
                for (const attempt of attempts) {
                    try {
                        conversions.push({
                            duration: test.duration,
                            kind: "success",
                            spec: { filepath: run.spec.absolute },
                            startedAt: testStarts[title],
                            status: toCypressStatus(attempt.state),
                            title: title,
                        });
                    } catch (error: unknown) {
                        conversions.push({ error, kind: "error" });
                    }
                }
            }
        }
        return conversions;
    }

    public getNonAttributableScreenshots(options: { onlyLastAttempt: boolean }): string[] {
        let screenshots = this.runResults
            .flatMap((run) => run.screenshots)
            .map((screenshot) => screenshot.path);
        if (options.onlyLastAttempt) {
            screenshots = screenshots.filter(
                (screenshot) =>
                    !this.isAttemptScreenshot(screenshot) ||
                    this.isLastAttemptScreenshot(screenshot)
            );
        }
        screenshots = screenshots.filter((screenshot) => {
            try {
                return getTestIssueKeys(screenshot, this.projectKey).length === 0;
            } catch {
                return true;
            }
        });
        return screenshots;
    }

    public getScreenshots(issueKey: string, options: { onlyLastAttempt: boolean }): string[] {
        let screenshots = [];
        for (const run of this.runResults) {
            for (const screenshot of run.screenshots) {
                if (!screenshot.path.includes(issueKey)) {
                    continue;
                }
                screenshots.push(screenshot.path);
            }
        }
        if (options.onlyLastAttempt) {
            screenshots = screenshots.filter(
                (screenshot) =>
                    !this.isAttemptScreenshot(screenshot) ||
                    this.isLastAttemptScreenshot(screenshot)
            );
        }
        return [...new Set([...screenshots])];
    }

    private isAttemptScreenshot(screenshotPath: string) {
        const filename = basename(screenshotPath, extname(screenshotPath));
        for (const run of this.runResults) {
            for (const test of run.tests) {
                const testName = test.title[test.title.length - 1];
                // See: https://docs.cypress.io/app/guides/test-retries#Screenshots
                // Initial run: test passes eventually (failed).png
                //       Retry: test passes eventually (failed) (attempt 2).png
                for (const status of [
                    CypressStatus.FAILED,
                    CypressStatus.PASSED,
                    CypressStatus.PENDING,
                    CypressStatus.SKIPPED,
                ]) {
                    const attemptFilename = `${testName} (${status})`;
                    if (filename.includes(attemptFilename)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private isLastAttemptScreenshot(screenshotPath: string) {
        const filename = basename(screenshotPath, extname(screenshotPath));
        for (const run of this.runResults) {
            for (const test of run.tests) {
                const testName = test.title[test.title.length - 1];
                // See: https://docs.cypress.io/app/guides/test-retries#Screenshots
                // Initial run: test passes eventually (failed).png
                //       Retry: test passes eventually (failed) (attempt 2).png
                let attemptFilename = `${testName} (${test.state})`;
                if (test.attempts.length > 1) {
                    attemptFilename = `${attemptFilename} (attempt ${test.attempts.length.toString()})`;
                }
                if (filename.endsWith(attemptFilename)) {
                    return true;
                }
            }
        }
        return false;
    }
}
