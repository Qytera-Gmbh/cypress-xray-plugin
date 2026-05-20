import { faker as fakerjs } from "@faker-js/faker";
import ansiColors from "ansi-colors";
import axios from "axios";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { JwtCredentials, PatCredentials } from "../src/client/authentication/credentials";
import { AxiosRestClient } from "../src/client/https/requests";
import { JiraClientCloud } from "../src/client/jira/jira-client-cloud";
import { JiraClientServer } from "../src/client/jira/jira-client-server";
import { XrayClientCloud } from "../src/client/xray/xray-client-cloud";
import { XrayClientServer } from "../src/client/xray/xray-client-server";
import type { FileObject, ScreenshotDetails } from "../src/models/cypress";
import { CypressStatus } from "../src/models/cypress/status";
import type {
    ClientCombination,
    CucumberOptions,
    CypressXrayPluginOptions,
    HttpClientCombination,
    InternalCypressXrayPluginOptions,
    JiraOptions,
    PluginIssueUpdate,
    PluginOptions,
} from "../src/models/plugin";
import type {
    XrayEvidenceItem,
    XrayTest,
    XrayTestExecutionResults,
} from "../src/models/xray/import-test-execution-results";
import type { CucumberMultipartFeature } from "../src/models/xray/requests/import-execution-cucumber-multipart";
import type { MultipartInfo } from "../src/models/xray/requests/import-execution-multipart-info";
import type { MinimalCypressRunResult, MinimalRunResult } from "../src/plugin/cypress-xray-plugin";
import type { JiraSnapshot } from "../src/plugin/jira-issue-snapshots/jira-issue-snapshots";
import { stub } from "./mocks";

const SEED_FILE = join(".", ".seed");

let seed: number | undefined = undefined;

export function initFaker() {
    if (process.env.SEED) {
        writeFileSync(SEED_FILE, process.env.SEED);
    } else {
        writeFileSync(SEED_FILE, Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER).toString());
    }
}

export function faker() {
    if (seed === undefined) {
        seed ??= Number.parseInt(readFileSync(SEED_FILE, { encoding: "utf-8" }));
        console.log(
            ansiColors.cyanBright(
                `======================${"=".repeat(Number.MAX_SAFE_INTEGER.toString().length + 2)}`
            )
        );
        console.log(
            ansiColors.cyanBright(
                `= Faker library seed: ${seed.toString()}${" ".repeat(Number.MAX_SAFE_INTEGER.toString().length - seed.toString().length + 1)}=`
            )
        );
        console.log(
            ansiColors.cyanBright(
                `======================${"=".repeat(Number.MAX_SAFE_INTEGER.toString().length + 2)}`
            )
        );
        fakerjs.seed(seed);
    }
    return fakerjs;
}

export function generateFakeSemVer(options?: {
    major?: { max: number; min: number };
    minor?: { max: number; min: number };
    patch?: { max: number; min: number };
}) {
    if (!options?.major && !options?.minor && !options?.patch) {
        return faker().system.semver();
    }
    const major = faker().number.int(options.major);
    const minor = faker().number.int(options.minor);
    const patch = faker().number.int(options.patch);
    return `${major.toString()}.${minor.toString()}.${patch.toString()}`;
}

export function generateFakeProjectKey() {
    return faker().string.alpha({ casing: "upper", length: { max: 10, min: 2 } });
}

export function generateFakeIssueKey(options?: { projectKey?: string }) {
    if (options?.projectKey) {
        return `${options.projectKey}-${faker().number.int({ max: 9999, min: 1 }).toString()}`;
    }
    return `${generateFakeProjectKey()}-${faker().number.int({ max: 9999, min: 1 }).toString()}`;
}

export function generateFakePluginIssueUpdate(options?: {
    key?: boolean;
    transition?: boolean;
}): PluginIssueUpdate {
    return {
        fields: faker().helpers.maybe(() => {
            return {
                description: faker().helpers.maybe(() => faker().string.sample()),
                issuetype: faker().helpers.maybe(() => {
                    return { name: faker().string.sample() };
                }),
                summary: faker().helpers.maybe(() => faker().string.sample()),
            };
        }),
        ...(options?.transition && { transition: { to: { name: faker().color.human() } } }),
        ...(options?.key !== false && { key: faker().helpers.maybe(() => generateFakeIssueKey()) }),
    };
}

