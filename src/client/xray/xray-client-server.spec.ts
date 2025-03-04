import axios, { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import type { XrayTestExecutionResults } from "../../types/xray/import-test-execution-results";
import type { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import type { MultipartInfo } from "../../types/xray/requests/import-execution-multipart-info";
import { dedent } from "../../util/dedent";
import { LOG } from "../../util/logging";
import { PatCredentials } from "../authentication/credentials";
import { AxiosRestClient } from "../https/requests";
import type { XrayClientServer } from "./xray-client-server";
import { ServerClient } from "./xray-client-server";

describe(relative(cwd(), __filename), async () => {
    await describe(ServerClient.name, async () => {
        let client: XrayClientServer;
        let restClient: AxiosRestClient;

        beforeEach(() => {
            restClient = new AxiosRestClient(axios);
            client = new ServerClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                restClient
            );
        });

        await describe("add evidence", async () => {
            await it("calls the correct endpoint", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                await client.addEvidence(12345, {
                    contentType: "text/plain",
                    data: Buffer.from("hello world").toString("base64"),
                    filename: "evidence.txt",
                });

                assert.strictEqual(post.mock.calls.length, 1);
                assert.strictEqual(
                    post.mock.calls[0].arguments[0],
                    "http://localhost:1234/rest/raven/latest/api/testrun/12345/attachment"
                );
            });
        });

        await describe("import execution", async () => {
            await it("calls the correct endpoint", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            testExecIssue: {
                                id: "12345",
                                key: "CYP-123",
                                self: "http://www.example.org/jira/rest/api/2/issue/12345",
                            },
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
                    "http://localhost:1234/rest/raven/latest/import/execution"
                );
            });

            await it("should handle successful responses", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            testExecIssue: {
                                id: "12345",
                                key: "CYP-123",
                                self: "http://www.example.org/jira/rest/api/2/issue/12345",
                            },
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
        });

        await describe("import execution multipart", async () => {
            await it("calls the correct endpoint", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            testExecIssue: {
                                id: "12345",
                                key: "CYP-123",
                                self: "http://www.example.org/jira/rest/api/2/issue/12345",
                            },
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                await client.importExecutionMultipart(
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionMultipartResultsServer.json",
                            "utf-8"
                        )
                    ) as XrayTestExecutionResults,
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionMultipartInfoServer.json",
                            "utf-8"
                        )
                    ) as MultipartInfo
                );

                assert.strictEqual(post.mock.calls.length, 1);
                assert.strictEqual(
                    post.mock.calls[0].arguments[0],
                    "http://localhost:1234/rest/raven/latest/import/execution/multipart"
                );
            });

            await it("handles successful responses", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            infoMessages: [],
                            testExecIssue: {
                                id: "24556",
                                key: "CYPLUG-123",
                                self: "http://localhost:1234/rest/api/2/issue/24556",
                            },
                            testIssues: {
                                success: [
                                    {
                                        id: "22979",
                                        key: "CYPLUG-43",
                                        self: "http://localhost:1234/rest/api/2/issue/22979",
                                        testVersionId: 430,
                                    },
                                    {
                                        id: "22946",
                                        key: "CYPLUG-10",
                                        self: "http://localhost:1234/rest/api/2/issue/22946",
                                        testVersionId: 425,
                                    },
                                ],
                            },
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                const response = await client.importExecutionMultipart(
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionMultipartResultsServer.json",
                            "utf-8"
                        )
                    ) as XrayTestExecutionResults,
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionMultipartInfoServer.json",
                            "utf-8"
                        )
                    ) as MultipartInfo
                );

                assert.strictEqual(response, "CYPLUG-123");
            });
        });

        await describe("import execution cucumber multipart", async () => {
            await it("calls the correct endpoint", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            testExecIssue: {
                                id: "12345",
                                key: "CYP-123",
                                self: "http://www.example.org/jira/rest/api/2/issue/12345",
                            },
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                await client.importExecutionCucumberMultipart(
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                            "utf-8"
                        )
                    ) as CucumberMultipartFeature[],
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoServer.json",
                            "utf-8"
                        )
                    ) as MultipartInfo
                );

                assert.strictEqual(post.mock.calls.length, 1);
                assert.strictEqual(
                    post.mock.calls[0].arguments[0],
                    "http://localhost:1234/rest/raven/latest/import/execution/cucumber/multipart"
                );
            });

            await it("should handle successful responses", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            testExecIssue: {
                                id: "12345",
                                key: "CYP-123",
                                self: "http://www.example.org/jira/rest/api/2/issue/12345",
                            },
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });

                const response = await client.importExecutionCucumberMultipart(
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                            "utf-8"
                        )
                    ) as CucumberMultipartFeature[],
                    JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoServer.json",
                            "utf-8"
                        )
                    ) as MultipartInfo
                );

                assert.strictEqual(response, "CYP-123");
            });
        });

        await describe("import feature", async () => {
            await it("calls the correct endpoint", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: [
                            {
                                id: "14400",
                                issueType: {
                                    id: "10100",
                                    name: "Test",
                                },
                                key: "CYP-333",
                                self: "http://localhost:8727/rest/api/2/issue/14400",
                            },
                            {
                                id: "14401",
                                issueType: {
                                    id: "10103",
                                    name: "Test",
                                },
                                key: "CYP-555",
                                self: "http://localhost:8727/rest/api/2/issue/14401",
                            },
                            {
                                id: "14401",
                                issueType: {
                                    id: "10103",
                                    name: "Pre-Condition",
                                },
                                key: "CYP-222",
                                self: "http://localhost:8727/rest/api/2/issue/14401",
                            },
                        ],
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
                    "http://localhost:1234/rest/raven/latest/import/feature?projectKey=CYP"
                );
            });

            await it("handles successful responses", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: [
                            {
                                id: "14400",
                                issueType: {
                                    id: "10100",
                                    name: "Test",
                                },
                                key: "CYP-333",
                                self: "http://localhost:8727/rest/api/2/issue/14400",
                            },
                            {
                                id: "14401",
                                issueType: {
                                    id: "10103",
                                    name: "Test",
                                },
                                key: "CYP-555",
                                self: "http://localhost:8727/rest/api/2/issue/14401",
                            },
                            {
                                id: "14401",
                                issueType: {
                                    id: "10103",
                                    name: "Pre-Condition",
                                },
                                key: "CYP-222",
                                self: "http://localhost:8727/rest/api/2/issue/14401",
                            },
                        ],
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

                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            message: "Test with key CYP-333 was not found!",
                            preconditionIssues: [
                                {
                                    id: "14401",
                                    issueType: {
                                        id: "10103",
                                        name: "Pre-Condition",
                                    },
                                    key: "CYP-222",
                                    self: "http://localhost:8727/rest/api/2/issue/14401",
                                },
                            ],
                            testIssues: [
                                {
                                    id: "14401",
                                    issueType: {
                                        id: "10103",
                                        name: "Test",
                                    },
                                    key: "CYP-555",
                                    self: "http://localhost:8727/rest/api/2/issue/14401",
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

                assert.strictEqual(message.mock.callCount(), 4);
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    "debug",
                    "Encountered an error during feature file import: Test with key CYP-333 was not found!",
                ]);
                assert.deepStrictEqual(response, {
                    errors: ["Test with key CYP-333 was not found!"],
                    updatedOrCreatedIssues: ["CYP-555", "CYP-222"],
                });
            });

            await it("handles responses with empty messages", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            preconditionIssues: [
                                {
                                    id: "14401",
                                    issueType: {
                                        id: "10103",
                                        name: "Pre-Condition",
                                    },
                                    key: "CYP-222",
                                    self: "http://localhost:8727/rest/api/2/issue/14401",
                                },
                            ],
                            testIssues: [
                                {
                                    id: "14401",
                                    issueType: {
                                        id: "10103",
                                        name: "Test",
                                    },
                                    key: "CYP-555",
                                    self: "http://localhost:8727/rest/api/2/issue/14401",
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
                    updatedOrCreatedIssues: ["CYP-555", "CYP-222"],
                });
            });

            await it("handles responses without any updated issues", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());

                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            message:
                                "Test with key CYP-333 was not found!\nTest with key CYP-555 was not found!\nPrecondition with key CYP-222 was not found!",
                            preconditionIssues: [],
                            testIssues: [],
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
                    errors: [
                        "Test with key CYP-333 was not found!\nTest with key CYP-555 was not found!\nPrecondition with key CYP-222 was not found!",
                    ],
                    updatedOrCreatedIssues: [],
                });
                assert.strictEqual(message.mock.callCount(), 2);
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    "debug",
                    "Encountered an error during feature file import: Test with key CYP-333 was not found!\nTest with key CYP-555 was not found!\nPrecondition with key CYP-222 was not found!",
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
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    "error",
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

        await describe("get xray license", async () => {
            await it("returns the license", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());

                const get = context.mock.method(restClient, "get", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            active: true,
                            licenseType: "Demo License",
                        },
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const response = await client.getXrayLicense();

                assert.deepStrictEqual(response, {
                    active: true,
                    licenseType: "Demo License",
                });
                assert.deepStrictEqual(get.mock.calls[0].arguments, [
                    "http://localhost:1234/rest/raven/latest/api/xraylicense",
                    {
                        headers: { ["Authorization"]: "Bearer token" },
                    },
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
                        data: "Xray app not configured",
                        headers: {},
                        status: 400,
                        statusText: "Bad Request",
                    }
                );

                context.mock.method(restClient, "get", () => {
                    throw error;
                });

                await assert.rejects(client.getXrayLicense(), {
                    message: "Failed to get Xray license",
                });
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    "error",
                    dedent(`
                        Failed to get Xray license: Request failed with status code 400
                    `),
                ]);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "getXrayLicenseError",
                ]);
            });
        });
    });
});
