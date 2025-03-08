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
     * The Jira test issue key or `null` if the test could not be mapped to an issue.
     */
    issueKey: null | string;
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
    /**
     * The test's title.
     */
    title: string;
}

/**
 * Converts Cypress test results for Cypress versions &lt;13.
 */
export class RunConverterV12 implements RunConverter {
    private readonly projectKey: string;
    private readonly runResults: RunResult[];

    /**
     * Constructs a new converter for the specified run results.
     *
     * @param projectKey - the project key
     * @param runResults - the run results
     */
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
                let issueKeys;
                try {
                    issueKeys = getTestIssueKeys(title, this.projectKey);
                } catch {
                    issueKeys = [null];
                }
                for (const attempt of attempts) {
                    for (const issueKey of issueKeys) {
                        try {
                            conversions.push({
                                duration: attempt.duration,
                                issueKey,
                                kind: "success",
                                spec: { filepath: run.spec.absolute },
                                startedAt: new Date(attempt.startedAt),
                                status: toCypressStatus(attempt.state),
                                title: title,
                            });
                        } catch (error: unknown) {
                            conversions.push({ error, kind: "error", title });
                        }
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

/**
 * Converts Cypress test results for Cypress versions &ge;13.
 */
export class RunConverterV13 implements RunConverter {
    private readonly projectKey: string;
    private readonly runResults: CypressCommandLine.RunResult[];

    /**
     * Constructs a new converter for the specified run results.
     *
     * @param projectKey - the project key
     * @param runResults - the run results
     */
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
                let issueKeys;
                try {
                    issueKeys = getTestIssueKeys(title, this.projectKey);
                } catch {
                    issueKeys = [null];
                }
                for (const attempt of attempts) {
                    for (const issueKey of issueKeys) {
                        try {
                            conversions.push({
                                duration: test.duration,
                                issueKey,
                                kind: "success",
                                spec: { filepath: run.spec.absolute },
                                startedAt: testStarts[title],
                                status: toCypressStatus(attempt.state),
                                title: title,
                            });
                        } catch (error: unknown) {
                            conversions.push({ error, kind: "error", title });
                        }
                    }
                }
            }
        }
        return conversions;
    }

    public getNonAttributableScreenshots(options: { onlyLastAttempt: boolean }): string[] {
        let screenshots = this.runResults
            .flatMap((run) => run.screenshots)
            .map((screenshot) => screenshot);
        if (options.onlyLastAttempt) {
            screenshots = this.filterLastAttemptScreenshots(screenshots);
        }
        screenshots = screenshots.filter((screenshot) => {
            try {
                return getTestIssueKeys(screenshot.path, this.projectKey).length === 0;
            } catch {
                return true;
            }
        });
        return [...new Set([...screenshots.map((screenshot) => screenshot.path)])];
    }

    public getScreenshots(issueKey: string, options: { onlyLastAttempt: boolean }): string[] {
        let screenshots = [];
        for (const run of this.runResults) {
            for (const screenshot of run.screenshots) {
                if (!screenshot.path.includes(issueKey)) {
                    continue;
                }
                screenshots.push(screenshot);
            }
        }
        if (options.onlyLastAttempt) {
            screenshots = this.filterLastAttemptScreenshots(screenshots);
        }
        return [...new Set([...screenshots.map((screenshot) => screenshot.path)])];
    }

    private filterLastAttemptScreenshots(screenshots: CypressCommandLine.ScreenshotInformation[]) {
        // See: https://docs.cypress.io/app/guides/test-retries#Screenshots
        // Manual screenshots:
        //     Initial run: CYP-123 my screenshot.png
        //           Retry: CYP-123 my screenshot (attempt 2).png
        //           Retry: CYP-123 my screenshot (attempt 3).png
        // Cypress screenshots:
        //     Initial run: CYP-123 test passes eventually (failed).png
        //           Retry: CYP-123 test passes eventually (failed) (attempt 2).png
        //           Retry: <no screenshot because attempt passed>
        const attemptRegex = /\(attempt (\d+)\)/;
        const initialScreenshots = screenshots.filter(
            (screenshot) => !attemptRegex.exec(screenshot.path)
        );
        const lastScreenshots = [];
        // Sort screenshots such that the highest attempt always comes first.
        for (const initialScreenshot of initialScreenshots) {
            const name = basename(initialScreenshot.path, extname(initialScreenshot.path));
            const similarScreenshots = screenshots.filter((screenshot) =>
                screenshot.path.includes(name)
            );
            similarScreenshots.sort((a, b) => {
                const matchA = attemptRegex.exec(a.path);
                const matchB = attemptRegex.exec(b.path);
                if (matchA && matchB) {
                    return Number.parseInt(matchB[1]) - Number.parseInt(matchA[1]);
                }
                if (matchA) {
                    return -1;
                }
                if (matchB) {
                    return 1;
                }
                return 0;
            });
            lastScreenshots.push(similarScreenshots[0]);
        }
        // Remove all screenshots of failed attempts that have been superseded by a passed one
        // without screenshot.
        const tests = this.runResults.flatMap((result) => result.tests);
        const testScreenshotPatterns = tests.map(
            (test) =>
                new RegExp(
                    `${test.title[test.title.length - 1]} \\(${[CypressStatus.FAILED, CypressStatus.PASSED, CypressStatus.PENDING, CypressStatus.SKIPPED].join("|")}\\)`
                )
        );
        return lastScreenshots.filter((screenshot) => {
            if (!testScreenshotPatterns.some((pattern) => pattern.exec(screenshot.path))) {
                return true;
            }
            for (const test of tests) {
                const testName = test.title[test.title.length - 1];
                if (test.attempts.length > 1) {
                    const finalAttemptName = `${testName} (${test.state}) (attempt ${test.attempts.length.toString()})${extname(screenshot.path)}`;
                    if (screenshot.path.endsWith(finalAttemptName)) {
                        return true;
                    }
                }
            }
            return false;
        });
    }
}
