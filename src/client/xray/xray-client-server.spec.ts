import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import { expect } from "chai";
import fs from "fs";
import path from "node:path";
import { SinonStubbedInstance } from "sinon";
import { getMockedLogger, getMockedRestClient } from "../../../test/mocks";
import { XrayTestExecutionResults } from "../../types/xray/import-test-execution-results";
import { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import { MultipartInfo } from "../../types/xray/requests/import-execution-multipart-info";
import { dedent } from "../../util/dedent";
import { Level } from "../../util/logging";
import { BasicAuthCredentials } from "../authentication/credentials";
import { AxiosRestClient } from "../https/requests";
import { ServerClient, XrayClientServer } from "./xray-client-server";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ServerClient.name, () => {
        let restClient: SinonStubbedInstance<AxiosRestClient>;
        let client: XrayClientServer;

        beforeEach(() => {
            restClient = getMockedRestClient();
            client = new ServerClient(
                "https://example.org",
                new BasicAuthCredentials("user", "xyz"),
                restClient
            );
        });

        describe("import execution", () => {
            it("calls the correct endpoint", async () => {
                getMockedLogger();
                restClient.post.resolves({
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
                expect(restClient.post).to.have.been.calledOnceWith(
                    "https://example.org/rest/raven/latest/import/execution"
                );
            });

            it("should handle successful responses", async () => {
                getMockedLogger();
                restClient.post.resolves({
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
                expect(response).to.eq("CYP-123");
            });
        });

        describe("import execution multipart", () => {
            it("calls the correct endpoint", async () => {
                getMockedLogger();
                restClient.post.resolves({
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
                });
                await client.importExecutionMultipart(
                    JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionMultipartResultsServer.json",
                            "utf-8"
                        )
                    ) as XrayTestExecutionResults,
                    JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionMultipartInfoServer.json",
                            "utf-8"
                        )
                    ) as MultipartInfo
                );
                expect(restClient.post).to.have.been.calledOnceWith(
                    "https://example.org/rest/raven/latest/import/execution/multipart"
                );
            });

            it("handles successful responses", async () => {
                getMockedLogger();
                restClient.post.resolves({
                    config: { headers: new AxiosHeaders() },
                    data: {
                        infoMessages: [],
                        testExecIssue: {
                            id: "24556",
                            key: "CYPLUG-123",
                            self: "https://example.org/rest/api/2/issue/24556",
                        },
                        testIssues: {
                            success: [
                                {
                                    id: "22979",
                                    key: "CYPLUG-43",
                                    self: "https://example.org/rest/api/2/issue/22979",
                                    testVersionId: 430,
                                },
                                {
                                    id: "22946",
                                    key: "CYPLUG-10",
                                    self: "https://example.org/rest/api/2/issue/22946",
                                    testVersionId: 425,
                                },
                            ],
                        },
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                const response = await client.importExecutionMultipart(
                    JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionMultipartResultsServer.json",
                            "utf-8"
                        )
                    ) as XrayTestExecutionResults,
                    JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionMultipartInfoServer.json",
                            "utf-8"
                        )
                    ) as MultipartInfo
                );
                expect(response).to.eq("CYPLUG-123");
            });
        });

        describe("import execution cucumber multipart", () => {
            it("calls the correct endpoint", async () => {
                getMockedLogger();
                restClient.post.resolves({
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
                });
                await client.importExecutionCucumberMultipart(
                    JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                            "utf-8"
                        )
                    ) as CucumberMultipartFeature[],
                    JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoServer.json",
                            "utf-8"
                        )
                    ) as MultipartInfo
                );
                expect(restClient.post).to.have.been.calledOnceWith(
                    "https://example.org/rest/raven/latest/import/execution/cucumber/multipart"
                );
            });

            it("should handle successful responses", async () => {
                getMockedLogger();
                restClient.post.resolves({
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
                });
                const response = await client.importExecutionCucumberMultipart(
                    JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                            "utf-8"
                        )
                    ) as CucumberMultipartFeature[],
                    JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoServer.json",
                            "utf-8"
                        )
                    ) as MultipartInfo
                );
                expect(response).to.eq("CYP-123");
            });
        });

        describe("import feature", () => {
            it("calls the correct endpoint", async () => {
                restClient.post.onFirstCall().resolves({
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
                });
                await client.importFeature(
                    "./test/resources/features/taggedPrefixCorrect.feature",
                    { projectKey: "CYP" }
                );
                expect(restClient.post).to.have.been.calledOnceWith(
                    "https://example.org/rest/raven/latest/import/feature?projectKey=CYP"
                );
            });

            it("handles successful responses", async () => {
                restClient.post.onFirstCall().resolves({
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
                });
                const response = await client.importFeature(
                    "./test/resources/features/taggedPrefixCorrect.feature",
                    { projectKey: "CYP" }
                );
                expect(response).to.deep.eq({
                    errors: [],
                    updatedOrCreatedIssues: ["CYP-333", "CYP-555", "CYP-222"],
                });
            });

            it("handles responses with errors", async () => {
                const logger = getMockedLogger({ allowUnstubbedCalls: true });
                restClient.post.onFirstCall().resolves({
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
                });
                const response = await client.importFeature(
                    "./test/resources/features/taggedPrefixCorrect.feature",
                    { projectKey: "CYP" }
                );
                expect(response).to.deep.eq({
                    errors: ["Test with key CYP-333 was not found!"],
                    updatedOrCreatedIssues: ["CYP-555", "CYP-222"],
                });
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.DEBUG,
                    "Encountered an error during feature file import: Test with key CYP-333 was not found!"
                );
            });

            it("handles responses with empty messages", async () => {
                restClient.post.onFirstCall().resolves({
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
                });
                const response = await client.importFeature(
                    "./test/resources/features/taggedPrefixCorrect.feature",
                    { projectKey: "CYP" }
                );
                expect(response).to.deep.eq({
                    errors: [],
                    updatedOrCreatedIssues: ["CYP-555", "CYP-222"],
                });
            });

            it("handles responses without any updated issues", async () => {
                const logger = getMockedLogger({ allowUnstubbedCalls: true });
                restClient.post.onFirstCall().resolves({
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
                });
                const response = await client.importFeature(
                    "./test/resources/features/taggedPrefixCorrect.feature",
                    { projectKey: "CYP" }
                );
                expect(response).to.deep.eq({
                    errors: [
                        "Test with key CYP-333 was not found!\nTest with key CYP-555 was not found!\nPrecondition with key CYP-222 was not found!",
                    ],
                    updatedOrCreatedIssues: [],
                });
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.DEBUG,
                    "Encountered an error during feature file import: Test with key CYP-333 was not found!\nTest with key CYP-555 was not found!\nPrecondition with key CYP-222 was not found!"
                );
            });

            it("handles bad responses", async () => {
                const logger = getMockedLogger({ allowUnstubbedCalls: true });
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
                restClient.post.onFirstCall().rejects(error);
                await expect(
                    client.importFeature("./test/resources/features/taggedPrefixCorrect.feature", {
                        projectKey: "CYP",
                    })
                ).to.eventually.be.rejectedWith("Feature file import failed");
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.ERROR,
                    dedent(`
                        Failed to import Cucumber features: Request failed with status code 400

                          The prefixes in Cucumber background or scenario tags might not be consistent with the scheme defined in Xray.

                          For more information, visit:
                          - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                    `)
                );
                expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                    error,
                    "importFeatureError"
                );
            });

            it("handles network failures", async () => {
                const logger = getMockedLogger({ allowUnstubbedCalls: true });
                const error = new Error("Connection timeout");
                restClient.post.onFirstCall().rejects(error);
                await expect(
                    client.importFeature("./test/resources/features/taggedPrefixCorrect.feature", {
                        projectKey: "CYP",
                    })
                ).to.eventually.be.rejectedWith("Feature file import failed");
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.ERROR,
                    "Failed to import Cucumber features: Connection timeout"
                );
                expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                    error,
                    "importFeatureError"
                );
            });
        });

        describe("get test execution", () => {
            it("returns tests", async () => {
                getMockedLogger();
                restClient.get.onFirstCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: [
                        {
                            archived: false,
                            id: 9284,
                            key: "CYP-123",
                            rank: 1,
                            status: "PASS",
                        },
                        {
                            archived: false,
                            id: 9285,
                            key: "CYP-456",
                            rank: 2,
                            status: "TODO",
                        },
                    ],
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                restClient.get.onSecondCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: [],
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                const response = await client.getTestExecution("CYP-321");
                expect(response).to.deep.eq([
                    {
                        archived: false,
                        id: 9284,
                        key: "CYP-123",
                        rank: 1,
                        status: "PASS",
                    },
                    {
                        archived: false,
                        id: 9285,
                        key: "CYP-456",
                        rank: 2,
                        status: "TODO",
                    },
                ]);
                expect(restClient.get).to.have.been.calledWithExactly(
                    "https://example.org/rest/raven/latest/api/testexec/CYP-321/test",
                    {
                        headers: { ["Authorization"]: "Basic dXNlcjp4eXo=" },
                        params: {
                            detailed: undefined,
                            limit: undefined,
                            page: 1,
                        },
                    }
                );
                expect(restClient.get).to.have.been.calledWithExactly(
                    "https://example.org/rest/raven/latest/api/testexec/CYP-321/test",
                    {
                        headers: { ["Authorization"]: "Basic dXNlcjp4eXo=" },
                        params: {
                            detailed: undefined,
                            limit: undefined,
                            page: 2,
                        },
                    }
                );
            });

            it("handles bad responses", async () => {
                const logger = getMockedLogger({ allowUnstubbedCalls: true });
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
                restClient.get.onFirstCall().rejects(error);
                await expect(client.getTestExecution("CYP-321")).to.eventually.be.rejectedWith(
                    "Failed to get test execution"
                );
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.ERROR,
                    dedent(`
                        Failed to get test execution: Request failed with status code 400
                    `)
                );
                expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                    error,
                    "getTestExecutionError"
                );
            });
        });

        describe("get xray license", () => {
            it("returns the license", async () => {
                restClient.get.resolves({
                    config: { headers: new AxiosHeaders() },
                    data: {
                        active: true,
                        licenseType: "Demo License",
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                const response = await client.getXrayLicense();
                expect(response).to.deep.eq({
                    active: true,
                    licenseType: "Demo License",
                });
                expect(restClient.get).to.have.been.calledOnceWithExactly(
                    "https://example.org/rest/raven/latest/api/xraylicense",
                    {
                        headers: { ["Authorization"]: "Basic dXNlcjp4eXo=" },
                    }
                );
            });

            it("handles bad responses", async () => {
                const logger = getMockedLogger({ allowUnstubbedCalls: true });
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
                restClient.get.onFirstCall().rejects(error);
                await expect(client.getXrayLicense()).to.eventually.be.rejectedWith(
                    "Failed to get Xray license"
                );
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.ERROR,
                    dedent(`
                        Failed to get Xray license: Request failed with status code 400
                    `)
                );
                expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                    error,
                    "getXrayLicenseError"
                );
            });
        });
    });
});
