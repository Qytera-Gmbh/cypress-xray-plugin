/* eslint-disable @typescript-eslint/naming-convention */
import { PublicBrowser_V13, ResolvedConfigOptions_V13 } from "./cypress";

export interface TestResult_V13 {
    duration: number;
    title: string[];
    state: string;
    displayError: string | null;
    attempts: AttemptResult_V13[];
}
export interface AttemptResult_V13 {
    state: string;
}
export interface ScreenshotInformation_V13 {
    name: string;
    takenAt: string;
    path: string;
    height: number;
    width: number;
}
interface SpecResult_V13 {
    absolute: string;
    fileExtension: string;
    fileName: string;
    name: string;
    relative: string;
}
export interface RunResult_V13 {
    error: string | null;
    reporter: string;
    reporterStats: object;
    screenshots: ScreenshotInformation_V13[];
    stats: {
        duration?: number;
        endedAt: string;
        failures: number;
        passes: number;
        pending: number;
        skipped: number;
        startedAt: string;
        suites: number;
        tests: number;
    };
    spec: SpecResult_V13;
    tests: TestResult_V13[];
    video: string | null;
}
type PublicConfig_V13 = Omit<
    ResolvedConfigOptions_V13,
    | "additionalIgnorePattern"
    | "autoOpen"
    | "browser"
    | "browsers"
    | "browserUrl"
    | "clientRoute"
    | "cypressEnv"
    | "devServerPublicPathRoute"
    | "morgan"
    | "namespace"
    | "proxyServer"
    | "proxyUrl"
    | "rawJson"
    | "remote"
    | "repoRoot"
    | "report"
    | "reporterRoute"
    | "reporterUrl"
    | "resolved"
    | "setupNodeEvents"
    | "socketId"
    | "socketIoCookie"
    | "socketIoRoute"
    | "specs"
    | "state"
    | "supportFolder"
> & {
    browsers: PublicBrowser_V13[];
    cypressInternalEnv: string;
};
export interface CypressRunResult_V13 {
    browserName: string;
    browserPath: string;
    browserVersion: string;
    config: PublicConfig_V13;
    cypressVersion: string;
    endedTestsAt: string;
    osName: string;
    osVersion: string;
    runs: RunResult_V13[];
    runUrl?: string;
    startedTestsAt: string;
    totalDuration: number;
    totalFailed: number;
    totalPassed: number;
    totalPending: number;
    totalSkipped: number;
    totalSuites: number;
    totalTests: number;
}
export interface CypressFailedRunResult_V13 {
    status: "failed";
    failures: number;
    message: string;
}