/**
 * Generate an array of fake title strings, with an optional Jira issue key inserted.
 *
 * @param issueKey - whether to include the specified Jira issue key in one of the titles
 * @param count - how many titles to generate (default 3)
 * @param projectKeys - optional list of project prefixes to use for the Jira key
 *
 * @returns the generated array of title strings
 */
export function generateFakeTitles(issueKey?: string, count = 3): string[] {
    const titles = Array.from({ length: count }, () => faker().lorem.sentence());
    if (!issueKey) {
        return titles;
    }
    const targetIndex = faker().number.int({ max: count - 1, min: 0 });
    const title = titles[targetIndex];
    const insertPos = faker().number.int({ max: title.length, min: 0 });
    titles[targetIndex] = `${title.slice(0, insertPos)} ${issueKey} ${title.slice(insertPos)}`;
    return titles;
}

export function generateFakeRunResultV12(options?: {
    projectKey?: string;
    specExtensions?: string[];
}): MinimalRunResult<"<13"> {
    const rootDir = faker().system.directoryPath();
    const fileName = faker().system.fileName({ extensionCount: 0 });
    const fileExtension = options?.specExtensions
        ? faker().helpers.arrayElement(options.specExtensions)
        : faker().system.fileExt();
    return {
        spec: {
            absolute: `${rootDir}${fileName}.${fileExtension}`,
            relative: `${fileName}.${fileExtension}`,
        },
        tests: faker().helpers.multiple(
            () => {
                return {
                    attempts: faker().helpers.multiple(
                        () => {
                            return {
                                duration: faker().number.int({ min: 0 }),
                                screenshots: [{ path: faker().system.filePath() }],
                                startedAt: faker().date.recent().toISOString(),
                                state: faker().helpers.arrayElement([
                                    CypressStatus.FAILED,
                                    CypressStatus.PASSED,
                                    CypressStatus.PENDING,
                                    CypressStatus.SKIPPED,
                                ]),
                            };
                        },
                        { count: faker().number.int({ max: 5, min: 1 }) }
                    ),
                    title: generateFakeTitles(
                        generateFakeIssueKey({
                            projectKey: options?.projectKey,
                        })
                    ),
                };
            },
            { count: faker().number.int({ max: 5, min: 1 }) }
        ),
        video: faker().datatype.boolean() ? faker().system.filePath() : null,
    };
}

export function generateFakeRunResultV13(options?: {
    projectKey?: string;
    specExtensions?: string[];
}): MinimalRunResult<"13"> {
    const rootDir = faker().system.directoryPath();
    const fileName = faker().system.fileName({ extensionCount: 0 });
    const fileExtension = options?.specExtensions
        ? faker().helpers.arrayElement(options.specExtensions)
        : faker().system.fileExt();
    return {
        spec: {
            absolute: `${rootDir}${fileName}.${fileExtension}`,
            relative: `${fileName}.${fileExtension}`,
        },
        stats: { startedAt: faker().date.recent().toISOString() },
        tests: faker().helpers.multiple(
            () => {
                return {
                    attempts: faker().helpers.multiple(
                        () => {
                            return {
                                state: faker().helpers.arrayElement([
                                    CypressStatus.FAILED,
                                    CypressStatus.PASSED,
                                    CypressStatus.PENDING,
                                    CypressStatus.SKIPPED,
                                ]),
                            };
                        },
                        { count: faker().number.int({ max: 5, min: 1 }) }
                    ),
                    duration: faker().number.int({ min: 0 }),
                    state: faker().color.human(),
                    title: generateFakeTitles(
                        generateFakeIssueKey({
                            projectKey: options?.projectKey,
                        })
                    ),
                };
            },
            { count: faker().number.int({ max: 5, min: 1 }) }
        ),
        video: faker().datatype.boolean() ? faker().system.filePath() : null,
    };
}

