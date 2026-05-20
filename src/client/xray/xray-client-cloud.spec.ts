import axios, { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it, mock } from "node:test";
import type { XrayTestExecutionResults } from "../../models/xray/import-test-execution-results";
import type { CucumberMultipartFeature } from "../../models/xray/requests/import-execution-cucumber-multipart";
import type {
    MultipartInfo,
    MultipartInfoCloud,
} from "../../models/xray/requests/import-execution-multipart-info";
import { dedent } from "../../util/dedent";
import { LOG } from "../../util/logging";
import { JwtCredentials } from "../authentication/credentials";
import { AxiosRestClient } from "../https/requests";
import { XrayClientCloud } from "./xray-client-cloud";

void describe(relative(cwd(), __filename), () => {
    void describe(XrayClientCloud.name, () => {
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
            client = new XrayClientCloud("https://xray.cloud.getxray.app", credentials, restClient);
        });

        void describe("import execution", () => {
            void it("calls the correct endpoint", async (context) => {
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

            void it("should handle successful responses", async (context) => {
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

            void it("handles bad responses", async (context) => {
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
                    "error",
                    "Failed to import Cypress results: Request failed with status code 400",
                ]);
                assert.strictEqual(logErrorToFile.mock.callCount(), 1);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "importExecutionError",
                ]);
            });
        });

        void describe("import execution multipart", () => {
            void it("calls the correct endpoint", async (context) => {
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

            void it("handles successful responses", async (context) => {
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

            void it("handles bad responses", async (context) => {
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
                    "error",
                    "Failed to import Cypress results: Request failed with status code 400",
                ]);
                assert.strictEqual(logErrorToFile.mock.callCount(), 1);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "importExecutionMultipartError",
                ]);
            });
        });

        void describe("import execution cucumber multipart", () => {
            void it("calls the correct endpoint", async (context) => {
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

            void it("should handle successful responses", async (context) => {
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

            void it("handles bad responses", async (context) => {
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
                    "error",
                    "Failed to import Cucumber results: Request failed with status code 400",
                ]);
                assert.strictEqual(logErrorToFile.mock.callCount(), 1);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "importExecutionCucumberMultipartError",
                ]);
            });
        });

        void describe("import feature", () => {
            void it("calls the correct endpoint", async (context) => {
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

            void it("handles successful responses", async (context) => {
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

            void it("handles responses with errors", async (context) => {
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
                    "debug",
                    dedent(`
                        Encountered some errors during feature file import:
                        - Error in file taggedPrefixCorrect.feature: Precondition with key CYP-222 was not found!
                        - Error in file taggedPrefixCorrect.feature: Test with key CYP-333 was not found!
                    `),
                ]);
            });

            void it("handles responses without any updated issues", async (context) => {
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
                    "debug",
                    dedent(`
                        Encountered some errors during feature file import:
                        - Error in file taggedPrefixCorrect.feature: Precondition with key CYP-222 was not found!
                        - Error in file taggedPrefixCorrect.feature: Test with key CYP-333 was not found!
                        - Error in file taggedPrefixCorrect.feature: Test with key CYP-555 was not found!
                    `),
                ]);
            });

            void it("handles bad responses", async (context) => {
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
                    "error",
                    dedent(`
                        Failed to import Cucumber features: Request failed with status code 400

                          The prefixes in Cucumber background or scenario tags might not be consistent with the scheme defined in Xray.

                          For more information, visit:
                          - https://csvtuda.github.io/docs/cypress-xray-plugin/configuration/cucumber/#prefixes
                    `),
                ]);
                assert.strictEqual(logErrorToFile.mock.callCount(), 1);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "importFeatureError",
                ]);
            });

            void it("handles network failures", async (context) => {
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
                    "error",
                    "Failed to import Cucumber features: Connection timeout",
                ]);
                assert.strictEqual(logErrorToFile.mock.callCount(), 1);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "importFeatureError",
                ]);
            });
        });
    });
});
