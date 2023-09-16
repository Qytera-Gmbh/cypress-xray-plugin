import { ConfigOptions, PublicBrowser, ResolvedConfigOptions, TestingType } from "./cypress";

interface CypressRunOptions extends CypressCommonOptions {
    browser: string;
    ciBuildId: string;
    group: string;
    tag: string;
    headed: boolean;
    headless: boolean;
    key: string;
    noExit: boolean;
    parallel: boolean;
    port: number;
    quiet: boolean;
    record: boolean;
    reporter: string;
    reporterOptions: any;
    spec: string;
    autoCancelAfterFailures: number | false;
    runnerUi: boolean;
}
interface CypressOpenOptions extends CypressCommonOptions {
    browser: string;
    detached: boolean;
    global: boolean;
    port: number;
}
interface CypressCommonOptions {
    config: ConfigOptions;
    configFile: string;
    env: object;
    project: string;
    testingType: TestingType;
}
type dateTimeISO = string;
type ms = number;
type pixels = number;
export interface TestResult {
    duration: number;
    title: string[];
    state: string;
    displayError: string | null;
    attempts: AttemptResult[];
}
export interface AttemptResult {
    state: string;
}
export interface ScreenshotInformation {
    name: string;
    takenAt: dateTimeISO;
    path: string;
    height: pixels;
    width: pixels;
}
interface SpecResult {
    absolute: string;
    fileExtension: string;
    fileName: string;
    name: string;
    relative: string;
}
export interface RunResult {
    error: string | null;
    reporter: string;
    reporterStats: object;
    screenshots: ScreenshotInformation[];
    stats: {
        duration?: ms;
        endedAt: dateTimeISO;
        failures: number;
        passes: number;
        pending: number;
        skipped: number;
        startedAt: dateTimeISO;
        suites: number;
        tests: number;
    };
    spec: SpecResult;
    tests: TestResult[];
    video: string | null;
}
type PublicConfig = Omit<
    ResolvedConfigOptions,
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
    browsers: PublicBrowser[];
    cypressInternalEnv: string;
};
export interface CypressRunResult {
    browserName: string;
    browserPath: string;
    browserVersion: string;
    config: PublicConfig;
    cypressVersion: string;
    endedTestsAt: dateTimeISO;
    osName: string;
    osVersion: string;
    runs: RunResult[];
    runUrl?: string;
    startedTestsAt: dateTimeISO;
    totalDuration: number;
    totalFailed: number;
    totalPassed: number;
    totalPending: number;
    totalSkipped: number;
    totalSuites: number;
    totalTests: number;
}
interface CypressFailedRunResult {
    status: "failed";
    failures: number;
    message: string;
}
interface CypressCliParser {
    parseRunArguments(args: string[]): Promise<Partial<CypressRunOptions>>;
}
