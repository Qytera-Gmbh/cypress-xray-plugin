import { basename, extname } from "node:path";
import type { ScreenshotDetails } from "../../models/cypress";
import type { CypressStatus } from "../../models/cypress/status";
import { extractIssueKeys } from "../../util/extraction";
import type { MinimalRunResult } from "../cypress-xray-plugin";
import { toCypressStatus } from "./cypress-status";

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
    }): ProcessedResult[];
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

interface ProcessedResultBase {
    /**
     * The original Cypress data.
     */
    cypressData: {
        /**
         * The spec the test was extracted from.
         */
        spec: MinimalRunResult["spec"];
        /**
         * The actual test result.
         */
        test: MinimalRunResult["tests"][number];
    };
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
     * The title of the test.
     */
    title: string;
}

export interface ProcessedResultMissingIssueKey extends ProcessedResultBase {
    /**
     * The type of the processing result.
     */
    kind: "missing-issue-key";
}

export interface ProcessedResultSuccess extends ProcessedResultBase {
    /**
     * The duration of the tests in milliseconds.
     */
    duration: number;
    /**
     * The Jira test issue key.
     */
    issueKey: string;
    /**
     * The type of the processing result.
     */
    kind: "success";
    /**
     * When the tests were started.
     */
    startedAt: Date;
    /**
     * The test's status.
     */
    status: CypressStatus;
}

export interface ProcessedResultFailure extends ProcessedResultBase {
    /**
     * The conversion failure.
     */
    error: unknown;
    /**
     * The type of the processing result.
     */
    kind: "failure";
}

export type ProcessedResult =
    | ProcessedResultFailure
    | ProcessedResultMissingIssueKey
    | ProcessedResultSuccess;

interface RunParametersV12 {
    spec: MinimalRunResult<"<13">["spec"];
    tests: MinimalRunResult<"<13">["tests"];
}

/**
 * Converts Cypress test results for Cypress versions &lt;13.
 */
export class RunConverterV12 implements RunConverter {
    private readonly projectKey: string;
    private readonly runResults: RunParametersV12[];

    /**
     * Constructs a new converter for the specified run results.
     *
     * @param projectKey - the project key
     * @param runResults - the run results
     */
    constructor(projectKey: string, runResults: RunParametersV12[]) {
        this.projectKey = projectKey;
        this.runResults = runResults;
    }

