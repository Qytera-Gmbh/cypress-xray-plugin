import assert from "node:assert";
import { describe, it } from "node:test";
import {
    faker,
    generateFakeCucumberMultipartFeatures,
    generateFakeCypressRunResultV12,
    generateFakeCypressRunResultV13,
    generateFakeCypressRunResultV14,
    generateFakeFeatureFileData,
    generateFakeIssueKey,
    generateFakeIssueSnapshots,
    generateFakeMultipartInfo,
    generateFakePluginIssueUpdate,
    generateFakeProjectKey,
    generateFakeScreenshotDetails,
    generateFakeXrayJsonV12,
    generateFakeXrayJsonV13,
    generateFakeXrayJsonV14,
} from "../../test/faker";
import { countingMock, stub } from "../../test/mocks";
import type {
    HasEditIssueEndpoint,
    HasGetFieldsEndpoint,
    HasSearchEndpoint,
} from "../client/jira/jira-client";
import type {
    HasImportExecutionCucumberMultipartEndpoint,
    HasImportExecutionMultipartEndpoint,
    HasImportFeatureEndpoint,
} from "../client/xray/xray-client";
import type {
    HasAddEvidenceToTestRunEndpoint,
    HasGetTestRunResultsEndpoint,
} from "../client/xray/xray-client-cloud";
import type {
    HasAddEvidenceEndpoint,
    HasGetTestRunEndpoint,
} from "../client/xray/xray-client-server";
import { dedent } from "../util/dedent";
import type { Logger } from "../util/logging";
import type {
    EvidenceCollection,
    IterationParameterCollection,
    PluginEventEmitter,
} from "./context";
import featureFileProcessing from "./feature-file-processing/feature-file-processing";
import featureFileUpload from "./feature-file-upload/feature-file-upload";
import jiraIssueSnapshots from "./jira-issue-snapshots/jira-issue-snapshots";
import pluginPhases from "./plugin-phases";
import cucumberResultConversion from "./results-conversion/cucumber-result-conversion";
import cypressResultConversion from "./results-conversion/cypress-result-conversion";
import multipartInfoConversion from "./results-conversion/multipart-info-conversion";
import cucumberResultUpload from "./results-upload/cucumber-result-upload";
import cypressResultUpload from "./results-upload/cypress-result-upload";