export function generateFakeRunResultV14(options?: {
    projectKey?: string;
    specExtensions?: string[];
}): MinimalRunResult<">=14"> {
    return generateFakeRunResultV13(options);
}

export function generateFakeCypressRunResultV12(options?: {
    projectKey?: string;
    runs?:
        | {
              max?: number;
              min?: number;
              specExtensions?: string[];
          }
        | MinimalRunResult<"<13">[];
}): MinimalCypressRunResult<"<13"> {
    const browserName = faker().string.alpha();
    const browserVersion = faker().string.numeric();
    const cypressVersion = generateFakeSemVer({ major: { max: 12, min: 0 } });
    const startedTestsAt = faker().date.past().toISOString();
    const status = "finished";
    if (Array.isArray(options?.runs)) {
        return {
            browserName: browserName,
            browserVersion: browserVersion,
            cypressVersion: cypressVersion,
            runs: options.runs,
            startedTestsAt: startedTestsAt,
            status: status,
        };
    }
    const minRuns = options?.runs?.min;
    const maxRuns = options?.runs?.max;
    const specExtensions = options?.runs?.specExtensions;
    const runs = faker().helpers.multiple(
        () =>
            generateFakeRunResultV12({
                projectKey: options?.projectKey,
                specExtensions: specExtensions,
            }),
        { count: { max: maxRuns ?? 5, min: minRuns ?? 1 } }
    );
    return {
        browserName: browserName,
        browserVersion: browserVersion,
        cypressVersion: cypressVersion,
        runs: runs,
        startedTestsAt: startedTestsAt,
        status: status,
    };
}

export function generateFakeCypressRunResultV13(options?: {
    projectKey?: string;
    runs?:
        | {
              max?: number;
              min?: number;
              specExtensions?: string[];
          }
        | MinimalRunResult<"13">[];
}): MinimalCypressRunResult<"13"> {
    const browserName = faker().string.alpha();
    const browserVersion = faker().string.numeric();
    const cypressVersion = generateFakeSemVer({ major: { max: 12, min: 0 } });
    const startedTestsAt = faker().date.past().toISOString();
    if (Array.isArray(options?.runs)) {
        return {
            browserName: browserName,
            browserVersion: browserVersion,
            cypressVersion: cypressVersion,
            runs: options.runs,
            startedTestsAt: startedTestsAt,
        };
    }
    const minRuns = options?.runs?.min;
    const maxRuns = options?.runs?.max;
    const specExtensions = options?.runs?.specExtensions;
    const runs = faker().helpers.multiple(
        () =>
            generateFakeRunResultV13({
                projectKey: options?.projectKey,
                specExtensions: specExtensions,
            }),
        { count: { max: maxRuns ?? 5, min: minRuns ?? 1 } }
    );
    return {
        browserName: browserName,
        browserVersion: browserVersion,
        cypressVersion: cypressVersion,
        runs: runs,
        startedTestsAt: startedTestsAt,
    };
}

export function generateFakeCypressRunResultV14(options?: {
    projectKey?: string;
    runs?:
        | {
              max?: number;
              min?: number;
              specExtensions?: string[];
          }
        | MinimalRunResult<">=14">[];
}): MinimalCypressRunResult<">=14"> {
    return generateFakeCypressRunResultV13(options);
}

export function generateFakeScreenshotDetails(): ScreenshotDetails[] {
    return faker().helpers.multiple(() => {
        return {
            blackout: [],
            dimensions: {
                height: faker().number.int({ min: 0 }),
                width: faker().number.int({ min: 0 }),
                x: faker().number.int({ min: 0 }),
                y: faker().number.int({ min: 0 }),
            },
            duration: faker().number.int({ min: 0 }),
            multipart: faker().datatype.boolean(),
            name: faker().system.fileName(),
            path: faker().system.filePath(),
            pixelRatio: faker().number.int({ min: 0 }),
            scaled: faker().datatype.boolean(),
            size: faker().number.int({ min: 0 }),
            specName: faker().hacker.phrase(),
            takenAt: faker().date.recent().toISOString(),
            testFailure: faker().datatype.boolean(),
        };
    });
}

