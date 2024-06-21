/* eslint-disable @typescript-eslint/naming-convention */
import { ResolvedConfigOptions } from "./cypress";

type HookName = "after" | "afterEach" | "before" | "beforeEach";
interface TestError {
    message: string;
    name: string;
    stack: string;
}
type dateTimeISO = string;
type ms = number;
type pixels = number;
export interface TestResult {
    attempts: AttemptResult[];
    body: string;
    displayError: null | string;
    state: string;
    title: string[];
}
export interface AttemptResult {
    duration: ms;
    error: null | TestError;
    screenshots: ScreenshotInformation[];
    startedAt: dateTimeISO;
    state: string;
    videoTimestamp: ms;
}
interface HookInformation {
    body: string;
    hookName: HookName;
    title: string[];
}
export interface ScreenshotInformation {
    height: pixels;
    name: string;
    path: string;
    takenAt: dateTimeISO;
    width: pixels;
}
export interface RunResult {
    error: null | string;
    hooks: HookInformation[];
    reporter: string;
    reporterStats: object;
    shouldUploadVideo: boolean;
    skippedSpec: boolean;
    spec: {
        absolute: string;
        name: string;
        relative: string;
        relativeToCommonRoot: string;
    };
    stats: {
        duration: ms;
        endedAt: dateTimeISO;
        failures: number;
        passes: number;
        pending: number;
        skipped: number;
        startedAt: dateTimeISO;
        suites: number;
        tests: number;
        wallClockDuration?: number;
    };
    tests: TestResult[];
    video: null | string;
}
export interface CypressRunResult {
    browserName: string;
    browserPath: string;
    browserVersion: string;
    config: ResolvedConfigOptions;
    cypressVersion: string;
    endedTestsAt: dateTimeISO;
    osName: string;
    osVersion: string;
    runs: RunResult[];
    runUrl?: string;
    startedTestsAt: dateTimeISO;
    status: "finished";
    totalDuration: ms;
    totalFailed: number;
    totalPassed: number;
    totalPending: number;
    totalSkipped: number;
    totalSuites: number;
    totalTests: number;
}
export interface CypressFailedRunResult {
    failures: number;
    message: string;
    status: "failed";
}
