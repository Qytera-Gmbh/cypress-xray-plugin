import axios, { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it, mock } from "node:test";
import type { XrayTestExecutionResults } from "../../types/xray/import-test-execution-results";
import type { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import type {
    MultipartInfo,
    MultipartInfoCloud,
} from "../../types/xray/requests/import-execution-multipart-info";
import type { GetTestsResponse } from "../../types/xray/responses/graphql/get-tests";
import { dedent } from "../../util/dedent";
import { Level, LOG } from "../../util/logging";
import { JwtCredentials } from "../authentication/credentials";
import { AxiosRestClient } from "../https/requests";
import { XrayClientCloud } from "./xray-client-cloud";

describe(relative(cwd(), __filename), async () => {
    await describe(XrayClientCloud.name, async () => {
        let client: XrayClientCloud;
        let restClient: AxiosRestClient;

        beforeEach(() => {
            restClient = new AxiosRestClient(axios);
            const credentials = new JwtCredentials(
                "abc",
                "xyz",
                "http://localhost:1234",
                restClient
            );
            mock.method(credentials, "getAuthorizationHeader", () => {
                return { ["Authorization"]: "ey12345" };
            });
            client = new XrayClientCloud(credentials, restClient);
        });

        await describe("import execution", async () => {
            await it("calls the correct endpoint", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            id: "12345",
                            key: "CYP-123",
                            self: "http://www.example.org/jira/rest/api/2/issue/12345",
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                await client.importExecution({
                    info: {
                        description: "Cypress version: 11.1.0 Browser: electron (106.0.5249.51)",
                        finishDate: "2022-11-28T17:41:19Z",
                        project: "CYP",
                        startDate: "2022-11-28T17:41:12Z",
                        summary: "Test Execution Here",
                    },
                    testExecutionKey: "CYP-42",
                    tests: [
                        {
                            finish: "2022-11-28T17:41:15Z",
                            start: "2022-11-28T17:41:15Z",
                            status: "PASSED",
                        },
                        {
                            finish: "2022-11-28T17:41:15Z",
                            start: "2022-11-28T17:41:15Z",
                            status: "PASSED",
                        },
                        {
                            finish: "2022-11-28T17:41:19Z",
                            start: "2022-11-28T17:41:15Z",
                            status: "FAILED",
                        },
                    ],
                });
                assert.strictEqual(post.mock.calls.length, 1);
                assert.strictEqual(
                    post.mock.calls[0].arguments[0],
                    "https://xray.cloud.getxray.app/api/v2/import/execution"
                );
            });

            await it("should handle successful responses", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            id: "12345",
                            key: "CYP-123",
                            self: "http://www.example.org/jira/rest/api/2/issue/12345",
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                const response = await client.importExecution({
                    info: {
                        description: "Cypress version: 11.1.0 Browser: electron (106.0.5249.51)",
                        finishDate: "2022-11-28T17:41:19Z",
                        project: "CYP",
                        startDate: "2022-11-28T17:41:12Z",
                        summary: "Test Execution Here",
                    },
                    testExecutionKey: "CYP-42",
                    tests: [
                        {
                            finish: "2022-11-28T17:41:15Z",
                            start: "2022-11-28T17:41:15Z",
                            status: "PASSED",
                        },
                        {
                            finish: "2022-11-28T17:41:15Z",
                            start: "2022-11-28T17:41:15Z",
                            status: "PASSED",
                        },
                        {
                            finish: "2022-11-28T17:41:19Z",
                            start: "2022-11-28T17:41:15Z",
                            status: "FAILED",
                        },
                    ],
                });
                assert.strictEqual(response, "CYP-123");
            });

            await it("handles bad responses", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const logErrorToFile = context.mock.method(
                    LOG,
                    "logErrorToFile",
                    context.mock.fn()
                );

                const error = new AxiosError(
                    "Request failed with status code 400",
                    "400",
                    { headers: new AxiosHeaders() },
                    null,
                    {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            error: "Must provide a project key",
                        },
                        headers: {},
                        status: 400,
                        statusText: "Bad Request",
                    }
                );

                context.mock.method(restClient, "post", () => {
                    throw error;
                });

                await assert.rejects(
                    client.importExecution({
                        info: {
                            description:
                                "Cypress version: 11.1.0 Browser: electron (106.0.5249.51)",
                            finishDate: "2022-11-28T17:41:19Z",
                            startDate: "2022-11-28T17:41:12Z",
                            summary: "Test Execution Here",
                        },
                        testExecutionKey: "CYP-42",
                        tests: [
                            {
                                finish: "2022-11-28T17:41:15Z",
                                start: "2022-11-28T17:41:15Z",
                                status: "PASSED",
                            },
                        ],
                    }),
                    { message: "Failed to import Cypress results" }
                );

                assert.strictEqual(message.mock.callCount(), 2);
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.ERROR,
                    "Failed to import Cypress results: Request failed with status code 400",
                ]);
                assert.strictEqual(logErrorToFile.mock.callCount(), 1);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "importExecutionError",
                ]);
            });
        });

        await describe("import execution multipart", async () => {
            await it("calls the correct endpoint", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            id: "12345",
                            key: "CYP-123",
                            self: "http://www.example.org/jira/rest/api/2/issue/12345",
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                await client.importExecutionMultipart(
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionMultipartResultsCloud.json",
                            "utf-8"
                        )
                    ) as XrayTestExecutionResults,
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionMultipartInfoCloud.json",
                            "utf-8"
                        )
                    ) as MultipartInfoCloud
                );

                assert.strictEqual(post.mock.callCount(), 1);
                assert.deepStrictEqual(
                    post.mock.calls[0].arguments[0],
                    "https://xray.cloud.getxray.app/api/v2/import/execution/multipart"
                );
            });

            await it("handles successful responses", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            id: "12345",
                            key: "CYP-123",
                            self: "http://www.example.org/jira/rest/api/2/issue/12345",
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                const response = await client.importExecutionMultipart(
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionMultipartResultsCloud.json",
                            "utf-8"
                        )
                    ) as XrayTestExecutionResults,
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionMultipartInfoCloud.json",
                            "utf-8"
                        )
                    ) as MultipartInfoCloud
                );
                assert.strictEqual(response, "CYP-123");
            });

            await it("handles bad responses", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const logErrorToFile = context.mock.method(
                    LOG,
                    "logErrorToFile",
                    context.mock.fn()
                );
                const error = new AxiosError(
                    "Request failed with status code 400",
                    "400",
                    { headers: new AxiosHeaders() },
                    null,
                    {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            error: "Error assembling issue data: project is required",
                        },
                        headers: {},
                        status: 400,
                        statusText: "Bad Request",
                    }
                );

                context.mock.method(restClient, "post", () => {
                    throw error;
                });

                await assert.rejects(
                    client.importExecutionMultipart(
                        JSON.parse(
                            readFileSync(
                                "./test/resources/fixtures/xray/requests/importExecutionMultipartResultsCloud.json",
                                "utf-8"
                            )
                        ) as XrayTestExecutionResults,
                        JSON.parse(
                            readFileSync(
                                "./test/resources/fixtures/xray/requests/importExecutionMultipartInfoCloud.json",
                                "utf-8"
                            )
                        ) as MultipartInfoCloud
                    ),
                    { message: "Failed to import Cypress results" }
                );
                assert.strictEqual(message.mock.callCount(), 2);
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.ERROR,
                    "Failed to import Cypress results: Request failed with status code 400",
                ]);
                assert.strictEqual(logErrorToFile.mock.callCount(), 1);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "importExecutionMultipartError",
                ]);
            });
        });

        await describe("import execution cucumber multipart", async () => {
            await it("calls the correct endpoint", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            id: "12345",
                            key: "CYP-123",
                            self: "http://www.example.org/jira/rest/api/2/issue/12345",
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                await client.importExecutionCucumberMultipart(
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                            "utf-8"
                        )
                    ) as CucumberMultipartFeature[],
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoCloud.json",
                            "utf-8"
                        )
                    ) as MultipartInfo
                );

                assert.strictEqual(post.mock.calls.length, 1);
                assert.strictEqual(
                    post.mock.calls[0].arguments[0],
                    "https://xray.cloud.getxray.app/api/v2/import/execution/cucumber/multipart"
                );
            });

            await it("should handle successful responses", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            id: "12345",
                            key: "CYP-123",
                            self: "http://www.example.org/jira/rest/api/2/issue/12345",
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                const response = await client.importExecutionCucumberMultipart(
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                            "utf-8"
                        )
                    ) as CucumberMultipartFeature[],
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoCloud.json",
                            "utf-8"
                        )
                    ) as MultipartInfo
                );

                assert.strictEqual(response, "CYP-123");
            });

            await it("handles bad responses", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const logErrorToFile = context.mock.method(
                    LOG,
                    "logErrorToFile",
                    context.mock.fn()
                );

                const error = new AxiosError(
                    "Request failed with status code 400",
                    "400",
                    { headers: new AxiosHeaders() },
                    null,
                    {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            error: "There are no valid tests imported", // sic
                        },
                        headers: {},
                        status: 400,
                        statusText: "Bad Request",
                    }
                );

                context.mock.method(restClient, "post", () => {
                    throw error;
                });

                await assert.rejects(
                    client.importExecutionCucumberMultipart(
                        JSON.parse(
                            readFileSync(
                                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                                "utf-8"
                            )
                        ) as CucumberMultipartFeature[],
                        JSON.parse(
                            readFileSync(
                                "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoCloud.json",
                                "utf-8"
                            )
                        ) as MultipartInfo
                    ),
                    { message: "Failed to import Cucumber results" }
                );
                assert.strictEqual(message.mock.callCount(), 2);
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.ERROR,
                    "Failed to import Cucumber results: Request failed with status code 400",
                ]);
                assert.strictEqual(logErrorToFile.mock.callCount(), 1);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "importExecutionCucumberMultipartError",
                ]);
            });
        });

        await describe("import feature", async () => {
            await it("calls the correct endpoint", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            errors: [],
                            updatedOrCreatedPreconditions: [
                                {
                                    id: "12345",
                                    key: "CYP-222",
                                    self: "https://devxray3.atlassian.net/rest/api/2/issue/12345",
                                },
                            ],
                            updatedOrCreatedTests: [
                                {
                                    id: "32495",
                                    key: "CYP-333",
                                    self: "https://devxray3.atlassian.net/rest/api/2/issue/32495",
                                },
                                {
                                    id: "32493",
                                    key: "CYP-555",
                                    self: "https://devxray3.atlassian.net/rest/api/2/issue/32493",
                                },
                            ],
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                await client.importFeature(
                    "./test/resources/features/taggedPrefixCorrect.feature",
                    { projectKey: "CYP" }
                );

                assert.strictEqual(post.mock.calls.length, 1);
                assert.strictEqual(
                    post.mock.calls[0].arguments[0],
                    "https://xray.cloud.getxray.app/api/v2/import/feature?projectKey=CYP"
                );
            });

            await it("handles successful responses", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            errors: [],
                            updatedOrCreatedPreconditions: [
                                {
                                    id: "12345",
                                    key: "CYP-222",
                                    self: "https://devxray3.atlassian.net/rest/api/2/issue/12345",
                                },
                            ],
                            updatedOrCreatedTests: [
                                {
                                    id: "32495",
                                    key: "CYP-333",
                                    self: "https://devxray3.atlassian.net/rest/api/2/issue/32495",
                                },
                                {
                                    id: "32493",
                                    key: "CYP-555",
                                    self: "https://devxray3.atlassian.net/rest/api/2/issue/32493",
                                },
                            ],
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                const response = await client.importFeature(
                    "./test/resources/features/taggedPrefixCorrect.feature",
                    { projectKey: "CYP" }
                );

                assert.deepStrictEqual(response, {
                    errors: [],
                    updatedOrCreatedIssues: ["CYP-333", "CYP-555", "CYP-222"],
                });
            });

            await it("handles responses with errors", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());

                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            errors: [
                                "Error in file taggedPrefixCorrect.feature: Precondition with key CYP-222 was not found!",
                                "Error in file taggedPrefixCorrect.feature: Test with key CYP-333 was not found!",
                            ],
                            updatedOrCreatedPreconditions: [],
                            updatedOrCreatedTests: [
                                {
                                    id: "32493",
                                    key: "CYP-555",
                                    self: "https://devxray3.atlassian.net/rest/api/2/issue/32493",
                                },
                            ],
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                const response = await client.importFeature(
                    "./test/resources/features/taggedPrefixCorrect.feature",
                    { projectId: "abcdef1234" }
                );

                assert.strictEqual(
                    post.mock.calls[0].arguments[0],
                    "https://xray.cloud.getxray.app/api/v2/import/feature?projectId=abcdef1234"
                );
                assert.deepStrictEqual(response, {
                    errors: [
                        "Error in file taggedPrefixCorrect.feature: Precondition with key CYP-222 was not found!",
                        "Error in file taggedPrefixCorrect.feature: Test with key CYP-333 was not found!",
                    ],
                    updatedOrCreatedIssues: ["CYP-555"],
                });
                assert.strictEqual(message.mock.callCount(), 3);
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.DEBUG,
                    dedent(`
                        Encountered some errors during feature file import:
                        - Error in file taggedPrefixCorrect.feature: Precondition with key CYP-222 was not found!
                        - Error in file taggedPrefixCorrect.feature: Test with key CYP-333 was not found!
                    `),
                ]);
            });

            await it("handles responses without any updated issues", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());

                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            errors: [
                                "Error in file taggedPrefixCorrect.feature: Precondition with key CYP-222 was not found!",
                                "Error in file taggedPrefixCorrect.feature: Test with key CYP-333 was not found!",
                                "Error in file taggedPrefixCorrect.feature: Test with key CYP-555 was not found!",
                            ],
                            updatedOrCreatedPreconditions: [],
                            updatedOrCreatedTests: [],
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                const response = await client.importFeature(
                    "./test/resources/features/taggedPrefixCorrect.feature",
                    { source: "CYP" }
                );

                assert.strictEqual(
                    post.mock.calls[0].arguments[0],
                    "https://xray.cloud.getxray.app/api/v2/import/feature?source=CYP"
                );
                assert.deepStrictEqual(response, {
                    errors: [
                        "Error in file taggedPrefixCorrect.feature: Precondition with key CYP-222 was not found!",
                        "Error in file taggedPrefixCorrect.feature: Test with key CYP-333 was not found!",
                        "Error in file taggedPrefixCorrect.feature: Test with key CYP-555 was not found!",
                    ],
                    updatedOrCreatedIssues: [],
                });

                assert.strictEqual(message.mock.callCount(), 2);
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.DEBUG,
                    dedent(`
                        Encountered some errors during feature file import:
                        - Error in file taggedPrefixCorrect.feature: Precondition with key CYP-222 was not found!
                        - Error in file taggedPrefixCorrect.feature: Test with key CYP-333 was not found!
                        - Error in file taggedPrefixCorrect.feature: Test with key CYP-555 was not found!
                    `),
                ]);
            });

            await it("handles bad responses", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const logErrorToFile = context.mock.method(
                    LOG,
                    "logErrorToFile",
                    context.mock.fn()
                );

                const error = new AxiosError(
                    "Request failed with status code 400",
                    "400",
                    { headers: new AxiosHeaders() },
                    null,
                    {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            error: "There are no valid tests imported", // sic
                        },
                        headers: {},
                        status: 400,
                        statusText: "Bad Request",
                    }
                );

                context.mock.method(restClient, "post", () => {
                    throw error;
                });

                await assert.rejects(
                    client.importFeature("./test/resources/features/taggedPrefixCorrect.feature", {
                        projectKey: "CYP",
                    }),
                    { message: "Feature file import failed" }
                );

                assert.strictEqual(message.mock.callCount(), 2);
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.ERROR,
                    dedent(`
                        Failed to import Cucumber features: Request failed with status code 400

                          The prefixes in Cucumber background or scenario tags might not be consistent with the scheme defined in Xray.

                          For more information, visit:
                          - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                    `),
                ]);
                assert.strictEqual(logErrorToFile.mock.callCount(), 1);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "importFeatureError",
                ]);
            });

            await it("handles network failures", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const logErrorToFile = context.mock.method(
                    LOG,
                    "logErrorToFile",
                    context.mock.fn()
                );

                const error = new Error("Connection timeout");

                context.mock.method(restClient, "post", () => {
                    throw error;
                });

                await assert.rejects(
                    client.importFeature("./test/resources/features/taggedPrefixCorrect.feature", {
                        projectKey: "CYP",
                    }),
                    { message: "Feature file import failed" }
                );

                assert.strictEqual(message.mock.callCount(), 2);
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.ERROR,
                    "Failed to import Cucumber features: Connection timeout",
                ]);
                assert.strictEqual(logErrorToFile.mock.callCount(), 1);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "importFeatureError",
                ]);
            });
        });

        await describe("get test types", async () => {
            await it("calls the correct endpoint", async (context) => {
                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: JSON.parse(
                            readFileSync(
                                "./test/resources/fixtures/xray/responses/getTestsTypes.json",
                                "utf-8"
                            )
                        ) as GetTestsResponse<{ key: string }>,
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                await client.getTestTypes("CYP", "CYP-330", "CYP-331", "CYP-332", "CYP-337");

                assert.strictEqual(post.mock.callCount(), 1);
                assert.deepStrictEqual(
                    post.mock.calls[0].arguments[0],
                    "https://xray.cloud.getxray.app/api/v2/graphql"
                );
                assert.deepStrictEqual(post.mock.calls[0].arguments[1], {
                    query: dedent(`
                        query($jql: String, $start: Int!, $limit: Int!) {
                            getTests(jql: $jql, start: $start, limit: $limit) {
                                total
                                start
                                results {
                                    testType {
                                        name
                                        kind
                                    }
                                    jira(fields: ["key"])
                                }
                            }
                        }`),
                    variables: {
                        jql: "project = 'CYP' AND issue in (CYP-330,CYP-331,CYP-332,CYP-337)",
                        limit: 100,
                        start: 0,
                    },
                });
            });

            await it("should handle successful responses", async (context) => {
                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: JSON.parse(
                            readFileSync(
                                "./test/resources/fixtures/xray/responses/getTestsTypes.json",
                                "utf-8"
                            )
                        ) as GetTestsResponse<{ key: string }>,
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const response = await client.getTestTypes(
                    "CYP",
                    "CYP-330",
                    "CYP-331",
                    "CYP-332",
                    "CYP-337"
                );
                assert.deepStrictEqual(response, {
                    ["CYP-330"]: "Generic",
                    ["CYP-331"]: "Cucumber",
                    ["CYP-332"]: "Manual",
                    ["CYP-337"]: "Manual",
                });
            });

            await it("should paginate big requests", async (context) => {
                const mockedData: GetTestsResponse<unknown> = JSON.parse(
                    readFileSync(
                        "./test/resources/fixtures/xray/responses/getTestsTypes.json",
                        "utf-8"
                    )
                ) as GetTestsResponse<unknown>;
                let i = 0;
                context.mock.method(restClient, "post", () => {
                    switch (i++) {
                        case 0:
                            return {
                                config: { headers: new AxiosHeaders() },
                                data: {
                                    data: {
                                        getTests: {
                                            ...mockedData.data.getTests,
                                            results: mockedData.data.getTests.results?.slice(0, 1),
                                        },
                                    },
                                },
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                        case 1:
                            return {
                                config: { headers: new AxiosHeaders() },
                                data: {
                                    data: {
                                        getTests: {
                                            ...mockedData.data.getTests,
                                            results: mockedData.data.getTests.results?.slice(1, 2),
                                            start: 1,
                                        },
                                    },
                                },
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                        case 2:
                            return {
                                config: { headers: new AxiosHeaders() },
                                data: {
                                    data: {
                                        getTests: {
                                            ...mockedData.data.getTests,
                                            results: mockedData.data.getTests.results?.slice(2, 3),
                                            start: 2,
                                        },
                                    },
                                },
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                        case 3:
                            return {
                                config: { headers: new AxiosHeaders() },
                                data: {
                                    data: {
                                        getTests: {
                                            start: 3,
                                            total: 5,
                                        },
                                    },
                                },
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                        case 4:
                            return {
                                config: { headers: new AxiosHeaders() },
                                data: {
                                    data: {
                                        getTests: {
                                            ...mockedData.data.getTests,
                                            results: mockedData.data.getTests.results?.slice(3, 4),
                                            start: undefined,
                                            total: undefined,
                                        },
                                    },
                                },
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                        case 5:
                            return {
                                config: { headers: new AxiosHeaders() },
                                data: {
                                    data: {
                                        getTests: {
                                            ...mockedData.data.getTests,
                                            results: mockedData.data.getTests.results?.slice(3, 4),
                                            start: 3,
                                        },
                                    },
                                },
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                        case 6:
                            return {
                                config: { headers: new AxiosHeaders() },
                                data: {
                                    data: {
                                        getTests: {
                                            ...mockedData.data.getTests,
                                            results: mockedData.data.getTests.results?.slice(4, 5),
                                            start: 4,
                                        },
                                    },
                                },
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                    }
                });
                const response = await client.getTestTypes(
                    "CYP",
                    "CYP-330",
                    "CYP-331",
                    "CYP-332",
                    "CYP-337",
                    "CYP-339"
                );
                assert.deepStrictEqual(response, {
                    ["CYP-330"]: "Generic",
                    ["CYP-331"]: "Cucumber",
                    ["CYP-332"]: "Manual",
                    ["CYP-337"]: "Manual",
                });
            });

            await it("should handle bad responses", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const logErrorToFile = context.mock.method(
                    LOG,
                    "logErrorToFile",
                    context.mock.fn()
                );

                const error = new AxiosError(
                    "Request failed with status code 400",
                    "400",
                    { headers: new AxiosHeaders() },
                    null,
                    {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            error: "Must provide a project key",
                        },
                        headers: {},
                        status: 400,
                        statusText: "Bad Request",
                    }
                );

                context.mock.method(restClient, "post", () => {
                    throw error;
                });

                await assert.rejects(client.getTestTypes("CYP", "CYP-330", "CYP-331", "CYP-332"), {
                    message: "Failed to get test types",
                });

                assert.strictEqual(message.mock.callCount(), 2);
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.ERROR,
                    "Failed to get test types: Request failed with status code 400",
                ]);
                assert.strictEqual(logErrorToFile.mock.callCount(), 1);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "getTestTypesError",
                ]);
            });
        });

        await describe("get test results", async () => {
            await it("calls the correct endpoint", async (context) => {
                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            data: {
                                getTestExecution: {
                                    tests: {
                                        limit: 10,
                                        results: [
                                            {
                                                issueId: "12345",
                                                jira: {
                                                    key: "CYP-123",
                                                    summary: "included cucumber test",
                                                },
                                                status: {
                                                    color: "#95C160",
                                                    description: "The test run has passed",
                                                    final: true,
                                                    name: "PASSED",
                                                },
                                            },
                                            {
                                                issueId: "98765",
                                                jira: {
                                                    key: "CYP-456",
                                                    summary: "skipped cucumber test",
                                                },
                                                status: {
                                                    color: "#afa30b",
                                                    description:
                                                        "A custom skipped status for development purposes",
                                                    final: true,
                                                    name: "SKIPPED",
                                                },
                                            },
                                        ],
                                        start: 0,
                                        total: 2,
                                    },
                                },
                            },
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                await client.getTestResults("13436");

                assert.strictEqual(post.mock.callCount(), 1);
                assert.deepStrictEqual(
                    post.mock.calls[0].arguments[0],
                    "https://xray.cloud.getxray.app/api/v2/graphql"
                );
                assert.deepStrictEqual(post.mock.calls[0].arguments[1], {
                    query: dedent(`
                        query($issueId: String, $start: Int!, $limit: Int!) {
                            getTestExecution(issueId: $issueId) {
                                tests(start: $start, limit: $limit) {
                                    total
                                    start
                                    limit
                                    results {
                                        issueId
                                        status {
                                            name
                                        }
                                        jira(fields: ["key", "summary"])
                                    }
                                }
                            }
                        }`),
                    variables: { issueId: "13436", limit: 100, start: 0 },
                });
            });

            await it("handles successful responses", async (context) => {
                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            data: {
                                getTestExecution: {
                                    tests: {
                                        limit: 10,
                                        results: [
                                            {
                                                issueId: "12345",
                                                jira: {
                                                    key: "CYP-123",
                                                    summary: "included cucumber test",
                                                },
                                                status: {
                                                    color: "#95C160",
                                                    description: "The test run has passed",
                                                    final: true,
                                                    name: "PASSED",
                                                },
                                            },
                                            {
                                                issueId: "98765",
                                                jira: {
                                                    key: "CYP-456",
                                                    summary: "skipped cucumber test",
                                                },
                                                status: {
                                                    color: "#afa30b",
                                                    description:
                                                        "A custom skipped status for development purposes",
                                                    final: true,
                                                    name: "SKIPPED",
                                                },
                                            },
                                        ],
                                        start: 0,
                                        total: 2,
                                    },
                                },
                            },
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const response = await client.getTestResults("13436");
                assert.deepStrictEqual(response, [
                    {
                        issueId: "12345",
                        jira: {
                            key: "CYP-123",
                            summary: "included cucumber test",
                        },
                        status: {
                            color: "#95C160",
                            description: "The test run has passed",
                            final: true,
                            name: "PASSED",
                        },
                    },
                    {
                        issueId: "98765",
                        jira: {
                            key: "CYP-456",
                            summary: "skipped cucumber test",
                        },
                        status: {
                            color: "#afa30b",
                            description: "A custom skipped status for development purposes",
                            final: true,
                            name: "SKIPPED",
                        },
                    },
                ]);
            });

            await it("should paginate big requests", async (context) => {
                let i = 0;
                context.mock.method(restClient, "post", () => {
                    switch (i++) {
                        case 0:
                            return {
                                config: { headers: new AxiosHeaders() },
                                data: {
                                    data: {
                                        getTestExecution: {
                                            tests: {
                                                limit: 1,
                                                results: [
                                                    {
                                                        issueId: "12345",
                                                        jira: {
                                                            key: "CYP-123",
                                                            summary: "included cucumber test",
                                                        },
                                                        status: {
                                                            color: "#95C160",
                                                            description: "The test run has passed",
                                                            final: true,
                                                            name: "PASSED",
                                                        },
                                                    },
                                                ],
                                                start: 0,
                                                total: 3,
                                            },
                                        },
                                    },
                                },
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                        case 1:
                            return {
                                config: { headers: new AxiosHeaders() },
                                data: {
                                    data: {
                                        getTestExecution: {
                                            tests: {
                                                limit: 1,
                                                results: [
                                                    {
                                                        issueId: "98765",
                                                        jira: {
                                                            key: "CYP-456",
                                                            summary: "skipped cucumber test",
                                                        },
                                                        status: {
                                                            color: "#afa30b",
                                                            description:
                                                                "A custom skipped status for development purposes",
                                                            final: true,
                                                            name: "SKIPPED",
                                                        },
                                                    },
                                                ],
                                                start: 1,
                                                total: 3,
                                            },
                                        },
                                    },
                                },
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                        case 2:
                            return {
                                config: { headers: new AxiosHeaders() },
                                data: {
                                    data: {
                                        getTestExecution: {
                                            tests: {
                                                limit: 1,
                                                results: [
                                                    {
                                                        issueId: "54321",
                                                        jira: {
                                                            key: "CYP-111",
                                                            summary: "bonjour what's up",
                                                        },
                                                        status: {
                                                            color: "#95C160",
                                                            description: "The test run has passed",
                                                            final: true,
                                                            name: "PASSED",
                                                        },
                                                    },
                                                ],
                                                start: 2,
                                                total: 4,
                                            },
                                        },
                                    },
                                },
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                        case 3:
                            return {
                                config: { headers: new AxiosHeaders() },
                                data: {
                                    data: {
                                        getTestExecution: {
                                            tests: {
                                                limit: 1,
                                                start: 2,
                                            },
                                        },
                                    },
                                },
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                        case 4:
                            return {
                                config: { headers: new AxiosHeaders() },
                                data: {
                                    data: {
                                        getTestExecution: {
                                            tests: {
                                                limit: 1,
                                                results: [
                                                    {
                                                        issueId: "00000",
                                                        jira: {
                                                            key: "CYP-000",
                                                            summary: "missing status",
                                                        },
                                                    },
                                                ],
                                                start: "7",
                                                total: 3,
                                            },
                                        },
                                    },
                                },
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                    }
                });

                const response = await client.getTestResults("11111");
                assert.deepStrictEqual(response, [
                    {
                        issueId: "12345",
                        jira: {
                            key: "CYP-123",
                            summary: "included cucumber test",
                        },
                        status: {
                            color: "#95C160",
                            description: "The test run has passed",
                            final: true,
                            name: "PASSED",
                        },
                    },
                    {
                        issueId: "98765",
                        jira: {
                            key: "CYP-456",
                            summary: "skipped cucumber test",
                        },
                        status: {
                            color: "#afa30b",
                            description: "A custom skipped status for development purposes",
                            final: true,
                            name: "SKIPPED",
                        },
                    },
                    {
                        issueId: "54321",
                        jira: {
                            key: "CYP-111",
                            summary: "bonjour what's up",
                        },
                        status: {
                            color: "#95C160",
                            description: "The test run has passed",
                            final: true,
                            name: "PASSED",
                        },
                    },
                ]);
            });

            await it("should handle bad responses", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const logErrorToFile = context.mock.method(
                    LOG,
                    "logErrorToFile",
                    context.mock.fn()
                );

                const error = new AxiosError(
                    "Request failed with status code 400",
                    "400",
                    { headers: new AxiosHeaders() },
                    null,
                    {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            error: "Must provide a project key",
                        },
                        headers: {},
                        status: 400,
                        statusText: "Bad Request",
                    }
                );

                context.mock.method(restClient, "post", () => {
                    throw error;
                });

                await assert.rejects(client.getTestResults("13436"), {
                    message: "Failed to get test results",
                });
                assert.strictEqual(message.mock.callCount(), 2);
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.ERROR,
                    "Failed to get test results: Request failed with status code 400",
                ]);
                assert.strictEqual(logErrorToFile.mock.callCount(), 1);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "getTestResultsError",
                ]);
            });
        });
    });
});
