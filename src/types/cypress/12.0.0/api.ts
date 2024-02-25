/* eslint-disable @typescript-eslint/naming-convention */
import { ResolvedConfigOptions_V12 } from "./cypress";

type HookName_V12 = "before" | "beforeEach" | "afterEach" | "after";
interface TestError_V12 {
    name: string;
    message: string;
    stack: string;
}
export interface TestResult_V12 {
    title: string[];
    state: string;
    body: string;
    displayError: string | null;
    attempts: AttemptResult_V12[];
}
export interface AttemptResult_V12 {
    state: string;
    error: TestError_V12 | null;
    startedAt: string;
    duration: number;
    videoTimestamp: number;
    screenshots: ScreenshotInformation_V12[];
}
interface HookInformation_V12 {
    hookName: HookName_V12;
    title: string[];
    body: string;
}
export interface ScreenshotInformation_V12 {
    name: string;
    takenAt: string;
    path: string;
    height: number;
    width: number;
}
export interface RunResult_V12 {
    stats: {
        suites: number;
        tests: number;
        passes: number;
        pending: number;
        skipped: number;
        failures: number;
        startedAt: string;
        endedAt: string;
        duration: number;
        wallClockDuration?: number;
    };
    reporter: string;
    reporterStats: object;
    hooks: HookInformation_V12[];
    tests: TestResult_V12[];
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
export interface CypressRunResult_V12 {
    status: "finished";
    startedTestsAt: string;
    endedTestsAt: string;
    totalDuration: number;
    totalSuites: number;
    totalTests: number;
    totalFailed: number;
    totalPassed: number;
    totalPending: number;
    totalSkipped: number;
    runUrl?: string;
    runs: RunResult_V12[];
    browserPath: string;
    browserName: string;
    browserVersion: string;
    osName: string;
    osVersion: string;
    cypressVersion: string;
    config: ResolvedConfigOptions_V12;
}
export interface CypressFailedRunResult_V12 {
    status: "failed";
    failures: number;
    message: string;
}
