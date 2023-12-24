import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import { expect } from "chai";
import fs from "fs";
import { SinonStubbedInstance } from "sinon";
import { getMockedLogger, getMockedRestClient } from "../../../test/mocks";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { AxiosRestClient } from "../../https/requests";
import { Level } from "../../logging/logging";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { ICucumberMultipartInfo } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { dedent } from "../../util/dedent";
import { XrayClientServer } from "./xrayClientServer";

describe("the xray server client", () => {
    const client: XrayClientServer = new XrayClientServer(
        "https://example.org",
        new BasicAuthCredentials("user", "xyz")
    );
    let restClient: SinonStubbedInstance<AxiosRestClient>;

    beforeEach(() => {
        restClient = getMockedRestClient();
    });

    describe("import execution", () => {
        it("should handle successful responses", async () => {
            restClient.post.resolves({
                status: HttpStatusCode.Ok,
                data: {
                    testExecIssue: {
                        id: "12345",
                        key: "CYP-123",
                        self: "http://www.example.org/jira/rest/api/2/issue/12345",
                    },
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
            const response = await client.importExecution({
                testExecutionKey: "CYP-42",
                info: {
                    project: "CYP",
                    startDate: "2022-11-28T17:41:12Z",
                    finishDate: "2022-11-28T17:41:19Z",
                    description: "Cypress version: 11.1.0 Browser: electron (106.0.5249.51)",
                    summary: "Test Execution Here",
                },
                tests: [
                    {
                        start: "2022-11-28T17:41:15Z",
                        finish: "2022-11-28T17:41:15Z",
                        status: "PASSED",
                    },
                    {
                        start: "2022-11-28T17:41:15Z",
                        finish: "2022-11-28T17:41:15Z",
                        status: "PASSED",
                    },
                    {
                        start: "2022-11-28T17:41:15Z",
                        finish: "2022-11-28T17:41:19Z",
                        status: "FAILED",
                    },
                ],
            });
            expect(response).to.eq("CYP-123");
        });
    });

    describe("import execution cucumber multipart", () => {
        it("should handle successful responses", async () => {
            restClient.post.resolves({
                status: HttpStatusCode.Ok,
                data: {
                    testExecIssue: {
                        id: "12345",
                        key: "CYP-123",
                        self: "http://www.example.org/jira/rest/api/2/issue/12345",
                    },
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
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
                ) as ICucumberMultipartInfo
            );
            expect(response).to.eq("CYP-123");
        });
    });

    describe("import feature", () => {
        it("handles successful responses", async () => {
            restClient.post.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: [
                    {
                        id: "14400",
                        key: "CYP-333",
                        self: "http://localhost:8727/rest/api/2/issue/14400",
                        issueType: {
                            id: "10100",
                            name: "Test",
                        },
                    },
                    {
                        id: "14401",
                        key: "CYP-555",
                        self: "http://localhost:8727/rest/api/2/issue/14401",
                        issueType: {
                            id: "10103",
                            name: "Test",
                        },
                    },
                    {
                        id: "14401",
                        key: "CYP-222",
                        self: "http://localhost:8727/rest/api/2/issue/14401",
                        issueType: {
                            id: "10103",
                            name: "Pre-Condition",
                        },
                    },
                ],
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
            const response = await client.importFeature(
                "./test/resources/features/taggedPrefixCorrect.feature",
                "utf-8",
                "CYP"
            );
            expect(response).to.deep.eq({
                errors: [],
                updatedOrCreatedIssues: ["CYP-333", "CYP-555", "CYP-222"],
            });
        });

        it("handles responses with errors", async () => {
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            restClient.post.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    message: "Test with key CYP-333 was not found!",
                    testIssues: [
                        {
                            id: "14401",
                            key: "CYP-555",
                            self: "http://localhost:8727/rest/api/2/issue/14401",
                            issueType: {
                                id: "10103",
                                name: "Test",
                            },
                        },
                    ],
                    preconditionIssues: [
                        {
                            id: "14401",
                            key: "CYP-222",
                            self: "http://localhost:8727/rest/api/2/issue/14401",
                            issueType: {
                                id: "10103",
                                name: "Pre-Condition",
                            },
                        },
                    ],
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
            const response = await client.importFeature(
                "./test/resources/features/taggedPrefixCorrect.feature",
                "utf-8",
                "CYP"
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

        it("handles responses without any updated issues", async () => {
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            restClient.post.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    message:
                        "Test with key CYP-333 was not found!\nTest with key CYP-555 was not found!\nPrecondition with key CYP-222 was not found!",
                    testIssues: [],
                    preconditionIssues: [],
                },
                headers: {},
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: { headers: new AxiosHeaders() },
            });
            const response = await client.importFeature(
                "./test/resources/features/taggedPrefixCorrect.feature",
                "utf-8",
                "CYP"
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
                    status: 400,
                    statusText: "Bad Request",
                    config: { headers: new AxiosHeaders() },
                    headers: {},
                    data: {
                        error: "There are no valid tests imported", // sic
                    },
                }
            );
            restClient.post.onFirstCall().rejects(error);
            await expect(
                client.importFeature(
                    "./test/resources/features/taggedPrefixCorrect.feature",
                    "utf-8",
                    "CYP"
                )
            ).to.eventually.be.rejectedWith("Feature file import failed");
            expect(logger.message).to.have.been.calledWithExactly(
                Level.ERROR,
                dedent(`
                    Failed to import Cucumber features: Request failed with status code 400

                    The prefixes in Cucumber background or scenario tags might be inconsistent with the scheme defined in Xray

                    For more information, visit:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                `)
            );
            expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                error,
                "importFeatureError"
            );
        });
    });

    describe("the urls", () => {
        describe("export cucumber", () => {
            it("keys", () => {
                expect(client.getUrlExportCucumber(["CYP-123", "CYP-456"])).to.eq(
                    "https://example.org/rest/raven/latest/export/test?keys=CYP-123;CYP-456&fz=true"
                );
            });
            it("filter", () => {
                expect(client.getUrlExportCucumber(undefined, 56)).to.eq(
                    "https://example.org/rest/raven/latest/export/test?filter=56&fz=true"
                );
            });
            it("keys and filter", () => {
                expect(client.getUrlExportCucumber(["CYP-123", "CYP-456"], 56)).to.eq(
                    "https://example.org/rest/raven/latest/export/test?keys=CYP-123;CYP-456&filter=56&fz=true"
                );
            });
            it("neither keys nor filter", () => {
                expect(() => client.getUrlExportCucumber()).to.throw(
                    "One of issueKeys or filter must be provided to export feature files"
                );
            });
        });
        it("import execution", () => {
            expect(client.getUrlImportExecution()).to.eq(
                "https://example.org/rest/raven/latest/import/execution"
            );
        });
        it("import feature", () => {
            expect(client.getUrlImportFeature("CYP")).to.eq(
                "https://example.org/rest/raven/latest/import/feature?projectKey=CYP"
            );
        });
    });
});