    public getConversions(options: { onlyLastAttempt: boolean }): ProcessedResult[] {
        const conversions: ProcessedResult[] = [];
        for (const run of this.runResults) {
            for (const test of run.tests) {
                const title = test.title.join(" ");
                const attempts = options.onlyLastAttempt
                    ? [test.attempts[test.attempts.length - 1]]
                    : test.attempts;
                let issueKeys;
                try {
                    issueKeys = extractIssueKeys(title, this.projectKey);
                } catch {
                    issueKeys = [null];
                }
                for (const attempt of attempts) {
                    for (const issueKey of issueKeys) {
                        try {
                            if (issueKey === null) {
                                conversions.push({
                                    cypressData: { spec: run.spec, test },
                                    kind: "missing-issue-key",
                                    spec: { filepath: run.spec.absolute },
                                    title,
                                });
                            } else {
                                conversions.push({
                                    cypressData: { spec: run.spec, test },
                                    duration: attempt.duration,
                                    issueKey,
                                    kind: "success",
                                    spec: { filepath: run.spec.absolute },
                                    startedAt: new Date(attempt.startedAt),
                                    status: toCypressStatus(attempt.state),
                                    title,
                                });
                            }
                        } catch (error: unknown) {
                            conversions.push({
                                cypressData: { spec: run.spec, test },
                                error,
                                kind: "failure",
                                spec: { filepath: run.spec.absolute },
                                title,
                            });
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
                    const testTitleKeys = extractIssueKeys(title, this.projectKey);
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

interface RunParametersLatest {
    spec: MinimalRunResult<">=14" | "13">["spec"];
    stats: Pick<MinimalRunResult<">=14" | "13">["stats"], "startedAt">;
    tests: MinimalRunResult<">=14" | "13">["tests"];
}

export type ScreenshotDetailsLatest = Pick<
    ScreenshotDetails<">=14" | "13">,
    "path" | "testFailure"
>;

/**
 * Converts Cypress test results for Cypress versions &ge;13.
 */
export class RunConverterLatest implements RunConverter {
    /**
     * - Initial run: `CYP-123 my screenshot.png`
     *    - Retry #1: `CYP-123 my screenshot (attempt 2).png`
     *    - Retry #2: `CYP-123 my screenshot (attempt 3).png`
     *
     * @see https://docs.cypress.io/app/guides/test-retries#Screenshots
     */
    private static readonly REGEX_ATTEMPT = /\s+\(attempt (\d+)\)/;
    /**
     * - `CYP-123 my screenshot (1).png`
     * - `CYP-123 my screenshot (2).png`
     *
     * @see https://github.com/cypress-io/cypress/blob/667e3196381c7e7b4b09a00c1b3f42d70a3f944b/packages/server/lib/screenshots.ts#L365
     */
    private static readonly REGEX_CONFLICT = /\s+(\d+)$/;
    private readonly projectKey: string;
    private readonly runResults: readonly RunParametersLatest[];
    private readonly screenshotDetails: readonly ScreenshotDetailsLatest[];

    /**
     * Constructs a new converter for the specified run results.
     *
     * @param projectKey - the project key
     * @param runResults - the run results
     * @param screenshotDetails - all screenshots taken during the run
     */
    constructor(
        projectKey: string,
        runResults: RunParametersLatest[],
        screenshotDetails: ScreenshotDetailsLatest[]
    ) {
        this.projectKey = projectKey;
        this.runResults = runResults;
        this.screenshotDetails = screenshotDetails;
    }

    public getConversions(options: { onlyLastAttempt: boolean }): ProcessedResult[] {
        const conversions: ProcessedResult[] = [];
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
                    issueKeys = extractIssueKeys(title, this.projectKey);
                } catch {
                    issueKeys = [null];
                }
                for (const attempt of attempts) {
                    for (const issueKey of issueKeys) {
                        try {
                            if (issueKey === null) {
                                conversions.push({
                                    cypressData: { spec: run.spec, test },
                                    kind: "missing-issue-key",
                                    spec: { filepath: run.spec.absolute },
                                    title,
                                });
                            } else {
                                conversions.push({
                                    cypressData: { spec: run.spec, test },
                                    duration: test.duration,
                                    issueKey,
                                    kind: "success",
                                    spec: { filepath: run.spec.absolute },
                                    startedAt: testStarts[title],
                                    status: toCypressStatus(attempt.state),
                                    title,
                                });
                            }
                        } catch (error: unknown) {
                            conversions.push({
                                cypressData: { spec: run.spec, test },
                                error,
                                kind: "failure",
                                spec: { filepath: run.spec.absolute },
                                title,
                            });
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
                return extractIssueKeys(screenshot.path, this.projectKey).length === 0;
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

    private filterLastAttemptScreenshots(screenshots: readonly ScreenshotDetailsLatest[]) {
        // Group screenshots by their "basename", i.e. without the (attempt xxx) suffixes.
        const groups = this.groupScreenshots(screenshots);
        const lastScreenshots = [];
        for (const similarScreenshots of groups) {
            const screenshotsByAttemptIndex = new Map<number, ScreenshotDetailsLatest[]>();
            for (const screenshot of similarScreenshots) {
                const match = RunConverterLatest.REGEX_ATTEMPT.exec(screenshot.path);
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
        screenshots: readonly ScreenshotDetailsLatest[]
    ): ScreenshotDetailsLatest[][] {
        const screenshotGroups: ScreenshotDetailsLatest[][] = [];
        // Reverse order because we're popping (order is important for upload order later on).
        let remainingScreenshots = [...screenshots].reverse();
        while (remainingScreenshots.length > 0) {
            // Cast valid: it cannot ever be undefined here.
            const screenshot = remainingScreenshots.pop() as ScreenshotDetailsLatest;
            const group: ScreenshotDetailsLatest[] = [screenshot];
            const name = basename(screenshot.path, extname(screenshot.path));
            // Try to find screenshots with possibly conflicting names.
            if (RunConverterLatest.REGEX_CONFLICT.exec(name) !== null) {
                const nameWithoutSuffix = name.replace(RunConverterLatest.REGEX_CONFLICT, "");
                for (let i = remainingScreenshots.length - 1; i >= 0; i--) {
                    const otherScreenshot = remainingScreenshots[i];
                    let otherName = basename(otherScreenshot.path, extname(otherScreenshot.path));
                    otherName = otherName.replace(RunConverterLatest.REGEX_CONFLICT, "");
                    if (otherName === nameWithoutSuffix) {
                        group.push(otherScreenshot);
                    }
                }
                remainingScreenshots = remainingScreenshots.filter((s1) =>
                    group.every((s2) => s1.path !== s2.path)
                );
            }
            // Try to find screenshots of similar attempts.
            if (RunConverterLatest.REGEX_ATTEMPT.exec(name) !== null) {
                const nameWithoutSuffix = name.replace(RunConverterLatest.REGEX_ATTEMPT, "");
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
                    let otherName = basename(otherScreenshot.path, extname(otherScreenshot.path));
                    otherName = otherName.replace(RunConverterLatest.REGEX_ATTEMPT, "");
                    if (otherName === name) {
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