void describe(pluginPhases.runFeatureFileUpload.name, () => {
    const projectKey = generateFakeProjectKey();
    const cucumberOptions = {
        prefixes: {
            precondition: faker().helpers.maybe(() => faker().string.alpha()),
            test: faker().helpers.maybe(() => faker().string.alpha()),
        },
    };
    const displayCloudHelp = faker().datatype.boolean();
    for (const featureFileData of [[], generateFakeFeatureFileData({ projectKey: projectKey })]) {
        const processedFeatureFiles = featureFileData.map((data) => {
            return { allIssueKeys: data.issueKeys, filePath: data.filePath };
        });
        const affectedIssues = faker().helpers.arrayElements(
            processedFeatureFiles.flatMap((data) => data.allIssueKeys),
            { max: processedFeatureFiles.flatMap((data) => data.allIssueKeys).length, min: 0 }
        );
        void describe(`with ${featureFileData.length.toString()} feature files to upload`, () => {
            void it("calls all submodules with the correct parameters", async (context) => {
                // Test setup.
                const uploadResults = faker().datatype.boolean();
                const firstIssueSnapshot = generateFakeIssueSnapshots({
                    generateErrors: "zero",
                    generateLabels: "zero-or-more",
                    issueKeys: featureFileData.flatMap((data) => data.issueKeys),
                });
                const secondIssueSnapshot = generateFakeIssueSnapshots({
                    generateErrors: "zero",
                    generateLabels: "zero-or-more",
                    issueKeys: featureFileData.flatMap((data) => data.issueKeys),
                });
                const jiraClientMock: HasSearchEndpoint & HasEditIssueEndpoint = {
                    editIssue: stub(),
                    search: stub(),
                };
                const xrayClientMock: HasImportFeatureEndpoint = { importFeature: stub() };
                const processFeatureFilesMock = context.mock.method(
                    featureFileProcessing,
                    "processFeatureFiles",
                    () => processedFeatureFiles
                );
                const getIssueSnapshotsMock = context.mock.method(
                    jiraIssueSnapshots,
                    "getIssueSnapshots",
                    countingMock(
                        Promise.resolve(firstIssueSnapshot),
                        Promise.resolve(secondIssueSnapshot)
                    )
                );
                const uploadFeatureFilesMock = context.mock.method(
                    featureFileUpload,
                    "uploadFeatureFiles",
                    () => Promise.resolve(affectedIssues)
                );
                const restoreIssueSnapshotsMock = context.mock.method(
                    jiraIssueSnapshots,
                    "restoreIssueSnapshots",
                    () => Promise.resolve()
                );
                const logger = { message: stub() };
                // Test execution.
                await pluginPhases.runFeatureFileUpload({
                    clients: { jira: jiraClientMock, xray: xrayClientMock },
                    context: {
                        featureFilePaths: featureFileData.map((data) => data.filePath),
                    },
                    isCloudEnvironment: displayCloudHelp,
                    logger: logger,
                    options: {
                        cucumber: cucumberOptions,
                        jira: { projectKey: projectKey },
                        xray: { uploadResults: uploadResults },
                    },
                });
                // Test validation.
                assert.deepStrictEqual(
                    processFeatureFilesMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                displayCloudHelp: displayCloudHelp,
                                featureFilePaths: featureFileData.map((data) => data.filePath),
                                logger: logger,
                                options: {
                                    cucumber: cucumberOptions,
                                    jira: { projectKey: projectKey },
                                },
                            },
                        ],
                    ]
                );
                assert.deepStrictEqual(
                    getIssueSnapshotsMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                client: jiraClientMock,
                                issues: featureFileData
                                    .flatMap((data) => data.issueKeys)
                                    .map((key) => {
                                        return { key };
                                    }),
                            },
                        ],
                        [
                            {
                                client: jiraClientMock,
                                issues: affectedIssues.map((key) => {
                                    return { key };
                                }),
                            },
                        ],
                    ]
                );
                assert.deepStrictEqual(
                    uploadFeatureFilesMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                clients: { xray: xrayClientMock },
                                logger: logger,
                                options: {
                                    jira: { projectKey: projectKey },
                                },
                                processedFeatureFiles: processedFeatureFiles,
                            },
                        ],
                    ]
                );
                assert.deepStrictEqual(
                    restoreIssueSnapshotsMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                client: jiraClientMock,
                                logger: logger,
                                newData: secondIssueSnapshot.issues,
                                previousData: firstIssueSnapshot.issues,
                            },
                        ],
                    ]
                );
            });

            void it("snapshots and returns the initial test execution issue summary if both snapshots contain the test execution issue", async (context) => {
                // Test setup.
                const testExecutionIssueKey = generateFakeIssueKey();
                const testExecutionIssueSummary = faker().string.fromCharacters("abc", 5);
                const uploadResults = true;
                const firstIssueSnapshot = generateFakeIssueSnapshots({
                    generateErrors: "zero",
                    generateLabels: "zero-or-more",
                    issueKeys: [
                        ...featureFileData.flatMap((data) => data.issueKeys),
                        testExecutionIssueKey,
                    ],
                    summaries: { [testExecutionIssueKey]: testExecutionIssueSummary },
                });
                const secondIssueSnapshot = generateFakeIssueSnapshots({
                    generateErrors: "zero",
                    generateLabels: "zero-or-more",
                    issueKeys: [
                        ...featureFileData.flatMap((data) => data.issueKeys),
                        testExecutionIssueKey,
                    ],
                    summaries: {
                        [testExecutionIssueKey]: faker().string.fromCharacters("xyz", 5),
                    },
                });
                const jiraClientMock: HasSearchEndpoint & HasEditIssueEndpoint = {
                    editIssue: stub(),
                    search: stub(),
                };
                const xrayClientMock: HasImportFeatureEndpoint = { importFeature: stub() };
                context.mock.method(
                    featureFileProcessing,
                    "processFeatureFiles",
                    () => processedFeatureFiles
                );
                context.mock.method(
                    jiraIssueSnapshots,
                    "getIssueSnapshots",
                    countingMock(
                        Promise.resolve(firstIssueSnapshot),
                        Promise.resolve(secondIssueSnapshot)
                    )
                );
                context.mock.method(featureFileUpload, "uploadFeatureFiles", () =>
                    Promise.resolve(affectedIssues)
                );
                context.mock.method(jiraIssueSnapshots, "restoreIssueSnapshots", () =>
                    Promise.resolve()
                );
                const messageMock = context.mock.fn<Logger["message"]>();
                // Test execution.
                const result = await pluginPhases.runFeatureFileUpload({
                    clients: { jira: jiraClientMock, xray: xrayClientMock },
                    context: { featureFilePaths: featureFileData.map((data) => data.filePath) },
                    isCloudEnvironment: displayCloudHelp,
                    logger: { message: messageMock },
                    options: {
                        cucumber: cucumberOptions,
                        jira: {
                            projectKey: projectKey,
                            testExecutionIssue: { key: testExecutionIssueKey },
                        },
                        xray: { uploadResults: uploadResults },
                    },
                });
                // Test validation.
                assert.deepStrictEqual(result, testExecutionIssueSummary);
            });

            void it("snapshots and returns the initial test execution issue summary if only the first snapshot contains the test execution issue", async (context) => {
                // Test setup.
                const testExecutionIssueKey = generateFakeIssueKey();
                const testExecutionIssueSummary = faker().string.fromCharacters("abc", 5);
                const uploadResults = true;
                const firstIssueSnapshot = generateFakeIssueSnapshots({
                    generateErrors: "zero",
                    generateLabels: "zero-or-more",
                    issueKeys: [
                        ...featureFileData.flatMap((data) => data.issueKeys),
                        testExecutionIssueKey,
                    ],
                    summaries: { [testExecutionIssueKey]: testExecutionIssueSummary },
                });
                const secondIssueSnapshot = generateFakeIssueSnapshots({
                    generateErrors: "zero",
                    generateLabels: "zero-or-more",
                    issueKeys: featureFileData.flatMap((data) => data.issueKeys),
                });
                const jiraClientMock: HasSearchEndpoint & HasEditIssueEndpoint = {
                    editIssue: stub(),
                    search: stub(),
                };
                const xrayClientMock: HasImportFeatureEndpoint = { importFeature: stub() };
                context.mock.method(
                    featureFileProcessing,
                    "processFeatureFiles",
                    () => processedFeatureFiles
                );
                context.mock.method(
                    jiraIssueSnapshots,
                    "getIssueSnapshots",
                    countingMock(
                        Promise.resolve(firstIssueSnapshot),
                        Promise.resolve(secondIssueSnapshot)
                    )
                );
                context.mock.method(featureFileUpload, "uploadFeatureFiles", () =>
                    Promise.resolve(affectedIssues)
                );
                context.mock.method(jiraIssueSnapshots, "restoreIssueSnapshots", () =>
                    Promise.resolve()
                );
                const messageMock = context.mock.fn<Logger["message"]>();
                // Test execution.
                const result = await pluginPhases.runFeatureFileUpload({
                    clients: { jira: jiraClientMock, xray: xrayClientMock },
                    context: { featureFilePaths: featureFileData.map((data) => data.filePath) },
                    isCloudEnvironment: displayCloudHelp,
                    logger: { message: messageMock },
                    options: {
                        cucumber: cucumberOptions,
                        jira: {
                            projectKey: projectKey,
                            testExecutionIssue: { key: testExecutionIssueKey },
                        },
                        xray: { uploadResults: uploadResults },
                    },
                });
                // Test validation.
                assert.deepStrictEqual(result, testExecutionIssueSummary);
            });

            void it("does not snapshot the initial test execution issue if a summary is provided", async (context) => {
                // Test setup.
                const testExecutionIssueKey = generateFakeIssueKey();
                const testExecutionIssueSummary = faker().string.fromCharacters("abc", 5);
                const uploadResults = true;
                const firstIssueSnapshot = generateFakeIssueSnapshots({
                    generateErrors: "zero",
                    generateLabels: "zero-or-more",
                    issueKeys: featureFileData.flatMap((data) => data.issueKeys),
                });
                const secondIssueSnapshot = generateFakeIssueSnapshots({
                    generateErrors: "zero",
                    generateLabels: "zero-or-more",
                    issueKeys: featureFileData.flatMap((data) => data.issueKeys),
                });
                const jiraClientMock: HasSearchEndpoint & HasEditIssueEndpoint = {
                    editIssue: stub(),
                    search: stub(),
                };
                const xrayClientMock: HasImportFeatureEndpoint = { importFeature: stub() };
                context.mock.method(
                    featureFileProcessing,
                    "processFeatureFiles",
                    () => processedFeatureFiles
                );
                const getIssueSnapshotsMock = context.mock.method(
                    jiraIssueSnapshots,
                    "getIssueSnapshots",
                    countingMock(
                        Promise.resolve(firstIssueSnapshot),
                        Promise.resolve(secondIssueSnapshot)
                    )
                );
                context.mock.method(featureFileUpload, "uploadFeatureFiles", () =>
                    Promise.resolve(affectedIssues)
                );
                context.mock.method(jiraIssueSnapshots, "restoreIssueSnapshots", () =>
                    Promise.resolve()
                );
                const messageMock = context.mock.fn<Logger["message"]>();
                // Test execution.
                const result = await pluginPhases.runFeatureFileUpload({
                    clients: { jira: jiraClientMock, xray: xrayClientMock },
                    context: { featureFilePaths: featureFileData.map((data) => data.filePath) },
                    isCloudEnvironment: displayCloudHelp,
                    logger: { message: messageMock },
                    options: {
                        cucumber: cucumberOptions,
                        jira: {
                            projectKey: projectKey,
                            testExecutionIssue: {
                                fields: { summary: testExecutionIssueSummary },
                                key: testExecutionIssueKey,
                            },
                        },
                        xray: { uploadResults: uploadResults },
                    },
                });
                // Test validation.
                assert.deepStrictEqual(
                    getIssueSnapshotsMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                client: jiraClientMock,
                                issues: featureFileData
                                    .flatMap((data) => data.issueKeys)
                                    .map((key) => {
                                        return { key };
                                    }),
                            },
                        ],
                        [
                            {
                                client: jiraClientMock,
                                issues: affectedIssues.map((key) => {
                                    return { key };
                                }),
                            },
                        ],
                    ]
                );
                assert.deepStrictEqual(result, testExecutionIssueSummary);
            });

            void it("returns the provided summary if specified if nothing else is provided", async (context) => {
                // Test setup.
                const testExecutionIssueSummary = faker().string.fromCharacters("abc", 5);
                const uploadResults = true;
                const firstIssueSnapshot = generateFakeIssueSnapshots({
                    generateErrors: "zero",
                    generateLabels: "zero-or-more",
                    issueKeys: featureFileData.flatMap((data) => data.issueKeys),
                });
                const secondIssueSnapshot = generateFakeIssueSnapshots({
                    generateErrors: "zero",
                    generateLabels: "zero-or-more",
                    issueKeys: featureFileData.flatMap((data) => data.issueKeys),
                });
                const jiraClientMock: HasSearchEndpoint & HasEditIssueEndpoint = {
                    editIssue: stub(),
                    search: stub(),
                };
                const xrayClientMock: HasImportFeatureEndpoint = { importFeature: stub() };
                context.mock.method(
                    featureFileProcessing,
                    "processFeatureFiles",
                    () => processedFeatureFiles
                );
                const getIssueSnapshotsMock = context.mock.method(
                    jiraIssueSnapshots,
                    "getIssueSnapshots",
                    countingMock(
                        Promise.resolve(firstIssueSnapshot),
                        Promise.resolve(secondIssueSnapshot)
                    )
                );
                context.mock.method(featureFileUpload, "uploadFeatureFiles", () =>
                    Promise.resolve(affectedIssues)
                );
                context.mock.method(jiraIssueSnapshots, "restoreIssueSnapshots", () =>
                    Promise.resolve()
                );
                const messageMock = context.mock.fn<Logger["message"]>();
                // Test execution.
                const result = await pluginPhases.runFeatureFileUpload({
                    clients: { jira: jiraClientMock, xray: xrayClientMock },
                    context: { featureFilePaths: featureFileData.map((data) => data.filePath) },
                    isCloudEnvironment: displayCloudHelp,
                    logger: { message: messageMock },
                    options: {
                        cucumber: cucumberOptions,
                        jira: {
                            projectKey: projectKey,
                            testExecutionIssue: {
                                fields: { summary: testExecutionIssueSummary },
                            },
                        },
                        xray: { uploadResults: uploadResults },
                    },
                });
                // Test validation.
                assert.deepStrictEqual(
                    getIssueSnapshotsMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                client: jiraClientMock,
                                issues: featureFileData
                                    .flatMap((data) => data.issueKeys)
                                    .map((key) => {
                                        return { key };
                                    }),
                            },
                        ],
                        [
                            {
                                client: jiraClientMock,
                                issues: affectedIssues.map((key) => {
                                    return { key };
                                }),
                            },
                        ],
                    ]
                );
                assert.deepStrictEqual(result, testExecutionIssueSummary);
            });
        });
    }

    void it("logs warnings for snapshot errors", async (context) => {
        // Test setup.
        const uploadResults = faker().datatype.boolean();
        const featureFileData = generateFakeFeatureFileData({
            minIssueKeysPerFeatureFile: 1,
            projectKey: projectKey,
        });
        const firstIssueSnapshot = generateFakeIssueSnapshots({
            generateErrors: "one-or-more",
            generateLabels: "zero-or-more",
            issueKeys: featureFileData.flatMap((data) => data.issueKeys),
        });
        const secondIssueSnapshot = generateFakeIssueSnapshots({
            generateErrors: "one-or-more",
            generateLabels: "zero-or-more",
            issueKeys: featureFileData.flatMap((data) => data.issueKeys),
        });
        const processedFeatureFiles = featureFileData.map((data) => {
            return { allIssueKeys: data.issueKeys, filePath: data.filePath };
        });
        const jiraClientMock: HasSearchEndpoint & HasEditIssueEndpoint = {
            editIssue: stub(),
            search: stub(),
        };
        const xrayClientMock: HasImportFeatureEndpoint = { importFeature: stub() };
        context.mock.method(
            featureFileProcessing,
            "processFeatureFiles",
            () => processedFeatureFiles
        );
        context.mock.method(
            jiraIssueSnapshots,
            "getIssueSnapshots",
            countingMock(Promise.resolve(firstIssueSnapshot), Promise.resolve(secondIssueSnapshot))
        );
        context.mock.method(featureFileUpload, "uploadFeatureFiles", () =>
            Promise.resolve(featureFileData.flatMap((data) => data.issueKeys))
        );
        context.mock.method(jiraIssueSnapshots, "restoreIssueSnapshots", () => Promise.resolve());
        const messageMock = context.mock.fn<Logger["message"]>();
        // Test execution.
        await pluginPhases.runFeatureFileUpload({
            clients: { jira: jiraClientMock, xray: xrayClientMock },
            context: { featureFilePaths: featureFileData.map((data) => data.filePath) },
            isCloudEnvironment: displayCloudHelp,
            logger: { message: messageMock },
            options: {
                cucumber: cucumberOptions,
                jira: { projectKey: projectKey },
                xray: { uploadResults: uploadResults },
            },
        });
        // Test validation.
        assert.deepStrictEqual(
            messageMock.mock.calls.map((call) => call.arguments),
            [
                [
                    "warning",
                    dedent(`
                        Backing up Jira issue data failed for some issues, which may result in undesired data being displayed after the plugin has run:

                          ${firstIssueSnapshot.errorMessages.join("\n")}
                    `),
                ],
                [
                    "warning",
                    dedent(`
                        Comparison of updated Jira issue data to backed up data failed for some issues, which may result in undesired data being displayed after the plugin has run:

                          ${secondIssueSnapshot.errorMessages.join("\n")}
                    `),
                ],
            ]
        );
    });

    void it("throws if the feature file processing fails", async (context) => {
        // Test setup.
        const uploadResults = faker().datatype.boolean();
        const featureFileData = generateFakeFeatureFileData({ projectKey: projectKey });
        const jiraClientMock: HasSearchEndpoint & HasEditIssueEndpoint = {
            editIssue: stub(),
            search: stub(),
        };
        const xrayClientMock: HasImportFeatureEndpoint = { importFeature: stub() };
        const errorMessage = faker().word.adjective();
        const processFeatureFilesMock = context.mock.method(
            featureFileProcessing,
            "processFeatureFiles",
            () => {
                throw new Error(errorMessage);
            }
        );
        const getIssueSnapshotsMock = context.mock.method(
            jiraIssueSnapshots,
            "getIssueSnapshots",
            stub()
        );
        const uploadFeatureFilesMock = context.mock.method(
            featureFileUpload,
            "uploadFeatureFiles",
            stub()
        );
        const restoreIssueSnapshotsMock = context.mock.method(
            jiraIssueSnapshots,
            "restoreIssueSnapshots",
            stub()
        );
        // Test execution.
        await assert.rejects(
            () =>
                pluginPhases.runFeatureFileUpload({
                    clients: { jira: jiraClientMock, xray: xrayClientMock },
                    context: { featureFilePaths: featureFileData.map((data) => data.filePath) },
                    isCloudEnvironment: displayCloudHelp,
                    logger: { message: stub() },
                    options: {
                        cucumber: cucumberOptions,
                        jira: { projectKey: projectKey },
                        xray: { uploadResults: uploadResults },
                    },
                }),
            new Error(errorMessage)
        );
        // Test validation.
        assert.deepStrictEqual(processFeatureFilesMock.mock.callCount(), 1);
        assert.deepStrictEqual(getIssueSnapshotsMock.mock.callCount(), 0);
        assert.deepStrictEqual(uploadFeatureFilesMock.mock.callCount(), 0);
        assert.deepStrictEqual(restoreIssueSnapshotsMock.mock.callCount(), 0);
    });

    void it("throws if the first snapshot fails", async (context) => {
        // Test setup.
        const uploadResults = faker().datatype.boolean();
        const featureFileData = generateFakeFeatureFileData({ projectKey: projectKey });
        const processedFeatureFiles = featureFileData.map((data) => {
            return { allIssueKeys: data.issueKeys, filePath: data.filePath };
        });
        const jiraClientMock: HasSearchEndpoint & HasEditIssueEndpoint = {
            editIssue: stub(),
            search: stub(),
        };
        const xrayClientMock: HasImportFeatureEndpoint = { importFeature: stub() };
        const processFeatureFilesMock = context.mock.method(
            featureFileProcessing,
            "processFeatureFiles",
            () => processedFeatureFiles
        );
        const errorMessage = faker().word.adjective();
        const getIssueSnapshotsMock = context.mock.method(
            jiraIssueSnapshots,
            "getIssueSnapshots",
            countingMock(Promise.reject(new Error(errorMessage)))
        );
        const uploadFeatureFilesMock = context.mock.method(
            featureFileUpload,
            "uploadFeatureFiles",
            stub()
        );
        const restoreIssueSnapshotsMock = context.mock.method(
            jiraIssueSnapshots,
            "restoreIssueSnapshots",
            stub()
        );
        // Test execution.
        await assert.rejects(
            () =>
                pluginPhases.runFeatureFileUpload({
                    clients: { jira: jiraClientMock, xray: xrayClientMock },
                    context: { featureFilePaths: featureFileData.map((data) => data.filePath) },
                    isCloudEnvironment: displayCloudHelp,
                    logger: { message: stub() },
                    options: {
                        cucumber: cucumberOptions,
                        jira: { projectKey: projectKey },
                        xray: { uploadResults: uploadResults },
                    },
                }),
            new Error(errorMessage)
        );
        // Test validation.
        assert.deepStrictEqual(processFeatureFilesMock.mock.callCount(), 1);
        assert.deepStrictEqual(getIssueSnapshotsMock.mock.callCount(), 1);
        assert.deepStrictEqual(uploadFeatureFilesMock.mock.callCount(), 0);
        assert.deepStrictEqual(restoreIssueSnapshotsMock.mock.callCount(), 0);
    });

    void it("throws if the upload fails", async (context) => {
        // Test setup.
        const uploadResults = faker().datatype.boolean();
        const featureFileData = generateFakeFeatureFileData({ projectKey: projectKey });
        const firstIssueSnapshot = generateFakeIssueSnapshots({
            generateErrors: "zero",
            generateLabels: "zero-or-more",
            issueKeys: featureFileData.flatMap((data) => data.issueKeys),
        });
        const processedFeatureFiles = featureFileData.map((data) => {
            return { allIssueKeys: data.issueKeys, filePath: data.filePath };
        });
        const jiraClientMock: HasSearchEndpoint & HasEditIssueEndpoint = {
            editIssue: stub(),
            search: stub(),
        };
        const xrayClientMock: HasImportFeatureEndpoint = { importFeature: stub() };
        const processFeatureFilesMock = context.mock.method(
            featureFileProcessing,
            "processFeatureFiles",
            () => processedFeatureFiles
        );
        const getIssueSnapshotsMock = context.mock.method(
            jiraIssueSnapshots,
            "getIssueSnapshots",
            countingMock(Promise.resolve(firstIssueSnapshot))
        );
        const errorMessage = faker().word.adjective();
        const uploadFeatureFilesMock = context.mock.method(
            featureFileUpload,
            "uploadFeatureFiles",
            () => Promise.reject(new Error(errorMessage))
        );
        const restoreIssueSnapshotsMock = context.mock.method(
            jiraIssueSnapshots,
            "restoreIssueSnapshots",
            stub()
        );
        // Test execution.
        await assert.rejects(
            () =>
                pluginPhases.runFeatureFileUpload({
                    clients: { jira: jiraClientMock, xray: xrayClientMock },
                    context: { featureFilePaths: featureFileData.map((data) => data.filePath) },
                    isCloudEnvironment: displayCloudHelp,
                    logger: { message: stub() },
                    options: {
                        cucumber: cucumberOptions,
                        jira: { projectKey: projectKey },
                        xray: { uploadResults: uploadResults },
                    },
                }),
            new Error(errorMessage)
        );
        // Test validation.
        assert.deepStrictEqual(processFeatureFilesMock.mock.callCount(), 1);
        assert.deepStrictEqual(getIssueSnapshotsMock.mock.callCount(), 1);
        assert.deepStrictEqual(uploadFeatureFilesMock.mock.callCount(), 1);
        assert.deepStrictEqual(restoreIssueSnapshotsMock.mock.callCount(), 0);
    });

    void it("throws if the second snapshot fails", async (context) => {
        // Test setup.
        const uploadResults = faker().datatype.boolean();
        const featureFileData = generateFakeFeatureFileData({ projectKey: projectKey });
        const firstIssueSnapshot = generateFakeIssueSnapshots({
            generateErrors: "zero",
            generateLabels: "zero-or-more",
            issueKeys: featureFileData.flatMap((data) => data.issueKeys),
        });
        const processedFeatureFiles = featureFileData.map((data) => {
            return { allIssueKeys: data.issueKeys, filePath: data.filePath };
        });
        const jiraClientMock: HasSearchEndpoint & HasEditIssueEndpoint = {
            editIssue: stub(),
            search: stub(),
        };
        const xrayClientMock: HasImportFeatureEndpoint = { importFeature: stub() };
        const processFeatureFilesMock = context.mock.method(
            featureFileProcessing,
            "processFeatureFiles",
            () => processedFeatureFiles
        );
        const errorMessage = faker().word.adjective();
        const getIssueSnapshotsMock = context.mock.method(
            jiraIssueSnapshots,
            "getIssueSnapshots",
            countingMock(
                Promise.resolve(firstIssueSnapshot),
                Promise.reject(new Error(errorMessage))
            )
        );
        const uploadFeatureFilesMock = context.mock.method(
            featureFileUpload,
            "uploadFeatureFiles",
            () => Promise.resolve(featureFileData.flatMap((data) => data.issueKeys))
        );
        const restoreIssueSnapshotsMock = context.mock.method(
            jiraIssueSnapshots,
            "restoreIssueSnapshots",
            stub()
        );
        // Test execution.
        await assert.rejects(
            () =>
                pluginPhases.runFeatureFileUpload({
                    clients: { jira: jiraClientMock, xray: xrayClientMock },
                    context: { featureFilePaths: featureFileData.map((data) => data.filePath) },
                    isCloudEnvironment: displayCloudHelp,
                    logger: { message: stub() },
                    options: {
                        cucumber: cucumberOptions,
                        jira: { projectKey: projectKey },
                        xray: { uploadResults: uploadResults },
                    },
                }),
            new Error(errorMessage)
        );
        // Test validation.
        assert.deepStrictEqual(processFeatureFilesMock.mock.callCount(), 1);
        assert.deepStrictEqual(getIssueSnapshotsMock.mock.callCount(), 2);
        assert.deepStrictEqual(uploadFeatureFilesMock.mock.callCount(), 1);
        assert.deepStrictEqual(restoreIssueSnapshotsMock.mock.callCount(), 0);
    });

    void it("throws if the issue restoration fails", async (context) => {
        // Test setup.
        const uploadResults = faker().datatype.boolean();
        const featureFileData = generateFakeFeatureFileData({ projectKey: projectKey });
        const firstIssueSnapshot = generateFakeIssueSnapshots({
            generateErrors: "zero",
            generateLabels: "zero-or-more",
            issueKeys: featureFileData.flatMap((data) => data.issueKeys),
        });
        const secondIssueSnapshot = generateFakeIssueSnapshots({
            generateErrors: "zero",
            generateLabels: "zero-or-more",
            issueKeys: featureFileData.flatMap((data) => data.issueKeys),
        });
        const processedFeatureFiles = featureFileData.map((data) => {
            return { allIssueKeys: data.issueKeys, filePath: data.filePath };
        });
        const jiraClientMock: HasSearchEndpoint & HasEditIssueEndpoint = {
            editIssue: stub(),
            search: stub(),
        };
        const xrayClientMock: HasImportFeatureEndpoint = { importFeature: stub() };
        const processFeatureFilesMock = context.mock.method(
            featureFileProcessing,
            "processFeatureFiles",
            () => processedFeatureFiles
        );
        const getIssueSnapshotsMock = context.mock.method(
            jiraIssueSnapshots,
            "getIssueSnapshots",
            countingMock(Promise.resolve(firstIssueSnapshot), Promise.resolve(secondIssueSnapshot))
        );
        const uploadFeatureFilesMock = context.mock.method(
            featureFileUpload,
            "uploadFeatureFiles",
            () => Promise.resolve(featureFileData.flatMap((data) => data.issueKeys))
        );
        const errorMessage = faker().word.adjective();
        const restoreIssueSnapshotsMock = context.mock.method(
            jiraIssueSnapshots,
            "restoreIssueSnapshots",
            () => Promise.reject(new Error(errorMessage))
        );
        // Test execution.
        await assert.rejects(
            () =>
                pluginPhases.runFeatureFileUpload({
                    clients: { jira: jiraClientMock, xray: xrayClientMock },
                    context: { featureFilePaths: featureFileData.map((data) => data.filePath) },
                    isCloudEnvironment: displayCloudHelp,
                    logger: { message: stub() },
                    options: {
                        cucumber: cucumberOptions,
                        jira: { projectKey: projectKey },
                        xray: { uploadResults: uploadResults },
                    },
                }),
            new Error(errorMessage)
        );
        // Test validation.
        assert.deepStrictEqual(processFeatureFilesMock.mock.callCount(), 1);
        assert.deepStrictEqual(getIssueSnapshotsMock.mock.callCount(), 2);
        assert.deepStrictEqual(uploadFeatureFilesMock.mock.callCount(), 1);
        assert.deepStrictEqual(restoreIssueSnapshotsMock.mock.callCount(), 1);
    });
});

