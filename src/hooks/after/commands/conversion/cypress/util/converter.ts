import { basename, extname } from "node:path";
import type { RunResult, ScreenshotDetails } from "../../../../../../types/cypress";
import type { CypressStatus } from "../../../../../../types/cypress/status";
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
    private readonly runResults: RunResult<"<13">[];

    /**
     * Constructs a new converter for the specified run results.
     *
     * @param projectKey - the project key
     * @param runResults - the run results
     */
    constructor(projectKey: string, runResults: RunResult<"<13">[]) {
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
export class RunConverterLatest implements RunConverter {
    /**
     * - Initial run: `CYP-123 my screenshot.png`
     *     - Retry #1: `CYP-123 my screenshot (attempt 2).png`
     *     - Retry #2: `CYP-123 my screenshot (attempt 3).png`
     */
    private static readonly ATTEMPT_REGEX = / \(attempt (\d+)\)/;
    private readonly projectKey: string;
    private readonly runResults: readonly RunResult<"13" | "14">[];
    private readonly screenshotDetails: readonly ScreenshotDetails<"13" | "14">[];

    /**
     * Constructs a new converter for the specified run results.
     *
     * @param projectKey - the project key
     * @param runResults - the run results
     * @param screenshotDetails - all screenshots taken during the run
     */
    constructor(
        projectKey: string,
        runResults: RunResult<"13" | "14">[],
        screenshotDetails: ScreenshotDetails<"13" | "14">[]
    ) {
        this.projectKey = projectKey;
        this.runResults = runResults;
        this.screenshotDetails = screenshotDetails;
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
        let screenshots = this.screenshotDetails;
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
        for (const screenshot of this.screenshotDetails) {
            if (!screenshot.path.includes(issueKey)) {
                continue;
            }
            screenshots.push(screenshot);
        }
        if (options.onlyLastAttempt) {
            screenshots = this.filterLastAttemptScreenshots(screenshots);
        }
        return [...new Set([...screenshots.map((screenshot) => screenshot.path)])];
    }

    private filterLastAttemptScreenshots(screenshots: readonly ScreenshotDetails<"13" | "14">[]) {
        // Group screenshots by their "basename", i.e. without the (attempt xxx) suffixes.
        const groups = this.groupScreenshots(screenshots);
        const lastScreenshots = [];
        for (const similarScreenshots of groups) {
            const screenshotsByAttemptIndex = new Map<number, ScreenshotDetails<"13" | "14">[]>();
            for (const screenshot of similarScreenshots) {
                const match = RunConverterLatest.ATTEMPT_REGEX.exec(screenshot.path);
                if (match !== null) {
                    const attemptIndex = Number.parseInt(match[1]);
                    const attemptScreenshots = screenshotsByAttemptIndex.get(attemptIndex);
                    if (attemptScreenshots) {
                        attemptScreenshots.push(screenshot);
                    } else {
                        screenshotsByAttemptIndex.set(attemptIndex, [screenshot]);
                    }
                }
            }
            // Only keep the latest attempts if present.
            if (screenshotsByAttemptIndex.size > 0) {
                const latestAttempts = [...screenshotsByAttemptIndex.entries()].reduce(
                    ([previousIndex, previousScreenshots], [currentIndex, currentScreenshots]) =>
                        currentIndex > previousIndex
                            ? [currentIndex, currentScreenshots]
                            : [previousIndex, previousScreenshots],
                    [Number.NEGATIVE_INFINITY, []]
                );
                lastScreenshots.push(...latestAttempts[1]);
            } else {
                lastScreenshots.push(...similarScreenshots);
            }
        }
        // Remove all screenshots of failed attempts that have been superseded by a passed one
        // without screenshot.
        const tests = this.runResults.flatMap((result) => result.tests);
        return lastScreenshots.filter((screenshot) => {
            if (!screenshot.testFailure) {
                return true;
            }
            const sanitizedScreenshotName = this.sanitizeName(screenshot.path);
            return tests.some((test) => {
                const sanitizedTestTitle = this.sanitizeName(test.title[test.title.length - 1]);
                let finalAttemptName;
                if (test.attempts.length > 1) {
                    finalAttemptName = `${sanitizedTestTitle} (${test.state}) (attempt ${test.attempts.length.toString()})${extname(screenshot.path)}`;
                } else {
                    finalAttemptName = `${sanitizedTestTitle} (${test.state})${extname(screenshot.path)}`;
                }
                return sanitizedScreenshotName.endsWith(finalAttemptName);
            });
        });
    }

    /**
     * Removes illegal filename characters from a string (based on Windows).
     *
     * Note: this mirrors what Cypress is doing internally when computing file paths.
     *
     * @param s - the input string
     * @returns the sanitized string
     *
     * @see https://stackoverflow.com/a/42210346
     * @see https://github.com/cypress-io/cypress/blob/667e3196381c7e7b4b09a00c1b3f42d70a3f944b/packages/server/lib/screenshots.ts#L417-L421
     */
    private sanitizeName(s: string) {
        // eslint-disable-next-line no-control-regex
        return s.replaceAll(/[/\\?%*:|"<>\u0000-\u001F]/g, "");
    }

    /**
     * Groups screenshots by their basenames, i.e. without the `(attempt xxx)` or conflict suffixes.
     *
     * @param screenshots - the screenshots
     * @returns the grouped screenshots
     */
    private groupScreenshots(
        screenshots: readonly ScreenshotDetails<"13" | "14">[]
    ): ScreenshotDetails<"13" | "14">[][] {
        const screenshotGroups: ScreenshotDetails<"13" | "14">[][] = [];
        // Reverse order because we're popping (order is important for upload order later on).
        let remainingScreenshots = [...screenshots].reverse();
        while (remainingScreenshots.length > 0) {
            // Cast valid: it cannot ever be undefined here.
            const screenshot = remainingScreenshots.pop() as ScreenshotDetails<"13" | "14">;
            const group: ScreenshotDetails<"13" | "14">[] = [screenshot];
            const name = basename(screenshot.path, extname(screenshot.path));
            // Try to find screenshots with possibly conflicting names.
            // If none exist, the screenshot was manually named like this and must remain as is.
            // See: https://github.com/cypress-io/cypress/blob/667e3196381c7e7b4b09a00c1b3f42d70a3f944b/packages/server/lib/screenshots.ts#L365
            // E.g.: `CYP-123 my screenshot (1).png`
            // E.g.: `CYP-123 my screenshot (2).png`
            const conflictRegex = / (\d+)$/;
            if (conflictRegex.exec(name) !== null) {
                const nameWithoutConflictSuffix = name.replace(conflictRegex, "");
                for (let i = remainingScreenshots.length - 1; i >= 0; i--) {
                    const otherScreenshot = remainingScreenshots[i];
                    const otherName = basename(otherScreenshot.path, extname(otherScreenshot.path));
                    if (conflictRegex.exec(otherName) !== null) {
                        if (nameWithoutConflictSuffix === otherName.replace(conflictRegex, "")) {
                            group.push(otherScreenshot);
                        }
                    }
                }
                remainingScreenshots = remainingScreenshots.filter((s1) =>
                    group.every((s2) => s1.path !== s2.path)
                );
            }
            // Try to find screenshots of similar attempts.
            if (RunConverterLatest.ATTEMPT_REGEX.exec(name) !== null) {
                const nameWithoutSuffix = name.replace(RunConverterLatest.ATTEMPT_REGEX, "");
                for (let i = remainingScreenshots.length - 1; i >= 0; i--) {
                    const otherScreenshot = remainingScreenshots[i];
                    const otherName = basename(otherScreenshot.path, extname(otherScreenshot.path));
                    if (otherName === nameWithoutSuffix) {
                        group.push(otherScreenshot);
                    }
                }
            } else {
                for (let i = remainingScreenshots.length - 1; i >= 0; i--) {
                    const otherScreenshot = remainingScreenshots[i];
                    const otherName = basename(otherScreenshot.path, extname(otherScreenshot.path));
                    if (otherName.replace(RunConverterLatest.ATTEMPT_REGEX, "") === name) {
                        group.push(otherScreenshot);
                    }
                }
            }
            remainingScreenshots = remainingScreenshots.filter((s1) =>
                group.every((s2) => s1.path !== s2.path)
            );
            screenshotGroups.push(group);
        }
        return screenshotGroups;
    }
}
