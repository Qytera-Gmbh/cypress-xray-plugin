import assert from "node:assert";
import { describe, it } from "node:test";
import {
    faker,
    generateFakeCypressRunResultV12,
    generateFakeCypressRunResultV13,
    generateFakeCypressRunResultV14,
    generateFakeIssueKey,
    generateFakeMultipartInfo,
    generateFakePluginIssueUpdate,
    generateFakeProjectKey,
    generateFakeRunResultV12,
    generateFakeRunResultV13,
    generateFakeRunResultV14,
    generateFakeScreenshotDetails,
} from "../../test/faker";
import { stub } from "../../test/mocks";
import type { HasTransitionIssueEndpoint } from "../client/jira/jira-client";
import type { Logger } from "../util/logging";
import type { RuntimeParameters } from "./cypress-xray-plugin";
import cypressXrayPlugin from "./cypress-xray-plugin";
import pluginPhases from "./plugin-phases";
import uploadValidation from "./results-upload/upload-validation";
import videoUpload from "./results-upload/video-upload";

// | #     | Scenario Description                          | Key Parameter Values                                                                            |
// | ----- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
// | 1     | Upload disabled                               | `uploadResults=false`                                                                           |
// | 2     | No runs (empty results)                       | `runs=[]`, `uploadResults=true`                                                                 |
// | 3     | Mixed runs (Cucumber + Cypress)               | mixture of `.feature` and `.js` specs                                                           |
// | 4     | All runs are Cucumber tests                   | `featureFileExtension=".feature"`, all specs end with `.feature`                                |
// | 5     | All runs are Cypress tests                    | `featureFileExtension=".feature"`, none end with `.feature`                                     |
// | 6     | Successful upload + attach videos             | uploads return issue key, `attachVideos=true`                                                   |
// | 7     | Jira transition (server only)                 | `finalTestExecutionIssueKey` set, `transition` set, `key` undefined, `isCloudEnvironment=false` |
// | 8     | Jira transition skipped (cloud or key exists) | same as above but `isCloudEnvironment=true` or `key` defined                                    |
// | 9     | No transition without final execution key     | Ensures no video/transition actions happen                                                      |
// | 10    | Cypress upload throws error                   | Test error logging branch                                                                       |
// | 11    | Cucumber upload throws error                  | Test error logging branch                                                                       |