void describe(pluginPhases.runMultipartConversion.name, () => {
    const projectKey = generateFakeProjectKey();
    for (const [cypressResults, version] of [
        [generateFakeCypressRunResultV12({ projectKey: projectKey }), "<13"],
        [generateFakeCypressRunResultV13({ projectKey: projectKey }), "13"],
        [generateFakeCypressRunResultV14({ projectKey: projectKey }), ">=14"],
    ] as const) {
        void describe(`in cypress version ${version}`, () => {
            const options = {
                jira: {
                    fields: {
                        testEnvironments: faker().helpers.maybe(() => faker().string.uuid()),
                        testPlan: faker().helpers.maybe(() => faker().string.uuid()),
                    },
                    projectKey: projectKey,
                    testExecutionIssue: {
                        ...generateFakePluginIssueUpdate(),
                        testEnvironments: faker().helpers.maybe(() => [
                            faker().string.sample(),
                            ...faker().helpers.multiple(() => faker().string.sample(), {
                                count: { max: 3, min: 0 },
                            }),
                        ]),
                        testPlan: faker().helpers.maybe(() => generateFakeIssueKey()),
                    },
                },
            };
            const multipartInfo = generateFakeMultipartInfo({
                fields: options.jira.fields,
                projectKey: projectKey,
            });

            void describe("cloud", () => {
                void it("calls all submodules with the correct parameters", async (context) => {
                    // Test setup.
                    const convertMultipartInfoCloudMock = context.mock.method(
                        multipartInfoConversion,
                        "convertMultipartInfoCloud",
                        () => {
                            return { errorMessages: [], multipartInfo: multipartInfo };
                        }
                    );
                    const convertMultipartInfoServerMock = context.mock.method(
                        multipartInfoConversion,
                        "convertMultipartInfoServer",
                        stub()
                    );
                    // Test execution.
                    await pluginPhases.runMultipartConversion({
                        clients: { jira: { getFields: stub() } },
                        cypress: { results: cypressResults },
                        isCloudEnvironment: true,
                        logger: { message: stub() },
                        options: options,
                    });
                    // Test validation.
                    assert.deepStrictEqual(
                        convertMultipartInfoCloudMock.mock.calls.map((call) => call.arguments),
                        [
                            [
                                {
                                    cypress: {
                                        config: {
                                            browserName: cypressResults.browserName,
                                            browserVersion: cypressResults.browserVersion,
                                            cypressVersion: cypressResults.cypressVersion,
                                        },
                                    },
                                    options: {
                                        jira: {
                                            projectKey: options.jira.projectKey,
                                            testExecutionIssue: options.jira.testExecutionIssue,
                                        },
                                    },
                                },
                            ],
                        ]
                    );
                    assert.deepStrictEqual(convertMultipartInfoServerMock.mock.callCount(), 0);
                });

                void it("throws if the conversion fails", async (context) => {
                    // Test setup.
                    const errorMessage = faker().string.sample();
                    const convertMultipartInfoCloudMock = context.mock.method(
                        multipartInfoConversion,
                        "convertMultipartInfoCloud",
                        () => {
                            throw new Error(errorMessage);
                        }
                    );
                    const convertMultipartInfoServerMock = context.mock.method(
                        multipartInfoConversion,
                        "convertMultipartInfoServer",
                        stub()
                    );
                    // Test execution.
                    await assert.rejects(
                        () =>
                            pluginPhases.runMultipartConversion({
                                clients: { jira: { getFields: stub() } },
                                cypress: { results: cypressResults },
                                isCloudEnvironment: true,
                                logger: { message: stub() },
                                options: options,
                            }),
                        new Error(errorMessage)
                    );
                    // Test validation.
                    assert.deepStrictEqual(convertMultipartInfoCloudMock.mock.callCount(), 1);
                    assert.deepStrictEqual(convertMultipartInfoServerMock.mock.callCount(), 0);
                });

                void it("logs error messages", async (context) => {
                    // Test setup.
                    const errorMessages = faker().helpers.multiple(() => faker().book.title());
                    context.mock.method(
                        multipartInfoConversion,
                        "convertMultipartInfoCloud",
                        () => {
                            return {
                                errorMessages: errorMessages,
                                multipartInfo: multipartInfo,
                            };
                        }
                    );
                    context.mock.method(
                        multipartInfoConversion,
                        "convertMultipartInfoServer",
                        stub()
                    );
                    const messageMock = context.mock.fn<Logger["message"]>();
                    // Test execution.
                    await pluginPhases.runMultipartConversion({
                        clients: { jira: { getFields: stub() } },
                        cypress: { results: cypressResults },
                        isCloudEnvironment: true,
                        logger: { message: messageMock },
                        options: options,
                    });
                    // Test validation.
                    assert.deepStrictEqual(
                        messageMock.mock.calls.map((call) => call.arguments),
                        errorMessages.map((message) => ["warning", message])
                    );
                });
            });

            void describe("server", () => {
                void it("calls all submodules with the correct parameters", async (context) => {
                    // Test setup.
                    const convertMultipartInfoCloudMock = context.mock.method(
                        multipartInfoConversion,
                        "convertMultipartInfoCloud",
                        stub()
                    );
                    const convertMultipartInfoServerMock = context.mock.method(
                        multipartInfoConversion,
                        "convertMultipartInfoServer",
                        () => {
                            return { errorMessages: [], multipartInfo: multipartInfo };
                        }
                    );
                    const jiraClientMock: HasGetFieldsEndpoint = { getFields: stub() };
                    // Test execution.
                    await pluginPhases.runMultipartConversion({
                        clients: { jira: jiraClientMock },
                        cypress: { results: cypressResults },
                        isCloudEnvironment: false,
                        logger: { message: stub() },
                        options: options,
                    });
                    // Test validation.
                    assert.deepStrictEqual(
                        convertMultipartInfoServerMock.mock.calls.map((call) => call.arguments),
                        [
                            [
                                {
                                    client: jiraClientMock,
                                    cypress: {
                                        config: {
                                            browserName: cypressResults.browserName,
                                            browserVersion: cypressResults.browserVersion,
                                            cypressVersion: cypressResults.cypressVersion,
                                        },
                                    },
                                    options: {
                                        jira: {
                                            fields: {
                                                testEnvironments:
                                                    options.jira.fields.testEnvironments,
                                                testPlan: options.jira.fields.testPlan,
                                            },
                                            projectKey: options.jira.projectKey,
                                            testExecutionIssue: options.jira.testExecutionIssue,
                                        },
                                    },
                                },
                            ],
                        ]
                    );
                    assert.deepStrictEqual(convertMultipartInfoCloudMock.mock.callCount(), 0);
                });

                void it("throws if the conversion fails", async (context) => {
                    // Test setup.
                    const errorMessage = faker().string.sample();
                    const convertMultipartInfoCloudMock = context.mock.method(
                        multipartInfoConversion,
                        "convertMultipartInfoCloud",
                        stub()
                    );
                    const convertMultipartInfoServerMock = context.mock.method(
                        multipartInfoConversion,
                        "convertMultipartInfoServer",
                        () => {
                            throw new Error(errorMessage);
                        }
                    );
                    // Test execution.
                    await assert.rejects(
                        () =>
                            pluginPhases.runMultipartConversion({
                                clients: { jira: { getFields: stub() } },
                                cypress: { results: cypressResults },
                                isCloudEnvironment: false,
                                logger: { message: stub() },
                                options: options,
                            }),
                        new Error(errorMessage)
                    );
                    // Test validation.
                    assert.deepStrictEqual(convertMultipartInfoServerMock.mock.callCount(), 1);
                    assert.deepStrictEqual(convertMultipartInfoCloudMock.mock.callCount(), 0);
                });

                void it("logs error messages", async (context) => {
                    // Test setup.
                    const errorMessages = faker().helpers.multiple(() => faker().book.title());
                    context.mock.method(
                        multipartInfoConversion,
                        "convertMultipartInfoCloud",
                        stub()
                    );
                    context.mock.method(
                        multipartInfoConversion,
                        "convertMultipartInfoServer",
                        () => {
                            return {
                                errorMessages: errorMessages,
                                multipartInfo: multipartInfo,
                            };
                        }
                    );
                    const messageMock = context.mock.fn<Logger["message"]>();
                    // Test execution.
                    await pluginPhases.runMultipartConversion({
                        clients: { jira: { getFields: stub() } },
                        cypress: { results: cypressResults },
                        isCloudEnvironment: false,
                        logger: { message: messageMock },
                        options: options,
                    });
                    // Test validation.
                    assert.deepStrictEqual(
                        messageMock.mock.calls.map((call) => call.arguments),
                        errorMessages.map((message) => ["warning", message])
                    );
                });
            });
        });
    }
});

