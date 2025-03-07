import { basename, extname } from "node:path";
import type { CypressRunResult as CypressRunResult_V_12 } from "../../../../../../types/cypress/12.0.0/api";
import { CypressStatus } from "../../../../../../types/cypress/status";
import { getTestIssueKeys } from "../../../../util";
import type { FailedConversion, SuccessfulConversion } from "./run-conversion";
import { toCypressStatus } from "./status-conversion";

export interface RunConverter {
    getConversions(options: {
        onlyLastAttempt: boolean;
    }): (FailedConversion | SuccessfulConversion)[];
    getNonAttributableScreenshots(options: { onlyLastAttempt: boolean }): string[];
    getScreenshots(issueKey: string, options: { onlyLastAttempt: boolean }): string[];
}

export class RunConverterV12 implements RunConverter {
    private readonly projectKey: string;
    private readonly runResults: CypressRunResult_V_12;

    constructor(projectKey: string, runResults: CypressRunResult_V_12) {
        this.projectKey = projectKey;
        this.runResults = runResults;
    }

    public getConversions(options: {
        onlyLastAttempt: boolean;
    }): (FailedConversion | SuccessfulConversion)[] {
        const conversions: (FailedConversion | SuccessfulConversion)[] = [];
        for (const run of this.runResults.runs) {
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
        for (const run of this.runResults.runs) {
            for (const test of run.tests) {
                const title = test.title.join(" ");
                const attempts = options.onlyLastAttempt
                    ? [test.attempts[test.attempts.length - 1]]
                    : test.attempts;
                try {
                    const testTitleKeys = getTestIssueKeys(title, this.projectKey);
                    if (issueKey in testTitleKeys) {
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
        return screenshots;
    }
}

export class RunConverterV13 implements RunConverter {
    private readonly projectKey: string;
    private readonly runResults: CypressCommandLine.CypressRunResult;

    constructor(projectKey: string, runResults: CypressCommandLine.CypressRunResult) {
        this.projectKey = projectKey;
        this.runResults = runResults;
    }

    public getConversions(options: {
        onlyLastAttempt: boolean;
    }): (FailedConversion | SuccessfulConversion)[] {
        const conversions: (FailedConversion | SuccessfulConversion)[] = [];
        const testStarts: Record<string, Date> = {};
        for (const run of this.runResults.runs) {
            let totalDuration = 0;
            for (let i = 0; i < run.tests.length; i++) {
                let date;
                if (i === 0) {
                    date = new Date(run.stats.startedAt);
                } else {
                    totalDuration = totalDuration + run.tests[i - 1].duration;
                    date = new Date(totalDuration);
                }
                testStarts[run.tests[i].title.join(" ")] = date;
            }
        }
        for (const run of this.runResults.runs) {
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
        let screenshots = this.runResults.runs
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
                return getTestIssueKeys(screenshot, this.projectKey).length > 0;
            } catch {
                return false;
            }
        });
        return screenshots;
    }

    public getScreenshots(issueKey: string, options: { onlyLastAttempt: boolean }): string[] {
        let screenshots = [];
        for (const run of this.runResults.runs) {
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
        return screenshots;
    }

    private isAttemptScreenshot(screenshotPath: string) {
        const filename = basename(screenshotPath, extname(screenshotPath));
        for (const run of this.runResults.runs) {
            for (const test of run.tests) {
                const testName = test.title[test.title.length - 1];
                // See: https://docs.cypress.io/app/guides/test-retries#Screenshots
                // Initial run: test passes eventually (failed).png
                const attemptScreenshotPattern = new RegExp(
                    `${testName} \\(${CypressStatus.FAILED}|${CypressStatus.PASSED}|${CypressStatus.PENDING}|${CypressStatus.SKIPPED}\\)`
                );
                if (attemptScreenshotPattern.exec(filename)) {
                    return true;
                }
            }
        }
        return false;
    }

    private isLastAttemptScreenshot(screenshotPath: string) {
        const filename = basename(screenshotPath, extname(screenshotPath));
        for (const run of this.runResults.runs) {
            for (const test of run.tests) {
                const testName = test.title[test.title.length - 1];
                // See: https://docs.cypress.io/app/guides/test-retries#Screenshots
                // Initial run: test passes eventually (failed).png
                //       Retry: test passes eventually (failed) (attempt 2).png
                let lastAttemptSuffix = `${testName} (${test.state})`;
                if (test.attempts.length > 1) {
                    lastAttemptSuffix = `${lastAttemptSuffix} (attempt ${test.attempts.length.toString()})`;
                }
                if (filename.endsWith(lastAttemptSuffix)) {
                    return true;
                }
            }
        }
        return false;
    }
}