void describe(cypressXrayPlugin.runPlugin.name, () => {
    void describe("scenario: upload disabled", () => {
        const projectKey = generateFakeProjectKey();
        const contextOptions: RuntimeParameters["context"] = {
            emitter: { emit: stub() },
            evidence: { getEvidence: stub() },
            featureFilePaths: faker().helpers.multiple(() => faker().system.filePath()),
            iterationParameters: { getIterationParameters: stub() },
            screenshots: generateFakeScreenshotDetails(),
        };
        const options: RuntimeParameters["options"] = {
            cucumber: faker().helpers.maybe(() => {
                return {
                    featureFileExtension: faker().system.fileExt(),
                    prefixes: {
                        precondition: faker().helpers.maybe(() => faker().string.sample()),
                        test: faker().helpers.maybe(() => faker().string.sample()),
                    },
                    preprocessor: faker().helpers.maybe(() => {
                        return {
                            json: {
                                enabled: faker().datatype.boolean(),
                                output: faker().system.filePath(),
                            },
                        };
                    }),
                };
            }),
            jira: {
                attachVideos: faker().datatype.boolean(),
                fields: {
                    testEnvironments: faker().helpers.maybe(() => faker().string.uuid()),
                    testPlan: faker().helpers.maybe(() => faker().string.uuid()),
                },
                projectKey: projectKey,
                testExecutionIssue: faker().helpers.maybe(() => generateFakePluginIssueUpdate()),
                url: faker().internet.url(),
            },
            plugin: {
                normalizeScreenshotNames: faker().datatype.boolean(),
                splitUpload: faker().helpers.arrayElement([true, false, "sequential"]),
                uploadLastAttempt: faker().datatype.boolean(),
            },
            xray: {
                status: {
                    aggregate: stub(),
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
                },
                uploadResults: false,
                uploadScreenshots: faker().datatype.boolean(),
            },
        };

        for (const { results, version } of [
            {
                results: generateFakeCypressRunResultV12({ projectKey: projectKey }),
                version: "<13",
            },
            {
                results: generateFakeCypressRunResultV13({ projectKey: projectKey }),
                version: "13",
            },
            {
                results: generateFakeCypressRunResultV14({ projectKey: projectKey }),
                version: ">=14",
            },
        ]) {
            void it(version, async (context) => {
                // Test setup.
                const runFeatureFileUploadMock = context.mock.method(
                    pluginPhases,
                    "runFeatureFileUpload",
                    () =>
                        faker().helpers.maybe(() =>
                            generateFakeIssueKey({ projectKey: projectKey })
                        )
                );
                const runMultipartConversionMock = context.mock.method(
                    pluginPhases,
                    "runMultipartConversion",
                    stub()
                );
                const runCypressUploadMock = context.mock.method(
                    pluginPhases,
                    "runCypressUpload",
                    stub()
                );
                const runCucumberUploadMock = context.mock.method(
                    pluginPhases,
                    "runCucumberUpload",
                    stub()
                );
                const validateUploadsMock = context.mock.method(
                    uploadValidation,
                    "validateUploads",
                    stub()
                );
                const uploadVideosMock = context.mock.method(videoUpload, "uploadVideos", stub());
                const messageMock = context.mock.fn<Logger["message"]>();
                const parameters: RuntimeParameters = {
                    clients: {
                        jira: {
                            addAttachment: stub(),
                            editIssue: stub(),
                            getFields: stub(),
                            search: stub(),
                            transitionIssue: stub(),
                        },
                        xray: {
                            addEvidence: stub(),
                            addEvidenceToTestRun: stub(),
                            getTestRun: stub(),
                            getTestRunResults: stub(),
                            importExecutionCucumberMultipart: stub(),
                            importExecutionMultipart: stub(),
                            importFeature: stub(),
                        },
                    },
                    context: contextOptions,
                    cypress: {
                        config: { projectRoot: faker().system.directoryPath() },
                        results: results,
                    },
                    isCloudEnvironment: faker().datatype.boolean(),
                    logger: { message: messageMock },
                    options: options,
                };
                // Test execution.
                await cypressXrayPlugin.runPlugin(parameters);

                // Test validation.
                assert.deepStrictEqual(
                    messageMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            "info",
                            "Skipping results upload: Plugin is configured to not upload test results.",
                        ],
                    ]
                );
                assert.deepStrictEqual(
                    runFeatureFileUploadMock.mock.calls.map((call) => call.arguments),
                    [[parameters]]
                );
                assert.deepStrictEqual(
                    runMultipartConversionMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    runCypressUploadMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    runCucumberUploadMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    validateUploadsMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    uploadVideosMock.mock.calls.map((call) => call.arguments),
                    []
                );
            });
        }
    });

    void describe("scenario: no runs (empty results)", () => {
        const projectKey = generateFakeProjectKey();
        const contextOptions: RuntimeParameters["context"] = {
            emitter: { emit: stub() },
            evidence: { getEvidence: stub() },
            featureFilePaths: faker().helpers.multiple(() => faker().system.filePath()),
            iterationParameters: { getIterationParameters: stub() },
            screenshots: generateFakeScreenshotDetails(),
        };
        const options: RuntimeParameters["options"] = {
            cucumber: faker().helpers.maybe(() => {
                return {
                    featureFileExtension: faker().system.fileExt(),
                    prefixes: {
                        precondition: faker().helpers.maybe(() => faker().string.sample()),
                        test: faker().helpers.maybe(() => faker().string.sample()),
                    },
                    preprocessor: faker().helpers.maybe(() => {
                        return {
                            json: {
                                enabled: faker().datatype.boolean(),
                                output: faker().system.filePath(),
                            },
                        };
                    }),
                };
            }),
            jira: {
                attachVideos: faker().datatype.boolean(),
                fields: {
                    testEnvironments: faker().helpers.maybe(() => faker().string.uuid()),
                    testPlan: faker().helpers.maybe(() => faker().string.uuid()),
                },
                projectKey: projectKey,
                testExecutionIssue: faker().helpers.maybe(() => generateFakePluginIssueUpdate()),
                url: faker().internet.url(),
            },
            plugin: {
                normalizeScreenshotNames: faker().datatype.boolean(),
                splitUpload: faker().helpers.arrayElement([true, false, "sequential"]),
                uploadLastAttempt: faker().datatype.boolean(),
            },
            xray: {
                status: {
                    aggregate: stub(),
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
                },
                uploadResults: true,
                uploadScreenshots: faker().datatype.boolean(),
            },
        };

        for (const { results, version } of [
            {
                results: generateFakeCypressRunResultV12({
                    projectKey: projectKey,
                    runs: { max: 0, min: 0 },
                }),
                version: "<13",
            },
            {
                results: generateFakeCypressRunResultV13({
                    projectKey: projectKey,
                    runs: { max: 0, min: 0 },
                }),
                version: "13",
            },
            {
                results: generateFakeCypressRunResultV14({
                    projectKey: projectKey,
                    runs: { max: 0, min: 0 },
                }),
                version: ">=14",
            },
        ]) {
            void it(version, async (context) => {
                // Test setup.
                const runFeatureFileUploadMock = context.mock.method(
                    pluginPhases,
                    "runFeatureFileUpload",
                    () =>
                        faker().helpers.maybe(() =>
                            generateFakeIssueKey({ projectKey: projectKey })
                        )
                );
                const runMultipartConversionMock = context.mock.method(
                    pluginPhases,
                    "runMultipartConversion",
                    stub()
                );
                const runCypressUploadMock = context.mock.method(
                    pluginPhases,
                    "runCypressUpload",
                    stub()
                );
                const runCucumberUploadMock = context.mock.method(
                    pluginPhases,
                    "runCucumberUpload",
                    stub()
                );
                const validateUploadsMock = context.mock.method(
                    uploadValidation,
                    "validateUploads",
                    stub()
                );
                const uploadVideosMock = context.mock.method(videoUpload, "uploadVideos", stub());
                const messageMock = context.mock.fn<Logger["message"]>();
                const parameters: RuntimeParameters = {
                    clients: {
                        jira: {
                            addAttachment: stub(),
                            editIssue: stub(),
                            getFields: stub(),
                            search: stub(),
                            transitionIssue: stub(),
                        },
                        xray: {
                            addEvidence: stub(),
                            addEvidenceToTestRun: stub(),
                            getTestRun: stub(),
                            getTestRunResults: stub(),
                            importExecutionCucumberMultipart: stub(),
                            importExecutionMultipart: stub(),
                            importFeature: stub(),
                        },
                    },
                    context: contextOptions,
                    cypress: {
                        config: { projectRoot: faker().system.directoryPath() },
                        results: results,
                    },
                    isCloudEnvironment: faker().datatype.boolean(),
                    logger: { message: messageMock },
                    options: options,
                };
                // Test execution.
                await cypressXrayPlugin.runPlugin(parameters);

                // Test validation.
                assert.deepStrictEqual(
                    messageMock.mock.calls.map((call) => call.arguments),
                    [["warning", "No test execution results to upload, skipping results upload."]]
                );
                assert.deepStrictEqual(
                    runFeatureFileUploadMock.mock.calls.map((call) => call.arguments),
                    [[parameters]]
                );
                assert.deepStrictEqual(
                    runMultipartConversionMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    runCypressUploadMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    runCucumberUploadMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    validateUploadsMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    uploadVideosMock.mock.calls.map((call) => call.arguments),
                    []
                );
            });
        }
    });

    void describe("scenario: mixed cypress and cucumber tests", () => {
        const projectKey = generateFakeProjectKey();
        const [featureFileExtension, cypressSpecExtension] = [".feature", ".cy.js"];
        const testExecutionIssue = faker().helpers.maybe(() => generateFakePluginIssueUpdate());
        const contextOptions: RuntimeParameters["context"] = {
            emitter: { emit: stub() },
            evidence: { getEvidence: stub() },
            featureFilePaths: faker().helpers.multiple(() => faker().system.filePath()),
            iterationParameters: { getIterationParameters: stub() },
            screenshots: generateFakeScreenshotDetails(),
        };
        const options: RuntimeParameters["options"] = {
            cucumber: {
                featureFileExtension: featureFileExtension,
                prefixes: {
                    precondition: faker().helpers.maybe(() => faker().string.sample()),
                    test: faker().helpers.maybe(() => faker().string.sample()),
                },
                preprocessor: faker().helpers.maybe(() => {
                    return {
                        json: {
                            enabled: faker().datatype.boolean(),
                            output: faker().system.filePath(),
                        },
                    };
                }),
            },
            jira: {
                attachVideos: false,
                fields: {
                    testEnvironments: faker().helpers.maybe(() => faker().string.uuid()),
                    testPlan: faker().helpers.maybe(() => faker().string.uuid()),
                },
                projectKey: projectKey,
                testExecutionIssue: testExecutionIssue,
                url: faker().internet.url(),
            },
            plugin: {
                normalizeScreenshotNames: faker().datatype.boolean(),
                splitUpload: faker().helpers.arrayElement([true, false, "sequential"]),
                uploadLastAttempt: faker().datatype.boolean(),
            },
            xray: {
                status: {
                    aggregate: stub(),
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
                },
                uploadResults: true,
                uploadScreenshots: faker().datatype.boolean(),
            },
        };
        const multipartInfo = generateFakeMultipartInfo({
            fields: options.jira.fields,
            projectKey: projectKey,
        });
        const cypressExecutionIssueKey = faker().helpers.arrayElement([
            generateFakeIssueKey({ projectKey: projectKey }),
            testExecutionIssue?.fields?.summary,
        ]);
        const cucumberExecutionIssueKey = faker().helpers.arrayElement([
            generateFakeIssueKey({ projectKey: projectKey }),
            testExecutionIssue?.fields?.summary,
        ]);
        for (const { results, version } of [
            {
                results: generateFakeCypressRunResultV12({
                    projectKey: projectKey,
                    runs: faker().helpers.shuffle([
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV12({
                                projectKey: projectKey,
                                specExtensions: [cypressSpecExtension],
                            })
                        ),
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV12({
                                projectKey: projectKey,
                                specExtensions: [featureFileExtension],
                            })
                        ),
                    ]),
                }),
                version: "<13",
            },
            {
                results: generateFakeCypressRunResultV13({
                    projectKey: projectKey,
                    runs: faker().helpers.shuffle([
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV13({
                                projectKey: projectKey,
                                specExtensions: [cypressSpecExtension],
                            })
                        ),
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV13({
                                projectKey: projectKey,
                                specExtensions: [featureFileExtension],
                            })
                        ),
                    ]),
                }),
                version: "13",
            },
            {
                results: generateFakeCypressRunResultV14({
                    projectKey: projectKey,
                    runs: faker().helpers.shuffle([
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV14({
                                projectKey: projectKey,
                                specExtensions: [cypressSpecExtension],
                            })
                        ),
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV14({
                                projectKey: projectKey,
                                specExtensions: [featureFileExtension],
                            })
                        ),
                    ]),
                }),
                version: ">=14",
            },
        ]) {
            void it(version, async (context) => {
                // Test setup.
                const runFeatureFileUploadMock = context.mock.method(
                    pluginPhases,
                    "runFeatureFileUpload",
                    () => testExecutionIssue?.fields?.summary
                );
                const runMultipartConversionMock = context.mock.method(
                    pluginPhases,
                    "runMultipartConversion",
                    () => multipartInfo
                );
                const runCypressUploadMock = context.mock.method(
                    pluginPhases,
                    "runCypressUpload",
                    () => cypressExecutionIssueKey
                );
                const runCucumberUploadMock = context.mock.method(
                    pluginPhases,
                    "runCucumberUpload",
                    () => cucumberExecutionIssueKey
                );
                const validateUploadsMock = context.mock.method(
                    uploadValidation,
                    "validateUploads",
                    () => testExecutionIssue?.key
                );
                const uploadVideosMock = context.mock.method(videoUpload, "uploadVideos", stub());
                const messageMock = context.mock.fn<Logger["message"]>();
                const parameters: RuntimeParameters = {
                    clients: {
                        jira: {
                            addAttachment: stub(),
                            editIssue: stub(),
                            getFields: stub(),
                            search: stub(),
                            transitionIssue: stub(),
                        },
                        xray: {
                            addEvidence: stub(),
                            addEvidenceToTestRun: stub(),
                            getTestRun: stub(),
                            getTestRunResults: stub(),
                            importExecutionCucumberMultipart: stub(),
                            importExecutionMultipart: stub(),
                            importFeature: stub(),
                        },
                    },
                    context: contextOptions,
                    cypress: {
                        config: { projectRoot: faker().system.directoryPath() },
                        results: results,
                    },
                    isCloudEnvironment: faker().datatype.boolean(),
                    logger: { message: messageMock },
                    options: options,
                };
                // Test execution.
                await cypressXrayPlugin.runPlugin(parameters);

                // Test validation.
                assert.deepStrictEqual(
                    messageMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    runFeatureFileUploadMock.mock.calls.map((call) => call.arguments),
                    [[parameters]]
                );
                assert.deepStrictEqual(
                    runMultipartConversionMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                ...parameters,
                                cypress: { results: parameters.cypress.results },
                                options: {
                                    jira: {
                                        ...parameters.options.jira,
                                        testExecutionIssue: {
                                            ...parameters.options.jira.testExecutionIssue,
                                            fields: {
                                                ...parameters.options.jira.testExecutionIssue
                                                    ?.fields,
                                                summary:
                                                    testExecutionIssue?.fields?.summary ??
                                                    `Execution Results [${parameters.cypress.results.startedTestsAt}]`,
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                    ]
                );
                assert.deepStrictEqual(
                    runCypressUploadMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                ...parameters,
                                cypress: { results: parameters.cypress.results },
                                multipartInfo: multipartInfo,
                            },
                        ],
                    ]
                );
                assert.deepStrictEqual(
                    runCucumberUploadMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                ...parameters,
                                multipartInfo: multipartInfo,
                                options: {
                                    ...parameters.options,
                                    jira: {
                                        ...parameters.options.jira,
                                        testExecutionIssue: {
                                            ...parameters.options.jira.testExecutionIssue,
                                            key:
                                                cypressExecutionIssueKey ??
                                                parameters.options.jira.testExecutionIssue?.key,
                                        },
                                    },
                                },
                            },
                        ],
                    ]
                );
                assert.deepStrictEqual(
                    validateUploadsMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                cucumberExecutionIssueKey: cucumberExecutionIssueKey,
                                cypressExecutionIssueKey: cypressExecutionIssueKey,
                                logger: parameters.logger,
                                url: parameters.options.jira.url,
                            },
                        ],
                    ]
                );
                assert.deepStrictEqual(
                    uploadVideosMock.mock.calls.map((call) => call.arguments),
                    []
                );
            });
        }
    });

    void describe("scenario: all runs are cucumber tests", () => {
        const projectKey = generateFakeProjectKey();
        const featureFileExtension = faker().system.fileExt();
        const testExecutionIssue = faker().helpers.maybe(() => generateFakePluginIssueUpdate());
        const contextOptions: RuntimeParameters["context"] = {
            emitter: { emit: stub() },
            evidence: { getEvidence: stub() },
            featureFilePaths: faker().helpers.multiple(() => faker().system.filePath()),
            iterationParameters: { getIterationParameters: stub() },
            screenshots: generateFakeScreenshotDetails(),
        };
        const options: RuntimeParameters["options"] = {
            cucumber: {
                featureFileExtension: featureFileExtension,
                prefixes: {
                    precondition: faker().helpers.maybe(() => faker().string.sample()),
                    test: faker().helpers.maybe(() => faker().string.sample()),
                },
                preprocessor: faker().helpers.maybe(() => {
                    return {
                        json: {
                            enabled: faker().datatype.boolean(),
                            output: faker().system.filePath(),
                        },
                    };
                }),
            },
            jira: {
                attachVideos: false,
                fields: {
                    testEnvironments: faker().helpers.maybe(() => faker().string.uuid()),
                    testPlan: faker().helpers.maybe(() => faker().string.uuid()),
                },
                projectKey: projectKey,
                testExecutionIssue: testExecutionIssue,
                url: faker().internet.url(),
            },
            plugin: {
                normalizeScreenshotNames: faker().datatype.boolean(),
                splitUpload: faker().helpers.arrayElement([true, false, "sequential"]),
                uploadLastAttempt: faker().datatype.boolean(),
            },
            xray: {
                status: {
                    aggregate: stub(),
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
                },
                uploadResults: true,
                uploadScreenshots: faker().datatype.boolean(),
            },
        };
        const multipartInfo = generateFakeMultipartInfo({
            fields: options.jira.fields,
            projectKey: projectKey,
        });

        for (const { results, version } of [
            {
                results: generateFakeCypressRunResultV12({
                    projectKey: projectKey,
                    runs: { specExtensions: [featureFileExtension] },
                }),
                version: "<13",
            },
            {
                results: generateFakeCypressRunResultV13({
                    projectKey: projectKey,
                    runs: { specExtensions: [featureFileExtension] },
                }),
                version: "13",
            },
            {
                results: generateFakeCypressRunResultV14({
                    projectKey: projectKey,
                    runs: { specExtensions: [featureFileExtension] },
                }),
                version: ">=14",
            },
        ]) {
            void it(version, async (context) => {
                // Test setup.
                context.mock.method(
                    pluginPhases,
                    "runFeatureFileUpload",
                    () => testExecutionIssue?.fields?.summary
                );
                context.mock.method(pluginPhases, "runMultipartConversion", () => multipartInfo);
                const runCypressUploadMock = context.mock.method(
                    pluginPhases,
                    "runCypressUpload",
                    stub()
                );
                const runCucumberUploadMock = context.mock.method(
                    pluginPhases,
                    "runCucumberUpload",
                    () => testExecutionIssue?.key
                );
                const validateUploadsMock = context.mock.method(
                    uploadValidation,
                    "validateUploads",
                    () => testExecutionIssue?.key
                );
                context.mock.method(videoUpload, "uploadVideos", stub());
                const messageMock = context.mock.fn<Logger["message"]>();
                const parameters: RuntimeParameters = {
                    clients: {
                        jira: {
                            addAttachment: stub(),
                            editIssue: stub(),
                            getFields: stub(),
                            search: stub(),
                            transitionIssue: stub(),
                        },
                        xray: {
                            addEvidence: stub(),
                            addEvidenceToTestRun: stub(),
                            getTestRun: stub(),
                            getTestRunResults: stub(),
                            importExecutionCucumberMultipart: stub(),
                            importExecutionMultipart: stub(),
                            importFeature: stub(),
                        },
                    },
                    context: contextOptions,
                    cypress: {
                        config: { projectRoot: faker().system.directoryPath() },
                        results: results,
                    },
                    isCloudEnvironment: faker().datatype.boolean(),
                    logger: { message: messageMock },
                    options: options,
                };
                // Test execution.
                await cypressXrayPlugin.runPlugin(parameters);

                // Test validation.
                assert.deepStrictEqual(
                    messageMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    runCypressUploadMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    runCucumberUploadMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                ...parameters,
                                multipartInfo: multipartInfo,
                                options: {
                                    ...parameters.options,
                                    jira: {
                                        ...parameters.options.jira,
                                        testExecutionIssue: {
                                            ...parameters.options.jira.testExecutionIssue,
                                            key: parameters.options.jira.testExecutionIssue?.key,
                                        },
                                    },
                                },
                            },
                        ],
                    ]
                );
                assert.deepStrictEqual(
                    validateUploadsMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                cucumberExecutionIssueKey: testExecutionIssue?.key,
                                cypressExecutionIssueKey: undefined,
                                logger: parameters.logger,
                                url: parameters.options.jira.url,
                            },
                        ],
                    ]
                );
            });
        }
    });

    void describe("scenario: all runs are cypress tests", () => {
        const projectKey = generateFakeProjectKey();
        const [featureFileExtension, cypressSpecExtension] = [".feature", ".cy.js"];
        const testExecutionIssue = faker().helpers.maybe(() => generateFakePluginIssueUpdate());
        const contextOptions: RuntimeParameters["context"] = {
            emitter: { emit: stub() },
            evidence: { getEvidence: stub() },
            featureFilePaths: faker().helpers.multiple(() => faker().system.filePath()),
            iterationParameters: { getIterationParameters: stub() },
            screenshots: generateFakeScreenshotDetails(),
        };
        const options: RuntimeParameters["options"] = {
            cucumber: {
                featureFileExtension: featureFileExtension,
                prefixes: {
                    precondition: faker().helpers.maybe(() => faker().string.sample()),
                    test: faker().helpers.maybe(() => faker().string.sample()),
                },
                preprocessor: faker().helpers.maybe(() => {
                    return {
                        json: {
                            enabled: faker().datatype.boolean(),
                            output: faker().system.filePath(),
                        },
                    };
                }),
            },
            jira: {
                attachVideos: false,
                fields: {
                    testEnvironments: faker().helpers.maybe(() => faker().string.uuid()),
                    testPlan: faker().helpers.maybe(() => faker().string.uuid()),
                },
                projectKey: projectKey,
                testExecutionIssue: testExecutionIssue,
                url: faker().internet.url(),
            },
            plugin: {
                normalizeScreenshotNames: faker().datatype.boolean(),
                splitUpload: faker().helpers.arrayElement([true, false, "sequential"]),
                uploadLastAttempt: faker().datatype.boolean(),
            },
            xray: {
                status: {
                    aggregate: stub(),
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
                },
                uploadResults: true,
                uploadScreenshots: faker().datatype.boolean(),
            },
        };
        const multipartInfo = generateFakeMultipartInfo({
            fields: options.jira.fields,
            projectKey: projectKey,
        });

        for (const { results, version } of [
            {
                results: generateFakeCypressRunResultV12({
                    projectKey: projectKey,
                    runs: { specExtensions: [cypressSpecExtension] },
                }),
                version: "<13",
            },
            {
                results: generateFakeCypressRunResultV13({
                    projectKey: projectKey,
                    runs: { specExtensions: [cypressSpecExtension] },
                }),
                version: "13",
            },
            {
                results: generateFakeCypressRunResultV14({
                    projectKey: projectKey,
                    runs: { specExtensions: [cypressSpecExtension] },
                }),
                version: ">=14",
            },
        ]) {
            void it(version, async (context) => {
                // Test setup.
                context.mock.method(
                    pluginPhases,
                    "runFeatureFileUpload",
                    () => testExecutionIssue?.fields?.summary
                );
                context.mock.method(pluginPhases, "runMultipartConversion", () => multipartInfo);
                const runCypressUploadMock = context.mock.method(
                    pluginPhases,
                    "runCypressUpload",
                    () => testExecutionIssue?.key
                );
                const runCucumberUploadMock = context.mock.method(
                    pluginPhases,
                    "runCucumberUpload",
                    stub()
                );
                const validateUploadsMock = context.mock.method(
                    uploadValidation,
                    "validateUploads",
                    () => testExecutionIssue?.key
                );
                context.mock.method(videoUpload, "uploadVideos", stub());
                const messageMock = context.mock.fn<Logger["message"]>();
                const parameters: RuntimeParameters = {
                    clients: {
                        jira: {
                            addAttachment: stub(),
                            editIssue: stub(),
                            getFields: stub(),
                            search: stub(),
                            transitionIssue: stub(),
                        },
                        xray: {
                            addEvidence: stub(),
                            addEvidenceToTestRun: stub(),
                            getTestRun: stub(),
                            getTestRunResults: stub(),
                            importExecutionCucumberMultipart: stub(),
                            importExecutionMultipart: stub(),
                            importFeature: stub(),
                        },
                    },
                    context: contextOptions,
                    cypress: {
                        config: { projectRoot: faker().system.directoryPath() },
                        results: results,
                    },
                    isCloudEnvironment: faker().datatype.boolean(),
                    logger: { message: messageMock },
                    options: options,
                };
                // Test execution.
                await cypressXrayPlugin.runPlugin(parameters);

                // Test validation.
                assert.deepStrictEqual(
                    messageMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    runCypressUploadMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                ...parameters,
                                cypress: { results: parameters.cypress.results },
                                multipartInfo: multipartInfo,
                            },
                        ],
                    ]
                );
                assert.deepStrictEqual(
                    runCucumberUploadMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    validateUploadsMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                cucumberExecutionIssueKey: undefined,
                                cypressExecutionIssueKey: testExecutionIssue?.key,
                                logger: parameters.logger,
                                url: parameters.options.jira.url,
                            },
                        ],
                    ]
                );
            });
        }
    });

    void describe("scenario: successful upload with video attachments", () => {
        const projectKey = generateFakeProjectKey();
        const testExecutionIssue = faker().helpers.maybe(() => generateFakePluginIssueUpdate());
        const contextOptions: RuntimeParameters["context"] = {
            emitter: { emit: stub() },
            evidence: { getEvidence: stub() },
            featureFilePaths: faker().helpers.multiple(() => faker().system.filePath()),
            iterationParameters: { getIterationParameters: stub() },
            screenshots: generateFakeScreenshotDetails(),
        };
        const finalTestExecutionIssueKey =
            testExecutionIssue?.key ?? generateFakeIssueKey({ projectKey: projectKey });
        const options: RuntimeParameters["options"] = {
            cucumber: faker().helpers.maybe(() => {
                return {
                    featureFileExtension: faker().system.fileExt(),
                    prefixes: {
                        precondition: faker().helpers.maybe(() => faker().string.sample()),
                        test: faker().helpers.maybe(() => faker().string.sample()),
                    },
                    preprocessor: faker().helpers.maybe(() => {
                        return {
                            json: {
                                enabled: faker().datatype.boolean(),
                                output: faker().system.filePath(),
                            },
                        };
                    }),
                };
            }),
            jira: {
                attachVideos: true,
                fields: {
                    testEnvironments: faker().helpers.maybe(() => faker().string.uuid()),
                    testPlan: faker().helpers.maybe(() => faker().string.uuid()),
                },
                projectKey: projectKey,
                testExecutionIssue: testExecutionIssue,
                url: faker().internet.url(),
            },
            plugin: {
                normalizeScreenshotNames: faker().datatype.boolean(),
                splitUpload: faker().helpers.arrayElement([true, false, "sequential"]),
                uploadLastAttempt: faker().datatype.boolean(),
            },
            xray: {
                status: {
                    aggregate: stub(),
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
                },
                uploadResults: true,
                uploadScreenshots: faker().datatype.boolean(),
            },
        };
        const multipartInfo = generateFakeMultipartInfo({
            fields: options.jira.fields,
            projectKey: projectKey,
        });

        for (const { results, version } of [
            {
                results: generateFakeCypressRunResultV12({ projectKey: projectKey }),
                version: "<13",
            },
            {
                results: generateFakeCypressRunResultV13({ projectKey: projectKey }),
                version: "13",
            },
            {
                results: generateFakeCypressRunResultV14({ projectKey: projectKey }),
                version: ">=14",
            },
        ]) {
            void it(version, async (context) => {
                // Test setup.
                context.mock.method(
                    pluginPhases,
                    "runFeatureFileUpload",
                    () => testExecutionIssue?.fields?.summary
                );
                context.mock.method(pluginPhases, "runMultipartConversion", () => multipartInfo);
                context.mock.method(
                    pluginPhases,
                    "runCypressUpload",
                    () => finalTestExecutionIssueKey
                );
                context.mock.method(
                    pluginPhases,
                    "runCucumberUpload",
                    () => finalTestExecutionIssueKey
                );
                context.mock.method(
                    uploadValidation,
                    "validateUploads",
                    () => finalTestExecutionIssueKey
                );
                const uploadVideosMock = context.mock.method(
                    videoUpload,
                    "uploadVideos",
                    context.mock.fn()
                );
                const messageMock = context.mock.fn<Logger["message"]>();
                const parameters: RuntimeParameters = {
                    clients: {
                        jira: {
                            addAttachment: stub(),
                            editIssue: stub(),
                            getFields: stub(),
                            search: stub(),
                            transitionIssue: stub(),
                        },
                        xray: {
                            addEvidence: stub(),
                            addEvidenceToTestRun: stub(),
                            getTestRun: stub(),
                            getTestRunResults: stub(),
                            importExecutionCucumberMultipart: stub(),
                            importExecutionMultipart: stub(),
                            importFeature: stub(),
                        },
                    },
                    context: contextOptions,
                    cypress: {
                        config: { projectRoot: faker().system.directoryPath() },
                        results: results,
                    },
                    isCloudEnvironment: faker().datatype.boolean(),
                    logger: { message: messageMock },
                    options: options,
                };
                // Test execution.
                await cypressXrayPlugin.runPlugin(parameters);

                // Test validation.
                assert.deepStrictEqual(
                    messageMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    uploadVideosMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                client: parameters.clients.jira,
                                cypress: {
                                    results: {
                                        videos: parameters.cypress.results.runs
                                            .map((run) => run.video)
                                            .filter((value) => value !== null),
                                    },
                                },
                                logger: parameters.logger,
                                options: {
                                    jira: { testExecutionIssueKey: finalTestExecutionIssueKey },
                                },
                            },
                        ],
                    ]
                );
            });
        }
    });

    void describe("scenario: jira transition in server environment", () => {
        const projectKey = generateFakeProjectKey();
        const testExecutionIssue = generateFakePluginIssueUpdate({ key: false, transition: true });
        const contextOptions: RuntimeParameters["context"] = {
            emitter: { emit: stub() },
            evidence: { getEvidence: stub() },
            featureFilePaths: faker().helpers.multiple(() => faker().system.filePath()),
            iterationParameters: { getIterationParameters: stub() },
            screenshots: generateFakeScreenshotDetails(),
        };
        const finalTestExecutionIssueKey =
            testExecutionIssue.key ?? generateFakeIssueKey({ projectKey: projectKey });
        const options: RuntimeParameters["options"] = {
            cucumber: faker().helpers.maybe(() => {
                return {
                    featureFileExtension: faker().system.fileExt(),
                    prefixes: {
                        precondition: faker().helpers.maybe(() => faker().string.sample()),
                        test: faker().helpers.maybe(() => faker().string.sample()),
                    },
                    preprocessor: faker().helpers.maybe(() => {
                        return {
                            json: {
                                enabled: faker().datatype.boolean(),
                                output: faker().system.filePath(),
                            },
                        };
                    }),
                };
            }),
            jira: {
                attachVideos: true,
                fields: {
                    testEnvironments: faker().helpers.maybe(() => faker().string.uuid()),
                    testPlan: faker().helpers.maybe(() => faker().string.uuid()),
                },
                projectKey: projectKey,
                testExecutionIssue: testExecutionIssue,
                url: faker().internet.url(),
            },
            plugin: {
                normalizeScreenshotNames: faker().datatype.boolean(),
                splitUpload: faker().helpers.arrayElement([true, false, "sequential"]),
                uploadLastAttempt: faker().datatype.boolean(),
            },
            xray: {
                status: {
                    aggregate: stub(),
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
                },
                uploadResults: true,
                uploadScreenshots: faker().datatype.boolean(),
            },
        };
        const multipartInfo = generateFakeMultipartInfo({
            fields: options.jira.fields,
            projectKey: projectKey,
        });

        for (const { results, version } of [
            {
                results: generateFakeCypressRunResultV12({ projectKey: projectKey }),
                version: "<13",
            },
            {
                results: generateFakeCypressRunResultV13({ projectKey: projectKey }),
                version: "13",
            },
            {
                results: generateFakeCypressRunResultV14({ projectKey: projectKey }),
                version: ">=14",
            },
        ]) {
            void it(version, async (context) => {
                // Test setup.
                context.mock.method(
                    pluginPhases,
                    "runFeatureFileUpload",
                    () => testExecutionIssue.fields?.summary
                );
                context.mock.method(pluginPhases, "runMultipartConversion", () => multipartInfo);
                context.mock.method(
                    pluginPhases,
                    "runCypressUpload",
                    () => finalTestExecutionIssueKey
                );
                context.mock.method(
                    pluginPhases,
                    "runCucumberUpload",
                    () => finalTestExecutionIssueKey
                );
                context.mock.method(
                    uploadValidation,
                    "validateUploads",
                    () => finalTestExecutionIssueKey
                );
                context.mock.method(videoUpload, "uploadVideos", context.mock.fn());
                const transitionIssueMock =
                    context.mock.fn<HasTransitionIssueEndpoint["transitionIssue"]>();
                const messageMock = context.mock.fn<Logger["message"]>();
                const parameters: RuntimeParameters = {
                    clients: {
                        jira: {
                            addAttachment: stub(),
                            editIssue: stub(),
                            getFields: stub(),
                            search: stub(),
                            transitionIssue: transitionIssueMock,
                        },
                        xray: {
                            addEvidence: stub(),
                            addEvidenceToTestRun: stub(),
                            getTestRun: stub(),
                            getTestRunResults: stub(),
                            importExecutionCucumberMultipart: stub(),
                            importExecutionMultipart: stub(),
                            importFeature: stub(),
                        },
                    },
                    context: contextOptions,
                    cypress: {
                        config: { projectRoot: faker().system.directoryPath() },
                        results: results,
                    },
                    isCloudEnvironment: false,
                    logger: { message: messageMock },
                    options: options,
                };
                // Test execution.
                await cypressXrayPlugin.runPlugin(parameters);

                // Test validation.
                assert.deepStrictEqual(
                    messageMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    transitionIssueMock.mock.calls.map((call) => call.arguments),
                    [[finalTestExecutionIssueKey, { transition: testExecutionIssue.transition }]]
                );
            });
        }
    });

    void describe("scenario: no jira transition in cloud environment", () => {
        const projectKey = generateFakeProjectKey();
        const testExecutionIssue = generateFakePluginIssueUpdate({
            key: faker().datatype.boolean(),
            transition: true,
        });
        const contextOptions: RuntimeParameters["context"] = {
            emitter: { emit: stub() },
            evidence: { getEvidence: stub() },
            featureFilePaths: faker().helpers.multiple(() => faker().system.filePath()),
            iterationParameters: { getIterationParameters: stub() },
            screenshots: generateFakeScreenshotDetails(),
        };
        const finalTestExecutionIssueKey =
            testExecutionIssue.key ?? generateFakeIssueKey({ projectKey: projectKey });
        const options: RuntimeParameters["options"] = {
            cucumber: faker().helpers.maybe(() => {
                return {
                    featureFileExtension: faker().system.fileExt(),
                    prefixes: {
                        precondition: faker().helpers.maybe(() => faker().string.sample()),
                        test: faker().helpers.maybe(() => faker().string.sample()),
                    },
                    preprocessor: faker().helpers.maybe(() => {
                        return {
                            json: {
                                enabled: faker().datatype.boolean(),
                                output: faker().system.filePath(),
                            },
                        };
                    }),
                };
            }),
            jira: {
                attachVideos: true,
                fields: {
                    testEnvironments: faker().helpers.maybe(() => faker().string.uuid()),
                    testPlan: faker().helpers.maybe(() => faker().string.uuid()),
                },
                projectKey: projectKey,
                testExecutionIssue: testExecutionIssue,
                url: faker().internet.url(),
            },
            plugin: {
                normalizeScreenshotNames: faker().datatype.boolean(),
                splitUpload: faker().helpers.arrayElement([true, false, "sequential"]),
                uploadLastAttempt: faker().datatype.boolean(),
            },
            xray: {
                status: {
                    aggregate: stub(),
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
                },
                uploadResults: true,
                uploadScreenshots: faker().datatype.boolean(),
            },
        };
        const multipartInfo = generateFakeMultipartInfo({
            fields: options.jira.fields,
            projectKey: projectKey,
        });

        for (const { results, version } of [
            {
                results: generateFakeCypressRunResultV12({ projectKey: projectKey }),
                version: "<13",
            },
            {
                results: generateFakeCypressRunResultV13({ projectKey: projectKey }),
                version: "13",
            },
            {
                results: generateFakeCypressRunResultV14({ projectKey: projectKey }),
                version: ">=14",
            },
        ]) {
            void it(version, async (context) => {
                // Test setup.
                context.mock.method(
                    pluginPhases,
                    "runFeatureFileUpload",
                    () => testExecutionIssue.fields?.summary
                );
                context.mock.method(pluginPhases, "runMultipartConversion", () => multipartInfo);
                context.mock.method(
                    pluginPhases,
                    "runCypressUpload",
                    () => finalTestExecutionIssueKey
                );
                context.mock.method(
                    pluginPhases,
                    "runCucumberUpload",
                    () => finalTestExecutionIssueKey
                );
                context.mock.method(
                    uploadValidation,
                    "validateUploads",
                    () => finalTestExecutionIssueKey
                );
                context.mock.method(videoUpload, "uploadVideos", context.mock.fn());
                const transitionIssueMock =
                    context.mock.fn<HasTransitionIssueEndpoint["transitionIssue"]>();
                const messageMock = context.mock.fn<Logger["message"]>();
                const parameters: RuntimeParameters = {
                    clients: {
                        jira: {
                            addAttachment: stub(),
                            editIssue: stub(),
                            getFields: stub(),
                            search: stub(),
                            transitionIssue: transitionIssueMock,
                        },
                        xray: {
                            addEvidence: stub(),
                            addEvidenceToTestRun: stub(),
                            getTestRun: stub(),
                            getTestRunResults: stub(),
                            importExecutionCucumberMultipart: stub(),
                            importExecutionMultipart: stub(),
                            importFeature: stub(),
                        },
                    },
                    context: contextOptions,
                    cypress: {
                        config: { projectRoot: faker().system.directoryPath() },
                        results: results,
                    },
                    isCloudEnvironment: true,
                    logger: { message: messageMock },
                    options: options,
                };
                // Test execution.
                await cypressXrayPlugin.runPlugin(parameters);

                // Test validation.
                assert.deepStrictEqual(
                    messageMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    transitionIssueMock.mock.calls.map((call) => call.arguments),
                    []
                );
            });
        }
    });

    void describe("scenario: no transition without final test execution issue key", () => {
        const projectKey = generateFakeProjectKey();
        const testExecutionIssue = generateFakePluginIssueUpdate({ key: false, transition: true });
        const contextOptions: RuntimeParameters["context"] = {
            emitter: { emit: stub() },
            evidence: { getEvidence: stub() },
            featureFilePaths: faker().helpers.multiple(() => faker().system.filePath()),
            iterationParameters: { getIterationParameters: stub() },
            screenshots: generateFakeScreenshotDetails(),
        };
        const options: RuntimeParameters["options"] = {
            cucumber: faker().helpers.maybe(() => {
                return {
                    featureFileExtension: faker().system.fileExt(),
                    prefixes: {
                        precondition: faker().helpers.maybe(() => faker().string.sample()),
                        test: faker().helpers.maybe(() => faker().string.sample()),
                    },
                    preprocessor: faker().helpers.maybe(() => {
                        return {
                            json: {
                                enabled: faker().datatype.boolean(),
                                output: faker().system.filePath(),
                            },
                        };
                    }),
                };
            }),
            jira: {
                attachVideos: true,
                fields: {
                    testEnvironments: faker().helpers.maybe(() => faker().string.uuid()),
                    testPlan: faker().helpers.maybe(() => faker().string.uuid()),
                },
                projectKey: projectKey,
                testExecutionIssue: testExecutionIssue,
                url: faker().internet.url(),
            },
            plugin: {
                normalizeScreenshotNames: faker().datatype.boolean(),
                splitUpload: faker().helpers.arrayElement([true, false, "sequential"]),
                uploadLastAttempt: faker().datatype.boolean(),
            },
            xray: {
                status: {
                    aggregate: stub(),
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
                },
                uploadResults: true,
                uploadScreenshots: faker().datatype.boolean(),
            },
        };
        const multipartInfo = generateFakeMultipartInfo({
            fields: options.jira.fields,
            projectKey: projectKey,
        });

        for (const { results, version } of [
            {
                results: generateFakeCypressRunResultV12({ projectKey: projectKey }),
                version: "<13",
            },
            {
                results: generateFakeCypressRunResultV13({ projectKey: projectKey }),
                version: "13",
            },
            {
                results: generateFakeCypressRunResultV14({ projectKey: projectKey }),
                version: ">=14",
            },
        ]) {
            void it(version, async (context) => {
                // Test setup.
                context.mock.method(
                    pluginPhases,
                    "runFeatureFileUpload",
                    () => testExecutionIssue.fields?.summary
                );
                context.mock.method(pluginPhases, "runMultipartConversion", () => multipartInfo);
                context.mock.method(pluginPhases, "runCypressUpload", () => undefined);
                context.mock.method(pluginPhases, "runCucumberUpload", () => undefined);
                context.mock.method(uploadValidation, "validateUploads", () => undefined);
                context.mock.method(videoUpload, "uploadVideos", context.mock.fn());
                const transitionIssueMock =
                    context.mock.fn<HasTransitionIssueEndpoint["transitionIssue"]>();
                const messageMock = context.mock.fn<Logger["message"]>();
                const parameters: RuntimeParameters = {
                    clients: {
                        jira: {
                            addAttachment: stub(),
                            editIssue: stub(),
                            getFields: stub(),
                            search: stub(),
                            transitionIssue: transitionIssueMock,
                        },
                        xray: {
                            addEvidence: stub(),
                            addEvidenceToTestRun: stub(),
                            getTestRun: stub(),
                            getTestRunResults: stub(),
                            importExecutionCucumberMultipart: stub(),
                            importExecutionMultipart: stub(),
                            importFeature: stub(),
                        },
                    },
                    context: contextOptions,
                    cypress: {
                        config: { projectRoot: faker().system.directoryPath() },
                        results: results,
                    },
                    isCloudEnvironment: false,
                    logger: { message: messageMock },
                    options: options,
                };
                // Test execution.
                await cypressXrayPlugin.runPlugin(parameters);

                // Test validation.
                assert.deepStrictEqual(
                    messageMock.mock.calls.map((call) => call.arguments),
                    []
                );
                assert.deepStrictEqual(
                    transitionIssueMock.mock.calls.map((call) => call.arguments),
                    []
                );
            });
        }
    });

    void describe("scenario: cypress upload throws error", () => {
        const projectKey = generateFakeProjectKey();
        const [featureFileExtension, cypressSpecExtension] = [".feature", ".cy.js"];
        const testExecutionIssue = generateFakePluginIssueUpdate();
        const contextOptions: RuntimeParameters["context"] = {
            emitter: { emit: stub() },
            evidence: { getEvidence: stub() },
            featureFilePaths: faker().helpers.multiple(() => faker().system.filePath()),
            iterationParameters: { getIterationParameters: stub() },
            screenshots: generateFakeScreenshotDetails(),
        };
        const options: RuntimeParameters["options"] = {
            cucumber: {
                featureFileExtension: featureFileExtension,
                prefixes: {
                    precondition: faker().helpers.maybe(() => faker().string.sample()),
                    test: faker().helpers.maybe(() => faker().string.sample()),
                },
                preprocessor: faker().helpers.maybe(() => {
                    return {
                        json: {
                            enabled: faker().datatype.boolean(),
                            output: faker().system.filePath(),
                        },
                    };
                }),
            },
            jira: {
                attachVideos: faker().datatype.boolean(),
                fields: {
                    testEnvironments: faker().helpers.maybe(() => faker().string.uuid()),
                    testPlan: faker().helpers.maybe(() => faker().string.uuid()),
                },
                projectKey: projectKey,
                testExecutionIssue: testExecutionIssue,
                url: faker().internet.url(),
            },
            plugin: {
                normalizeScreenshotNames: faker().datatype.boolean(),
                splitUpload: faker().helpers.arrayElement([true, false, "sequential"]),
                uploadLastAttempt: faker().datatype.boolean(),
            },
            xray: {
                status: {
                    aggregate: stub(),
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
                },
                uploadResults: true,
                uploadScreenshots: faker().datatype.boolean(),
            },
        };
        const multipartInfo = generateFakeMultipartInfo({
            fields: options.jira.fields,
            projectKey: projectKey,
        });

        for (const { results, version } of [
            {
                results: generateFakeCypressRunResultV12({
                    projectKey: projectKey,
                    runs: faker().helpers.shuffle([
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV12({
                                projectKey: projectKey,
                                specExtensions: [cypressSpecExtension],
                            })
                        ),
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV12({
                                projectKey: projectKey,
                                specExtensions: [featureFileExtension],
                            })
                        ),
                    ]),
                }),
                version: "<13",
            },
            {
                results: generateFakeCypressRunResultV13({
                    projectKey: projectKey,
                    runs: faker().helpers.shuffle([
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV13({
                                projectKey: projectKey,
                                specExtensions: [cypressSpecExtension],
                            })
                        ),
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV13({
                                projectKey: projectKey,
                                specExtensions: [featureFileExtension],
                            })
                        ),
                    ]),
                }),
                version: "13",
            },
            {
                results: generateFakeCypressRunResultV14({
                    projectKey: projectKey,
                    runs: faker().helpers.shuffle([
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV14({
                                projectKey: projectKey,
                                specExtensions: [cypressSpecExtension],
                            })
                        ),
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV14({
                                projectKey: projectKey,
                                specExtensions: [featureFileExtension],
                            })
                        ),
                    ]),
                }),
                version: ">=14",
            },
        ]) {
            void it(version, async (context) => {
                // Test setup.
                const errorMessage = faker().book.title();
                context.mock.method(
                    pluginPhases,
                    "runFeatureFileUpload",
                    () => testExecutionIssue.fields?.summary
                );
                context.mock.method(pluginPhases, "runMultipartConversion", () => multipartInfo);
                context.mock.method(pluginPhases, "runCypressUpload", () =>
                    Promise.reject(new Error(errorMessage))
                );
                const runCucumberUploadMock = context.mock.method(
                    pluginPhases,
                    "runCucumberUpload",
                    () => testExecutionIssue.key
                );
                const validateUploadsMock = context.mock.method(
                    uploadValidation,
                    "validateUploads",
                    () => testExecutionIssue.key
                );
                context.mock.method(videoUpload, "uploadVideos", context.mock.fn());
                const messageMock = context.mock.fn<Logger["message"]>();
                const parameters: RuntimeParameters = {
                    clients: {
                        jira: {
                            addAttachment: stub(),
                            editIssue: stub(),
                            getFields: stub(),
                            search: stub(),
                            transitionIssue: stub(),
                        },
                        xray: {
                            addEvidence: stub(),
                            addEvidenceToTestRun: stub(),
                            getTestRun: stub(),
                            getTestRunResults: stub(),
                            importExecutionCucumberMultipart: stub(),
                            importExecutionMultipart: stub(),
                            importFeature: stub(),
                        },
                    },
                    context: contextOptions,
                    cypress: {
                        config: { projectRoot: faker().system.directoryPath() },
                        results: results,
                    },
                    isCloudEnvironment: false,
                    logger: { message: messageMock },
                    options: options,
                };
                // Test execution.
                await cypressXrayPlugin.runPlugin(parameters);

                // Test validation.
                assert.deepStrictEqual(
                    messageMock.mock.calls.map((call) => call.arguments),
                    [["error", errorMessage]]
                );
                assert.deepStrictEqual(runCucumberUploadMock.mock.callCount(), 1);
                assert.deepStrictEqual(
                    validateUploadsMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                cucumberExecutionIssueKey: testExecutionIssue.key,
                                cypressExecutionIssueKey: undefined,
                                logger: parameters.logger,
                                url: parameters.options.jira.url,
                            },
                        ],
                    ]
                );
            });
        }
    });

    void describe("scenario: cucumber upload throws error", () => {
        const projectKey = generateFakeProjectKey();
        const [featureFileExtension, cypressSpecExtension] = [".feature", ".cy.js"];
        const testExecutionIssue = generateFakePluginIssueUpdate();
        const contextOptions: RuntimeParameters["context"] = {
            emitter: { emit: stub() },
            evidence: { getEvidence: stub() },
            featureFilePaths: faker().helpers.multiple(() => faker().system.filePath()),
            iterationParameters: { getIterationParameters: stub() },
            screenshots: generateFakeScreenshotDetails(),
        };
        const options: RuntimeParameters["options"] = {
            cucumber: {
                featureFileExtension: featureFileExtension,
                prefixes: {
                    precondition: faker().helpers.maybe(() => faker().string.sample()),
                    test: faker().helpers.maybe(() => faker().string.sample()),
                },
                preprocessor: faker().helpers.maybe(() => {
                    return {
                        json: {
                            enabled: faker().datatype.boolean(),
                            output: faker().system.filePath(),
                        },
                    };
                }),
            },
            jira: {
                attachVideos: faker().datatype.boolean(),
                fields: {
                    testEnvironments: faker().helpers.maybe(() => faker().string.uuid()),
                    testPlan: faker().helpers.maybe(() => faker().string.uuid()),
                },
                projectKey: projectKey,
                testExecutionIssue: testExecutionIssue,
                url: faker().internet.url(),
            },
            plugin: {
                normalizeScreenshotNames: faker().datatype.boolean(),
                splitUpload: faker().helpers.arrayElement([true, false, "sequential"]),
                uploadLastAttempt: faker().datatype.boolean(),
            },
            xray: {
                status: {
                    aggregate: stub(),
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
                },
                uploadResults: true,
                uploadScreenshots: faker().datatype.boolean(),
            },
        };
        const multipartInfo = generateFakeMultipartInfo({
            fields: options.jira.fields,
            projectKey: projectKey,
        });

        for (const { results, version } of [
            {
                results: generateFakeCypressRunResultV12({
                    projectKey: projectKey,
                    runs: faker().helpers.shuffle([
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV12({
                                projectKey: projectKey,
                                specExtensions: [cypressSpecExtension],
                            })
                        ),
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV12({
                                projectKey: projectKey,
                                specExtensions: [featureFileExtension],
                            })
                        ),
                    ]),
                }),
                version: "<13",
            },
            {
                results: generateFakeCypressRunResultV13({
                    projectKey: projectKey,
                    runs: faker().helpers.shuffle([
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV13({
                                projectKey: projectKey,
                                specExtensions: [cypressSpecExtension],
                            })
                        ),
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV13({
                                projectKey: projectKey,
                                specExtensions: [featureFileExtension],
                            })
                        ),
                    ]),
                }),
                version: "13",
            },
            {
                results: generateFakeCypressRunResultV14({
                    projectKey: projectKey,
                    runs: faker().helpers.shuffle([
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV14({
                                projectKey: projectKey,
                                specExtensions: [cypressSpecExtension],
                            })
                        ),
                        ...faker().helpers.multiple(() =>
                            generateFakeRunResultV14({
                                projectKey: projectKey,
                                specExtensions: [featureFileExtension],
                            })
                        ),
                    ]),
                }),
                version: ">=14",
            },
        ]) {
            void it(version, async (context) => {
                // Test setup.
                const errorMessage = faker().book.title();
                context.mock.method(
                    pluginPhases,
                    "runFeatureFileUpload",
                    () => testExecutionIssue.fields?.summary
                );
                context.mock.method(pluginPhases, "runMultipartConversion", () => multipartInfo);
                context.mock.method(pluginPhases, "runCypressUpload", () => testExecutionIssue.key);
                context.mock.method(pluginPhases, "runCucumberUpload", () =>
                    Promise.reject(new Error(errorMessage))
                );
                const validateUploadsMock = context.mock.method(
                    uploadValidation,
                    "validateUploads",
                    () => testExecutionIssue.key
                );
                context.mock.method(videoUpload, "uploadVideos", context.mock.fn());
                const messageMock = context.mock.fn<Logger["message"]>();
                const parameters: RuntimeParameters = {
                    clients: {
                        jira: {
                            addAttachment: stub(),
                            editIssue: stub(),
                            getFields: stub(),
                            search: stub(),
                            transitionIssue: stub(),
                        },
                        xray: {
                            addEvidence: stub(),
                            addEvidenceToTestRun: stub(),
                            getTestRun: stub(),
                            getTestRunResults: stub(),
                            importExecutionCucumberMultipart: stub(),
                            importExecutionMultipart: stub(),
                            importFeature: stub(),
                        },
                    },
                    context: contextOptions,
                    cypress: {
                        config: { projectRoot: faker().system.directoryPath() },
                        results: results,
                    },
                    isCloudEnvironment: false,
                    logger: { message: messageMock },
                    options: options,
                };
                // Test execution.
                await cypressXrayPlugin.runPlugin(parameters);

                // Test validation.
                assert.deepStrictEqual(
                    messageMock.mock.calls.map((call) => call.arguments),
                    [["error", errorMessage]]
                );
                assert.deepStrictEqual(
                    validateUploadsMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                cucumberExecutionIssueKey: undefined,
                                cypressExecutionIssueKey: testExecutionIssue.key,
                                logger: parameters.logger,
                                url: parameters.options.jira.url,
                            },
                        ],
                    ]
                );
            });
        }
    });
});