void describe(pluginPhases.runCypressUpload.name, () => {
    for (const [{ cypressResults, xrayJson }, version] of [
        [generateFakeXrayJsonV12(), "<13"],
        [generateFakeXrayJsonV13(), "13"],
        [generateFakeXrayJsonV14(), ">=14"],
    ] as const) {
        void describe(`in cypress version ${version}`, () => {
            void it("calls all submodules with the correct parameters", async (context) => {
                // Test setup.
                const projectKey = generateFakeProjectKey();
                const options = {
                    cucumber: { featureFileExtension: `.${faker().system.fileExt()}` },
                    jira: {
                        projectKey: projectKey,
                        testExecutionIssue: faker().helpers.maybe(() => {
                            return { key: faker().helpers.maybe(() => generateFakeIssueKey()) };
                        }),
                    },
                    plugin: {
                        normalizeScreenshotNames: faker().datatype.boolean(),
                        splitUpload: faker().datatype.boolean(),
                        uploadLastAttempt: faker().datatype.boolean(),
                    },
                    xray: { status: {}, uploadScreenshots: faker().datatype.boolean() },
                };
                const testExecutionIssueKey = generateFakeIssueKey({ projectKey: projectKey });
                const isCloudEnvironment = faker().datatype.boolean();
                const multipartInfo = generateFakeMultipartInfo({ projectKey: projectKey });
                const screenshots = generateFakeScreenshotDetails();
                const xrayClientMock: HasImportExecutionMultipartEndpoint &
                    (
                        | (HasGetTestRunEndpoint & HasAddEvidenceEndpoint)
                        | (HasGetTestRunResultsEndpoint & HasAddEvidenceToTestRunEndpoint)
                    ) = {
                    addEvidence: stub(),
                    getTestRun: stub(),
                    importExecutionMultipart: stub(),
                };
                const emitterMock = context.mock.fn() satisfies PluginEventEmitter["emit"];
                const getEvidenceMock: EvidenceCollection["getEvidence"] = context.mock.fn(stub());
                const getIterationParametersMock: IterationParameterCollection["getIterationParameters"] =
                    context.mock.fn(stub());
                const convertCypressResultsMock = context.mock.method(
                    cypressResultConversion,
                    "convertCypressResults",
                    () => xrayJson
                );
                const cypressResultUploadMock = context.mock.method(
                    cypressResultUpload,
                    "uploadCypressResults",
                    () => {
                        return { testExecutionIssueKey: testExecutionIssueKey };
                    }
                );
                const logger = { message: stub() };
                // Test execution.
                await pluginPhases.runCypressUpload({
                    clients: { xray: xrayClientMock },
                    context: {
                        emitter: { emit: emitterMock },
                        evidence: { getEvidence: getEvidenceMock },
                        iterationParameters: { getIterationParameters: getIterationParametersMock },
                        screenshots: screenshots,
                    },
                    cypress: { results: cypressResults },
                    isCloudEnvironment: isCloudEnvironment,
                    logger: logger,
                    multipartInfo: multipartInfo,
                    options: options,
                });
                // Test validation.
                assert.deepStrictEqual(
                    convertCypressResultsMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                context: {
                                    evidence: { getEvidence: getEvidenceMock },
                                    iterationParameters: {
                                        getIterationParameters: getIterationParametersMock,
                                    },
                                    screenshots: screenshots,
                                },
                                cypress: { results: cypressResults },
                                isCloudEnvironment: isCloudEnvironment,
                                logger: logger,
                                options: {
                                    cucumber: {
                                        featureFileExtension: options.cucumber.featureFileExtension,
                                    },
                                    jira: {
                                        projectKey: options.jira.projectKey,
                                        testExecutionIssueKey: options.jira.testExecutionIssue?.key,
                                    },
                                    plugin: {
                                        normalizeScreenshotNames:
                                            options.plugin.normalizeScreenshotNames,
                                        uploadLastAttempt: options.plugin.uploadLastAttempt,
                                    },
                                    xray: {
                                        uploadScreenshots: options.xray.uploadScreenshots,
                                        xrayStatus: options.xray.status,
                                    },
                                },
                            },
                        ],
                    ]
                );
                assert.deepStrictEqual(
                    cypressResultUploadMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                client: xrayClientMock,
                                logger: logger,
                                multipartInfo: multipartInfo,
                                options: { plugin: { splitUpload: options.plugin.splitUpload } },
                                xrayJson: xrayJson,
                            },
                        ],
                    ]
                );
                assert.deepStrictEqual(
                    emitterMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            "upload:cypress",
                            {
                                info: multipartInfo,
                                results: xrayJson,
                                testExecutionIssueKey: testExecutionIssueKey,
                            },
                        ],
                    ]
                );
            });

            void it("throws if the result conversion fails", async (context) => {
                // Test setup.
                const projectKey = generateFakeProjectKey();
                const options = {
                    cucumber: { featureFileExtension: `.${faker().system.fileExt()}` },
                    jira: {
                        projectKey: projectKey,
                        testExecutionIssue: faker().helpers.maybe(() => {
                            return { key: faker().helpers.maybe(() => generateFakeIssueKey()) };
                        }),
                    },
                    plugin: {
                        normalizeScreenshotNames: faker().datatype.boolean(),
                        splitUpload: faker().datatype.boolean(),
                        uploadLastAttempt: faker().datatype.boolean(),
                    },
                    xray: { status: {}, uploadScreenshots: faker().datatype.boolean() },
                };
                const isCloudEnvironment = faker().datatype.boolean();
                const multipartInfo = generateFakeMultipartInfo({ projectKey: projectKey });
                const screenshots = generateFakeScreenshotDetails();
                const errorMessage = faker().book.title();
                const xrayClientMock: HasImportExecutionMultipartEndpoint &
                    (
                        | (HasGetTestRunEndpoint & HasAddEvidenceEndpoint)
                        | (HasGetTestRunResultsEndpoint & HasAddEvidenceToTestRunEndpoint)
                    ) = {
                    addEvidence: stub(),
                    getTestRun: stub(),
                    importExecutionMultipart: stub(),
                };
                const emitterMock = context.mock.fn() satisfies PluginEventEmitter["emit"];
                const getEvidenceMock: EvidenceCollection["getEvidence"] = context.mock.fn(stub());
                const getIterationParametersMock: IterationParameterCollection["getIterationParameters"] =
                    context.mock.fn(stub());
                const convertCypressResultsMock = context.mock.method(
                    cypressResultConversion,
                    "convertCypressResults",
                    () => {
                        throw new Error(errorMessage);
                    }
                );
                const cypressResultUploadMock = context.mock.method(
                    cypressResultUpload,
                    "uploadCypressResults",
                    stub()
                );
                const logger = { message: stub() };
                // Test execution.
                await assert.rejects(
                    () =>
                        pluginPhases.runCypressUpload({
                            clients: { xray: xrayClientMock },
                            context: {
                                emitter: { emit: emitterMock },
                                evidence: { getEvidence: getEvidenceMock },
                                iterationParameters: {
                                    getIterationParameters: getIterationParametersMock,
                                },
                                screenshots: screenshots,
                            },
                            cypress: { results: cypressResults },
                            isCloudEnvironment: isCloudEnvironment,
                            logger: logger,
                            multipartInfo: multipartInfo,
                            options: options,
                        }),
                    new Error(errorMessage)
                );
                // Test validation.
                assert.deepStrictEqual(
                    convertCypressResultsMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                context: {
                                    evidence: { getEvidence: getEvidenceMock },
                                    iterationParameters: {
                                        getIterationParameters: getIterationParametersMock,
                                    },
                                    screenshots: screenshots,
                                },
                                cypress: { results: cypressResults },
                                isCloudEnvironment: isCloudEnvironment,
                                logger: logger,
                                options: {
                                    cucumber: {
                                        featureFileExtension: options.cucumber.featureFileExtension,
                                    },
                                    jira: {
                                        projectKey: options.jira.projectKey,
                                        testExecutionIssueKey: options.jira.testExecutionIssue?.key,
                                    },
                                    plugin: {
                                        normalizeScreenshotNames:
                                            options.plugin.normalizeScreenshotNames,
                                        uploadLastAttempt: options.plugin.uploadLastAttempt,
                                    },
                                    xray: {
                                        uploadScreenshots: options.xray.uploadScreenshots,
                                        xrayStatus: options.xray.status,
                                    },
                                },
                            },
                        ],
                    ]
                );
                assert.deepStrictEqual(convertCypressResultsMock.mock.callCount(), 1);
                assert.deepStrictEqual(cypressResultUploadMock.mock.callCount(), 0);
                assert.deepStrictEqual(emitterMock.mock.callCount(), 0);
            });

            void it("throws if the result upload fails", async (context) => {
                // Test setup.
                const projectKey = generateFakeProjectKey();
                const options = {
                    cucumber: { featureFileExtension: `.${faker().system.fileExt()}` },
                    jira: { projectKey: projectKey },
                    plugin: {
                        normalizeScreenshotNames: faker().datatype.boolean(),
                        splitUpload: faker().datatype.boolean(),
                        uploadLastAttempt: faker().datatype.boolean(),
                    },
                    xray: { status: {}, uploadScreenshots: faker().datatype.boolean() },
                };
                const isCloudEnvironment = faker().datatype.boolean();
                const multipartInfo = generateFakeMultipartInfo({ projectKey: projectKey });
                const screenshots = generateFakeScreenshotDetails();
                const errorMessage = faker().book.title();
                const xrayClientMock: HasImportExecutionMultipartEndpoint &
                    (
                        | (HasGetTestRunEndpoint & HasAddEvidenceEndpoint)
                        | (HasGetTestRunResultsEndpoint & HasAddEvidenceToTestRunEndpoint)
                    ) = {
                    addEvidence: stub(),
                    getTestRun: stub(),
                    importExecutionMultipart: stub(),
                };
                const emitterMock = context.mock.fn() satisfies PluginEventEmitter["emit"];
                const getEvidenceMock: EvidenceCollection["getEvidence"] = context.mock.fn(stub());
                const getIterationParametersMock: IterationParameterCollection["getIterationParameters"] =
                    context.mock.fn(stub());
                const convertCypressResultsMock = context.mock.method(
                    cypressResultConversion,
                    "convertCypressResults",
                    () => xrayJson
                );
                const cypressResultUploadMock = context.mock.method(
                    cypressResultUpload,
                    "uploadCypressResults",
                    () => Promise.reject(new Error(errorMessage))
                );
                const logger = { message: stub() };
                // Test execution.
                await assert.rejects(
                    () =>
                        pluginPhases.runCypressUpload({
                            clients: { xray: xrayClientMock },
                            context: {
                                emitter: { emit: emitterMock },
                                evidence: { getEvidence: getEvidenceMock },
                                iterationParameters: {
                                    getIterationParameters: getIterationParametersMock,
                                },
                                screenshots: screenshots,
                            },
                            cypress: { results: cypressResults },
                            isCloudEnvironment: isCloudEnvironment,
                            logger: logger,
                            multipartInfo: multipartInfo,
                            options: options,
                        }),
                    new Error(errorMessage)
                );
                // Test validation.
                assert.deepStrictEqual(convertCypressResultsMock.mock.callCount(), 1);
                assert.deepStrictEqual(cypressResultUploadMock.mock.callCount(), 1);
                assert.deepStrictEqual(emitterMock.mock.callCount(), 0);
            });
        });
    }
});

