/* eslint-disable @typescript-eslint/naming-convention */
import { ResolvedConfigOptions } from "./cypress";

type HookName = "before" | "beforeEach" | "afterEach" | "after";
interface TestError {
    name: string;
    message: string;
    stack: string;
}
type dateTimeISO = string;
type ms = number;
type pixels = number;
export interface TestResult {
    title: string[];
    state: string;
    body: string;
    displayError: string | null;
    attempts: AttemptResult[];
}
export interface AttemptResult {
    state: string;
    error: TestError | null;
    startedAt: dateTimeISO;
    duration: ms;
    videoTimestamp: ms;
    screenshots: ScreenshotInformation[];
}
interface HookInformation {
    hookName: HookName;
    title: string[];
    body: string;
}
export interface ScreenshotInformation {
    name: string;
    takenAt: dateTimeISO;
    path: string;
    height: pixels;
    width: pixels;
}
export interface RunResult {
    stats: {
        suites: number;
        tests: number;
        passes: number;
        pending: number;
        skipped: number;
        failures: number;
        startedAt: dateTimeISO;
        endedAt: dateTimeISO;
        duration: ms;
        wallClockDuration?: number;
    };
    reporter: string;
    reporterStats: object;
    hooks: HookInformation[];
    tests: TestResult[];
    error: string | null;
    video: string | null;
    spec: {
        name: string;
        relative: string;
        absolute: string;
        relativeToCommonRoot: string;
    };
    shouldUploadVideo: boolean;
    skippedSpec: boolean;
}
export interface CypressRunResult {
    status: "finished";
    startedTestsAt: dateTimeISO;
    endedTestsAt: dateTimeISO;
    totalDuration: ms;
    totalSuites: number;
    totalTests: number;
    totalFailed: number;
    totalPassed: number;
    totalPending: number;
    totalSkipped: number;
    runUrl?: string;
    runs: RunResult[];
    browserPath: string;
    browserName: string;
    browserVersion: string;
    osName: string;
    osVersion: string;
    cypressVersion: string;
    config: ResolvedConfigOptions;
}