export function generateFakeXrayJsonV12(options?: {
    projectKey?: string;
    testExecutionIssueKey?: string;
}) {
    const cypressResults = generateFakeCypressRunResultV12({ projectKey: options?.projectKey });
    const xrayTests: XrayTest[] = cypressResults.runs
        .flatMap((run) => run.tests)
        .map((test) => {
            return { status: faker().helpers.arrayElement(test.attempts).state };
        });
    const results: XrayTestExecutionResults = {
        tests: [xrayTests[0], ...xrayTests.slice(1)],
    };
    if (faker().datatype.boolean()) {
        results.info = { summary: faker().book.title() };
    }
    if (options?.testExecutionIssueKey) {
        results.testExecutionKey = options.testExecutionIssueKey;
    }
    return { cypressResults, xrayJson: results };
}

export function generateFakeXrayJsonV13(options?: {
    projectKey?: string;
    testExecutionIssueKey?: string;
}) {
    const cypressResults = generateFakeCypressRunResultV13({ projectKey: options?.projectKey });
    const xrayTests: XrayTest[] = cypressResults.runs
        .flatMap((run) => run.tests)
        .map((test) => {
            return { status: faker().helpers.arrayElement(test.attempts).state };
        });
    const results: XrayTestExecutionResults = {
        tests: [xrayTests[0], ...xrayTests.slice(1)],
    };
    if (faker().datatype.boolean()) {
        results.info = { summary: faker().book.title() };
    }
    if (options?.testExecutionIssueKey) {
        results.testExecutionKey = options.testExecutionIssueKey;
    }
    return { cypressResults, xrayJson: results };
}

export function generateFakeXrayJsonV14(options?: {
    projectKey?: string;
    testExecutionIssueKey?: string;
}) {
    const cypressResults = generateFakeCypressRunResultV14({ projectKey: options?.projectKey });
    const xrayTests: XrayTest[] = cypressResults.runs
        .flatMap((run) => run.tests)
        .map((test) => {
            return { status: faker().helpers.arrayElement(test.attempts).state };
        });
    const results: XrayTestExecutionResults = {
        tests: [xrayTests[0], ...xrayTests.slice(1)],
    };
    if (faker().datatype.boolean()) {
        results.info = { summary: faker().book.title() };
    }
    if (options?.testExecutionIssueKey) {
        results.testExecutionKey = options.testExecutionIssueKey;
    }
    return { cypressResults, xrayJson: results };
}

export function generateFakeMultipartInfo(options: {
    fields?: PluginIssueUpdate["fields"];
    includeRandomField?: boolean;
    projectKey: string;
}): MultipartInfo {
    return {
        fields: {
            ...options.fields,
            ...(options.includeRandomField && faker().science.unit()),
            project: { key: options.projectKey },
        },
    };
}

export function generateFakeFeatureFileData(options: {
    minIssueKeysPerFeatureFile?: number;
    projectKey: string;
}) {
    return faker().helpers.multiple(
        () => {
            return {
                filePath: faker().system.filePath(),
                issueKeys: faker().helpers.multiple(
                    () => generateFakeIssueKey({ projectKey: options.projectKey }),
                    { count: { max: 3, min: options.minIssueKeysPerFeatureFile ?? 0 } }
                ),
            };
        },
        { count: { max: 5, min: 1 } }
    );
}

export function generateFakeIssueSnapshots(options: {
    generateErrors: "one-or-more" | "zero-or-more" | "zero";
    generateLabels: "one-or-more" | "zero-or-more" | "zero";
    issueKeys: string[];
    summaries?: Record<string, string>;
}): JiraSnapshot {
    return {
        errorMessages:
            options.generateErrors === "zero"
                ? []
                : faker().helpers.multiple(() => faker().company.buzzNoun(), {
                      count: { max: 3, min: options.generateErrors === "zero-or-more" ? 0 : 1 },
                  }),
        issues: options.issueKeys.map((issueKey) => {
            const summary = options.summaries?.[issueKey] ?? faker().company.buzzPhrase();
            return {
                key: issueKey,
                labels:
                    options.generateLabels === "zero"
                        ? []
                        : faker().helpers.multiple(() => faker().commerce.product(), {
                              count: {
                                  max: 5,
                                  min: options.generateLabels === "zero-or-more" ? 0 : 1,
                              },
                          }),
                summary: summary,
            };
        }),
    };
}