void describe(pluginPhases.runCucumberUpload.name, () => {
    void it("calls all submodules with the correct parameters", async (context) => {
        // Test setup.
        const projectKey = generateFakeProjectKey();
        const testExecutionIssueKey = generateFakeIssueKey({ projectKey: projectKey });
        const options = {
            cucumber: {
                prefixes: {
                    precondition: faker().helpers.maybe(() => faker().string.alpha()),
                    test: faker().helpers.maybe(() => faker().string.alpha()),
                },
                preprocessor: {
                    json: {
                        enabled: faker().datatype.boolean(),
                        output: faker().system.filePath(),
                    },
                },
            },
            jira: {
                projectKey: projectKey,
                testExecutionIssue: { key: testExecutionIssueKey },
            },
            xray: {
                status: {
                    step: {
                        failed: faker().color.human(),
                        passed: faker().color.human(),
                        pending: faker().color.human(),
                        skipped: faker().color.human(),
                    },
                },
                uploadScreenshots: faker().datatype.boolean(),
            },
        };
        const projectRoot = faker().system.directoryPath();
        const isCloudEnvironment = faker().datatype.boolean();
        const multipartInfo = generateFakeMultipartInfo({ projectKey: projectKey });
        const multipartFeatures = generateFakeCucumberMultipartFeatures();
        const xrayClientMock: HasImportExecutionCucumberMultipartEndpoint = {
            importExecutionCucumberMultipart: stub(),
        };
        const emitterMock = context.mock.fn() satisfies PluginEventEmitter["emit"];
        const readCucumberReportMock = context.mock.method(
            cucumberResultConversion,
            "readCucumberReport",
            () => multipartFeatures
        );
        const convertCucumberFeaturesMock = context.mock.method(
            cucumberResultConversion,
            "convertCucumberFeatures",
            () => multipartFeatures
        );
        const uploadCucumberResultsMock = context.mock.method(
            cucumberResultUpload,
            "uploadCucumberResults",
            () => {
                return { testExecutionIssueKey: testExecutionIssueKey };
            }
        );
        const logger = { message: stub() };
        // Test execution.
        const result = await pluginPhases.runCucumberUpload({
            clients: { xray: xrayClientMock },
            context: { emitter: { emit: emitterMock } },
            cypress: { config: { projectRoot: projectRoot } },
            isCloudEnvironment: isCloudEnvironment,
            logger: logger,
            multipartInfo: multipartInfo,
            options: options,
        });
        // Test validation.
        assert.deepStrictEqual(testExecutionIssueKey, result);
        assert.deepStrictEqual(
            readCucumberReportMock.mock.calls.map((call) => call.arguments),
            [
                [
                    {
                        cypress: { config: { projectRoot: projectRoot } },
                        options: {
                            cucumber: { reportPath: options.cucumber.preprocessor.json.output },
                        },
                    },
                ],
            ]
        );
        assert.deepStrictEqual(
            convertCucumberFeaturesMock.mock.calls.map((call) => call.arguments),
            [
                [
                    {
                        cucumberResults: multipartFeatures,
                        cypress: { config: { projectRoot: projectRoot } },
                        isCloudEnvironment: isCloudEnvironment,
                        logger: logger,
                        options: {
                            cucumber: { prefixes: { test: options.cucumber.prefixes.test } },
                            jira: {
                                projectKey: options.jira.projectKey,
                                testExecutionIssue: { key: options.jira.testExecutionIssue.key },
                            },
                            xray: {
                                status: {
                                    step: {
                                        failed: options.xray.status.step.failed,
                                        passed: options.xray.status.step.passed,
                                        pending: options.xray.status.step.pending,
                                        skipped: options.xray.status.step.skipped,
                                    },
                                },
                                uploadScreenshots: options.xray.uploadScreenshots,
                            },
                        },
                    },
                ],
            ]
        );
        assert.deepStrictEqual(
            uploadCucumberResultsMock.mock.calls.map((call) => call.arguments),
            [
                [
                    {
                        client: xrayClientMock,
                        cucumberJson: multipartFeatures,
                        multipartInfo: multipartInfo,
                    },
                ],
            ]
        );
        assert.deepStrictEqual(
            emitterMock.mock.calls.map((call) => call.arguments),
            [
                [
                    "upload:cucumber",
                    {
                        results: { features: multipartFeatures, info: multipartInfo },
                        testExecutionIssueKey: testExecutionIssueKey,
                    },
                ],
            ]
        );
    });

    void it("throws if the cucumber report reading fails", async (context) => {
        // Test setup.
        const projectKey = generateFakeProjectKey();
        const testExecutionIssueKey = generateFakeIssueKey({ projectKey: projectKey });
        const options = {
            cucumber: {
                prefixes: {
                    precondition: faker().helpers.maybe(() => faker().string.alpha()),
                    test: faker().helpers.maybe(() => faker().string.alpha()),
                },
                preprocessor: {
                    json: {
                        enabled: faker().datatype.boolean(),
                        output: faker().system.filePath(),
                    },
                },
            },
            jira: {
                projectKey: projectKey,
                testExecutionIssue: { key: testExecutionIssueKey },
            },
            xray: {
                status: {
                    step: {
                        failed: faker().color.human(),
                        passed: faker().color.human(),
                        pending: faker().color.human(),
                        skipped: faker().color.human(),
                    },
                },
                uploadScreenshots: faker().datatype.boolean(),
            },
        };
        const projectRoot = faker().system.directoryPath();
        const isCloudEnvironment = faker().datatype.boolean();
        const multipartInfo = generateFakeMultipartInfo({ projectKey: projectKey });
        const errorMessage = faker().commerce.productDescription();
        const xrayClientMock: HasImportExecutionCucumberMultipartEndpoint = {
            importExecutionCucumberMultipart: stub(),
        };
        const emitterMock = context.mock.fn() satisfies PluginEventEmitter["emit"];
        const readCucumberReportMock = context.mock.method(
            cucumberResultConversion,
            "readCucumberReport",
            () => Promise.reject(new Error(errorMessage))
        );
        const convertCucumberFeaturesMock = context.mock.method(
            cucumberResultConversion,
            "convertCucumberFeatures",
            stub()
        );
        const uploadCucumberResultsMock = context.mock.method(
            cucumberResultUpload,
            "uploadCucumberResults",
            stub()
        );
        const logger = { message: stub() };
        // Test execution.
        await assert.rejects(
            () =>
                pluginPhases.runCucumberUpload({
                    clients: { xray: xrayClientMock },
                    context: { emitter: { emit: emitterMock } },
                    cypress: { config: { projectRoot: projectRoot } },
                    isCloudEnvironment: isCloudEnvironment,
                    logger: logger,
                    multipartInfo: multipartInfo,
                    options: options,
                }),
            new Error(errorMessage)
        );
        // Test validation.
        assert.deepStrictEqual(readCucumberReportMock.mock.callCount(), 1);
        assert.deepStrictEqual(convertCucumberFeaturesMock.mock.callCount(), 0);
        assert.deepStrictEqual(uploadCucumberResultsMock.mock.callCount(), 0);
        assert.deepStrictEqual(emitterMock.mock.callCount(), 0);
    });

    void it("throws if the cucumber feature conversion fails", async (context) => {
        // Test setup.
        const projectKey = generateFakeProjectKey();
        const testExecutionIssueKey = generateFakeIssueKey({ projectKey: projectKey });
        const options = {
            cucumber: {
                prefixes: {
                    precondition: faker().helpers.maybe(() => faker().string.alpha()),
                    test: faker().helpers.maybe(() => faker().string.alpha()),
                },
                preprocessor: {
                    json: {
                        enabled: faker().datatype.boolean(),
                        output: faker().system.filePath(),
                    },
                },
            },
            jira: {
                projectKey: projectKey,
                testExecutionIssue: { key: testExecutionIssueKey },
            },
            xray: {
                status: {
                    step: {
                        failed: faker().color.human(),
                        passed: faker().color.human(),
                        pending: faker().color.human(),
                        skipped: faker().color.human(),
                    },
                },
                uploadScreenshots: faker().datatype.boolean(),
            },
        };
        const projectRoot = faker().system.directoryPath();
        const isCloudEnvironment = faker().datatype.boolean();
        const multipartInfo = generateFakeMultipartInfo({ projectKey: projectKey });
        const multipartFeatures = generateFakeCucumberMultipartFeatures();
        const errorMessage = faker().commerce.productDescription();
        const xrayClientMock: HasImportExecutionCucumberMultipartEndpoint = {
            importExecutionCucumberMultipart: stub(),
        };
        const emitterMock = context.mock.fn() satisfies PluginEventEmitter["emit"];
        const readCucumberReportMock = context.mock.method(
            cucumberResultConversion,
            "readCucumberReport",
            () => multipartFeatures
        );
        const convertCucumberFeaturesMock = context.mock.method(
            cucumberResultConversion,
            "convertCucumberFeatures",
            () => {
                throw new Error(errorMessage);
            }
        );
        const uploadCucumberResultsMock = context.mock.method(
            cucumberResultUpload,
            "uploadCucumberResults",
            () => {
                return { testExecutionIssueKey: testExecutionIssueKey };
            }
        );
        const logger = { message: stub() };
        // Test execution.
        await assert.rejects(
            () =>
                pluginPhases.runCucumberUpload({
                    clients: { xray: xrayClientMock },
                    context: { emitter: { emit: emitterMock } },
                    cypress: { config: { projectRoot: projectRoot } },
                    isCloudEnvironment: isCloudEnvironment,
                    logger: logger,
                    multipartInfo: multipartInfo,
                    options: options,
                }),
            new Error(errorMessage)
        );
        // Test validation.
        assert.deepStrictEqual(readCucumberReportMock.mock.callCount(), 1);
        assert.deepStrictEqual(convertCucumberFeaturesMock.mock.callCount(), 1);
        assert.deepStrictEqual(uploadCucumberResultsMock.mock.callCount(), 0);
        assert.deepStrictEqual(emitterMock.mock.callCount(), 0);
    });

    void it("throws if the cucumber result upload fails", async (context) => {
        // Test setup.
        const projectKey = generateFakeProjectKey();
        const testExecutionIssueKey = generateFakeIssueKey({ projectKey: projectKey });
        const options = {
            cucumber: {
                prefixes: {
                    precondition: faker().helpers.maybe(() => faker().string.alpha()),
                    test: faker().helpers.maybe(() => faker().string.alpha()),
                },
                preprocessor: {
                    json: {
                        enabled: faker().datatype.boolean(),
                        output: faker().system.filePath(),
                    },
                },
            },
            jira: {
                projectKey: projectKey,
                testExecutionIssue: { key: testExecutionIssueKey },
            },
            xray: {
                status: {
                    step: {
                        failed: faker().color.human(),
                        passed: faker().color.human(),
                        pending: faker().color.human(),
                        skipped: faker().color.human(),
                    },
                },
                uploadScreenshots: faker().datatype.boolean(),
            },
        };
        const projectRoot = faker().system.directoryPath();
        const isCloudEnvironment = faker().datatype.boolean();
        const multipartInfo = generateFakeMultipartInfo({ projectKey: projectKey });
        const multipartFeatures = generateFakeCucumberMultipartFeatures();
        const errorMessage = faker().commerce.productDescription();
        const xrayClientMock: HasImportExecutionCucumberMultipartEndpoint = {
            importExecutionCucumberMultipart: stub(),
        };
        const emitterMock = context.mock.fn() satisfies PluginEventEmitter["emit"];
        const readCucumberReportMock = context.mock.method(
            cucumberResultConversion,
            "readCucumberReport",
            () => multipartFeatures
        );
        const convertCucumberFeaturesMock = context.mock.method(
            cucumberResultConversion,
            "convertCucumberFeatures",
            () => multipartFeatures
        );
        const uploadCucumberResultsMock = context.mock.method(
            cucumberResultUpload,
            "uploadCucumberResults",
            () => Promise.reject(new Error(errorMessage))
        );
        const logger = { message: stub() };
        // Test execution.
        await assert.rejects(
            () =>
                pluginPhases.runCucumberUpload({
                    clients: { xray: xrayClientMock },
                    context: { emitter: { emit: emitterMock } },
                    cypress: { config: { projectRoot: projectRoot } },
                    isCloudEnvironment: isCloudEnvironment,
                    logger: logger,
                    multipartInfo: multipartInfo,
                    options: options,
                }),
            new Error(errorMessage)
        );
        // Test validation.
        assert.deepStrictEqual(readCucumberReportMock.mock.callCount(), 1);
        assert.deepStrictEqual(convertCucumberFeaturesMock.mock.callCount(), 1);
        assert.deepStrictEqual(uploadCucumberResultsMock.mock.callCount(), 1);
        assert.deepStrictEqual(emitterMock.mock.callCount(), 0);
    });
});