export function generateFakeCucumberMultipartFeatures(): CucumberMultipartFeature[] {
    return faker().helpers.multiple(() => {
        return {
            description: faker().commerce.productDescription(),
            elements: faker().helpers.multiple(() => {
                return {
                    description: faker().commerce.productDescription(),
                    keyword: faker().word.noun(),
                    line: faker().number.int(),
                    name: faker().person.firstName(),
                    steps: faker().helpers.multiple(() => {
                        return {
                            keyword: faker().word.noun(),
                            line: faker().number.int(),
                            name: faker().person.firstName(),
                            result: { status: faker().color.human() },
                        };
                    }),
                    type: faker().helpers.arrayElement(["background", "scenario"]),
                };
            }),
            id: faker().commerce.isbn(),
            keyword: faker().word.noun(),
            line: faker().number.int(),
            name: faker().person.firstName(),
            uri: faker().internet.url(),
        };
    });
}

export function generateFakeClientCombination(options?: { kind?: "cloud" | "server" }): {
    clients: ClientCombination;
    httpClients: HttpClientCombination;
} {
    const httpClientJira = new AxiosRestClient(axios);
    const httpClientXray = new AxiosRestClient(axios);
    const kind = options?.kind ?? faker().helpers.arrayElement(["server", "cloud"]);
    if (kind === "server") {
        return {
            clients: {
                jiraClient: new JiraClientServer(
                    faker().internet.url(),
                    new PatCredentials(faker().internet.password()),
                    httpClientJira
                ),
                kind: kind,
                xrayClient: new XrayClientServer(
                    faker().internet.url(),
                    new PatCredentials(faker().internet.password()),
                    httpClientXray
                ),
            },
            httpClients: {
                jira: httpClientJira,
                xray: httpClientXray,
            },
        };
    }
    return {
        clients: {
            jiraClient: new JiraClientCloud(
                faker().internet.url(),
                new PatCredentials(faker().internet.password()),
                httpClientJira
            ),
            kind: kind,
            xrayClient: new XrayClientCloud(
                faker().internet.url(),
                new JwtCredentials(
                    faker().internet.username(),
                    faker().internet.password(),
                    faker().internet.url(),
                    httpClientXray
                ),
                httpClientXray
            ),
        },
        httpClients: {
            jira: httpClientJira,
            xray: httpClientXray,
        },
    };
}

export function generateFakeExternalPluginOptions(options?: {
    cucumber?: {
        featureFileExtension?: CucumberOptions["featureFileExtension"];
        uploadFeatures?: CucumberOptions["uploadFeatures"];
    };
    jira?: {
        testExecutionIssue?: JiraOptions["testExecutionIssue"] | null;
        testPlanIssueKey?: JiraOptions["testPlanIssueKey"];
    };
    plugin?: {
        enabled?: PluginOptions["enabled"];
        listenerDefault?: PluginOptions["listener"];
        logDirectory?: PluginOptions["logDirectory"];
        logger?: PluginOptions["logger"];
    };
}): CypressXrayPluginOptions {
    return {
        cucumber: {
            downloadFeatures: faker().helpers.maybe(() => faker().datatype.boolean()),
            featureFileExtension:
                options?.cucumber?.featureFileExtension ?? faker().system.fileExt(),
            prefixes: faker().helpers.maybe(() => {
                return {
                    precondition: faker().helpers.maybe(() => faker().string.sample()),
                    test: faker().helpers.maybe(() => faker().string.sample()),
                };
            }),
            uploadFeatures:
                options?.cucumber?.uploadFeatures ??
                faker().helpers.maybe(() => faker().datatype.boolean()),
        },
        http: faker().helpers.maybe(() => {
            return {
                jira: faker().helpers.maybe(() => {
                    return {
                        rateLimiting: faker().helpers.maybe(() => {
                            return {
                                requestsPerSecond: faker().helpers.maybe(() =>
                                    faker().number.int()
                                ),
                            };
                        }),
                    };
                }),
                rateLimiting: faker().helpers.maybe(() => {
                    return {
                        requestsPerSecond: faker().helpers.maybe(() => faker().number.int()),
                    };
                }),
                xray: faker().helpers.maybe(() => {
                    return {
                        rateLimiting: faker().helpers.maybe(() => {
                            return {
                                requestsPerSecond: faker().helpers.maybe(() =>
                                    faker().number.int()
                                ),
                            };
                        }),
                    };
                }),
            };
        }),
        jira: {
            attachVideos: faker().helpers.maybe(() => faker().datatype.boolean()),
            fields: faker().helpers.maybe(() => {
                return {
                    description: faker().helpers.maybe(() => faker().string.uuid()),
                    labels: faker().helpers.maybe(() => faker().string.uuid()),
                    summary: faker().helpers.maybe(() => faker().string.uuid()),
                    testEnvironments: faker().helpers.maybe(() => faker().string.uuid()),
                    testPlan: faker().helpers.maybe(() => faker().string.uuid()),
                };
            }),
            projectKey: generateFakeProjectKey(),
            testExecutionIssue:
                options?.jira?.testExecutionIssue === null
                    ? undefined
                    : (options?.jira?.testExecutionIssue ??
                      faker().helpers.maybe(() =>
                          generateFakePluginIssueUpdate({
                              key: faker().datatype.boolean(),
                          })
                      )),
            testExecutionIssueDescription: faker().helpers.maybe(() =>
                faker().commerce.productDescription()
            ),
            testExecutionIssueKey: faker().helpers.maybe(() => generateFakeIssueKey()),
            testExecutionIssueSummary: faker().helpers.maybe(() => faker().commerce.product()),
            testExecutionIssueType: faker().helpers.maybe(() => faker().book.genre()),
            testPlanIssueKey:
                options?.jira?.testPlanIssueKey ??
                faker().helpers.maybe(() => generateFakeIssueKey()),
            testPlanIssueType: faker().helpers.maybe(() => faker().book.genre()),
            url: faker().internet.url(),
        },
        plugin: {
            debug: faker().helpers.maybe(() => faker().datatype.boolean()),
            enabled:
                options?.plugin?.enabled ?? faker().helpers.maybe(() => faker().datatype.boolean()),
            listener: faker().helpers.maybe(() => options?.plugin?.listenerDefault),
            logDirectory:
                options?.plugin?.logDirectory ??
                faker().helpers.maybe(() => faker().system.directoryPath()),
            logger: options?.plugin?.logger ?? faker().helpers.maybe(() => stub()),
            normalizeScreenshotNames: faker().helpers.maybe(() => faker().datatype.boolean()),
            splitUpload: faker().helpers.maybe(() => faker().datatype.boolean()),
            uploadLastAttempt: faker().helpers.maybe(() => faker().datatype.boolean()),
        },
        xray: {
            status: faker().helpers.maybe(() => {
                return {
                    aggregate: faker().helpers.maybe(() => stub()),
                    failed: faker().helpers.maybe(() => faker().color.human()),
                    passed: faker().helpers.maybe(() => faker().color.human()),
                    pending: faker().helpers.maybe(() => faker().color.human()),
                    skipped: faker().helpers.maybe(() => faker().color.human()),
                    step: faker().helpers.maybe(() => {
                        return {
                            failed: faker().helpers.maybe(() => faker().color.human()),
                            passed: faker().helpers.maybe(() => faker().color.human()),
                            pending: faker().helpers.maybe(() => faker().color.human()),
                            skipped: faker().helpers.maybe(() => faker().color.human()),
                        };
                    }),
                };
            }),
            testEnvironments: faker().helpers.maybe(() => [
                faker().color.human(),
                ...faker().helpers.multiple(() => faker().color.human(), {
                    count: { max: 3, min: 0 },
                }),
            ]),
            uploadRequests: faker().helpers.maybe(() => faker().datatype.boolean()),
            uploadResults: faker().helpers.maybe(() => faker().datatype.boolean()),
            uploadScreenshots: faker().helpers.maybe(() => faker().datatype.boolean()),
            url: faker().helpers.maybe(() => faker().internet.url()),
        },
    };
}

export function generateFakeInternalPluginOptions(
    options?: CypressXrayPluginOptions
): InternalCypressXrayPluginOptions {
    return {
        cucumber: {
            downloadFeatures: options?.cucumber?.downloadFeatures ?? faker().datatype.boolean(),
            featureFileExtension:
                options?.cucumber?.featureFileExtension ?? faker().system.fileExt(),
            prefixes: {
                precondition: options?.cucumber?.prefixes?.precondition,
                test: options?.cucumber?.prefixes?.test,
            },
            preprocessor: {
                json: {
                    enabled: faker().datatype.boolean(),
                    output: faker().system.fileExt(),
                },
            },
            uploadFeatures: options?.cucumber?.uploadFeatures ?? faker().datatype.boolean(),
        },
        http: options?.http,
        jira: {
            attachVideos: options?.jira.attachVideos ?? faker().datatype.boolean(),
            fields: {
                description: options?.jira.fields?.description,
                labels: options?.jira.fields?.labels,
                summary: options?.jira.fields?.summary,
                testEnvironments: options?.jira.fields?.testEnvironments,
                testPlan: options?.jira.fields?.testPlan,
            },
            projectKey: options?.jira.projectKey ?? generateFakeProjectKey(),
            testExecutionIssue: options?.jira.testExecutionIssue,
            testExecutionIssueDescription: options?.jira.testExecutionIssueDescription,
            testExecutionIssueKey: options?.jira.testExecutionIssueKey,
            testExecutionIssueSummary: options?.jira.testExecutionIssueSummary,
            testExecutionIssueType: options?.jira.testExecutionIssueType ?? faker().book.genre(),
            testPlanIssueKey: options?.jira.testPlanIssueKey,
            testPlanIssueType: options?.jira.testPlanIssueType ?? faker().book.genre(),
            url: options?.jira.url ?? faker().internet.url(),
        },
        plugin: {
            debug: options?.plugin?.debug ?? faker().datatype.boolean(),
            enabled: options?.plugin?.enabled ?? faker().datatype.boolean(),
            listener: options?.plugin?.listener,
            logDirectory: options?.plugin?.logDirectory ?? faker().system.directoryPath(),
            logger: options?.plugin?.logger,
            normalizeScreenshotNames:
                options?.plugin?.normalizeScreenshotNames ?? faker().datatype.boolean(),
            splitUpload: options?.plugin?.splitUpload ?? faker().datatype.boolean(),
            uploadLastAttempt: options?.plugin?.uploadLastAttempt ?? faker().datatype.boolean(),
        },
        xray: {
            status: {
                aggregate: options?.xray?.status?.aggregate,
                failed: options?.xray?.status?.failed,
                passed: options?.xray?.status?.passed,
                pending: options?.xray?.status?.pending,
                skipped: options?.xray?.status?.skipped,
                step: options?.xray?.status?.step,
            },
            testEnvironments: options?.xray?.testEnvironments,
            uploadRequests: options?.xray?.uploadRequests ?? faker().datatype.boolean(),
            uploadResults: options?.xray?.uploadResults ?? faker().datatype.boolean(),
            uploadScreenshots: options?.xray?.uploadScreenshots ?? faker().datatype.boolean(),
            url: options?.xray?.url,
        },
    };
}

export function generateFakeFileObject(options?: { fileExtension?: string }): FileObject {
    return {
        ...({} as FileObject),
        filePath: `${faker().system.directoryPath()}/${faker().system.fileName({ extensionCount: 0 })}.${options?.fileExtension ?? faker().system.fileExt()}`,
        outputPath: faker().system.filePath(),
        shouldWatch: faker().datatype.boolean(),
    };
}

export function generateFakeXrayEvidenceItem(): Required<XrayEvidenceItem> {
    return {
        contentType: faker().system.mimeType(),
        data: Buffer.from(faker().string.sample()).toString("base64"),
        filename: faker().system.fileName(),
    };
}
