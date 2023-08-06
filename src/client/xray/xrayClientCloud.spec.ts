import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import { expect } from "chai";
import fs from "fs";
import {
    RESOLVED_JWT_CREDENTIALS,
    resolveTestDirPath,
    stubLogging,
    stubRequests,
} from "../../../test/util";
import { GetTestsResponse } from "../../types/xray/responses/graphql/getTests";
import { dedent } from "../../util/dedent";
import { XrayClientCloud } from "./xrayClientCloud";

describe("the xray cloud client", () => {
    const client: XrayClientCloud = new XrayClientCloud(RESOLVED_JWT_CREDENTIALS);

    describe("import execution", () => {
        it("should handle successful responses", async () => {
            const { stubbedPost } = stubRequests();
            stubbedPost.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    id: "12345",
                    key: "CYP-123",
                    self: "http://www.example.org/jira/rest/api/2/issue/12345",
                },
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
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
        it("should handle bad responses", async () => {
            const { stubbedPost } = stubRequests();
            const { stubbedError } = stubLogging();
            stubbedPost.onFirstCall().rejects(
                new AxiosError("Request failed with status code 400", "400", null, null, {
                    status: 400,
                    statusText: "Bad Request",
                    config: { headers: new AxiosHeaders() },
                    headers: {},
                    data: {
                        error: "Must provide a project key",
                    },
                })
            );
            const response = await client.importExecution({
                testExecutionKey: "CYP-42",
                info: {
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
                ],
            });
            expect(response).to.be.undefined;
            expect(stubbedError).to.have.been.calledTwice;
            expect(stubbedError).to.have.been.calledWithExactly(
                "Failed to import execution: AxiosError: Request failed with status code 400"
            );
            const expectedPath = resolveTestDirPath("importExecutionError.json");
            expect(stubbedError).to.have.been.calledWithExactly(
                `Complete error logs have been written to: ${expectedPath}`
            );
        });
    });

    describe("import execution cucumber multipart", () => {
        it("should handle successful responses", async () => {
            const { stubbedPost } = stubRequests();
            stubbedPost.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    id: "12345",
                    key: "CYP-123",
                    self: "http://www.example.org/jira/rest/api/2/issue/12345",
                },
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            const response = await client.importExecutionCucumberMultipart(
                JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                        "utf-8"
                    )
                ),
                JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoCloud.json",
                        "utf-8"
                    )
                )
            );
            expect(response).to.eq("CYP-123");
        });

        it("should handle bad responses", async () => {
            const { stubbedPost } = stubRequests();
            const { stubbedError } = stubLogging();
            stubbedPost.onFirstCall().rejects(
                new AxiosError("Request failed with status code 400", "400", null, null, {
                    status: 400,
                    statusText: "Bad Request",
                    config: { headers: new AxiosHeaders() },
                    headers: {},
                    data: {
                        error: "There are no valid tests imported", // sic
                    },
                })
            );
            const response = await client.importExecutionCucumberMultipart(
                JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                        "utf-8"
                    )
                ),
                JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoCloud.json",
                        "utf-8"
                    )
                )
            );
            expect(response).to.be.undefined;
            expect(stubbedError).to.have.been.calledWithExactly(
                "Failed to import Cucumber execution: AxiosError: Request failed with status code 400"
            );
            const expectedPath = resolveTestDirPath("importExecutionCucumberMultipartError.json");
            expect(stubbedError).to.have.been.calledWithExactly(
                `Complete error logs have been written to: ${expectedPath}`
            );
        });
    });

    describe("get test types", () => {
        it("should handle successful responses", async () => {
            const { stubbedPost } = stubRequests();
            stubbedPost.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/xray/responses/getTestsTypes.json",
                        "utf-8"
                    )
                ),
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            const response = await client.getTestTypes("CYP", "CYP-330", "CYP-331", "CYP-332");
            expect(response).to.deep.eq({
                "CYP-330": "Generic",
                "CYP-331": "Cucumber",
                "CYP-332": "Manual",
            });
        });

        it("should paginate big requests", async () => {
            const { stubbedPost } = stubRequests();
            const mockedData: GetTestsResponse<unknown> = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/responses/getTestsTypes.json",
                    "utf-8"
                )
            );
            stubbedPost.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    data: {
                        getTests: {
                            ...mockedData.data.getTests,
                            results: mockedData.data.getTests.results.slice(0, 1),
                        },
                    },
                },
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            stubbedPost.onSecondCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    data: {
                        getTests: {
                            ...mockedData.data.getTests,
                            start: 1,
                            results: mockedData.data.getTests.results.slice(1, 2),
                        },
                    },
                },
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            stubbedPost.onThirdCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    data: {
                        getTests: {
                            ...mockedData.data.getTests,
                            start: 2,
                            results: mockedData.data.getTests.results.slice(2, 3),
                        },
                    },
                },
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            const response = await client.getTestTypes("CYP", "CYP-330", "CYP-331", "CYP-332");
            expect(response).to.deep.eq({
                "CYP-330": "Generic",
                "CYP-331": "Cucumber",
                "CYP-332": "Manual",
            });
        });

        it("should throw for missing test types", async () => {
            const { stubbedPost } = stubRequests();
            const { stubbedError } = stubLogging();
            const mockedData: GetTestsResponse<unknown> = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/responses/getTestsTypes.json",
                    "utf-8"
                )
            );
            stubbedPost.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    data: {
                        getTests: {
                            ...mockedData.data.getTests,
                            total: 1,
                            results: mockedData.data.getTests.results.slice(1, 2),
                        },
                    },
                },
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            const response = await client.getTestTypes("CYP", "CYP-330", "CYP-331", "CYP-332");
            expect(response).to.be.undefined;
            expect(stubbedError).to.have.been.calledTwice;
            expect(stubbedError).to.have.been.calledWith(
                dedent(`
                    Failed to get test types: Error: Failed to retrieve test types for issues:

                      CYP-331
                      CYP-332

                    Make sure these issues exist and are actually test issues
                `)
            );
        });

        it("should handle bad responses", async () => {
            const { stubbedPost } = stubRequests();
            const { stubbedError } = stubLogging();
            stubbedPost.onFirstCall().rejects(
                new AxiosError("Request failed with status code 400", "400", null, null, {
                    status: 400,
                    statusText: "Bad Request",
                    config: { headers: new AxiosHeaders() },
                    headers: {},
                    data: {
                        error: "Must provide a project key",
                    },
                })
            );
            const response = await client.getTestTypes("CYP", "CYP-330", "CYP-331", "CYP-332");
            expect(response).to.be.undefined;
            expect(stubbedError).to.have.been.calledTwice;
            expect(stubbedError).to.have.been.calledWith(
                "Failed to get test types: AxiosError: Request failed with status code 400"
            );
            const expectedPath = resolveTestDirPath("getTestTypes.json");
            expect(stubbedError).to.have.been.calledWithExactly(
                `Complete error logs have been written to: ${expectedPath}`
            );
        });

        it("should skip empty issues", async () => {
            const { stubbedWarning } = stubLogging();
            const response = await client.getTestTypes("CYP");
            expect(response).to.be.null;
            expect(stubbedWarning).to.have.been.calledWithExactly(
                "No issue keys provided. Skipping test type retrieval"
            );
        });
    });

    describe("the urls", () => {
        describe("export cucumber", () => {
            it("keys", () => {
                expect(client.getUrlExportCucumber(["CYP-123", "CYP-456"])).to.eq(
                    "https://xray.cloud.getxray.app/api/v2/export/cucumber?keys=CYP-123;CYP-456"
                );
            });
            it("filter", () => {
                expect(client.getUrlExportCucumber(undefined, 56)).to.eq(
                    "https://xray.cloud.getxray.app/api/v2/export/cucumber?filter=56"
                );
            });
            it("keys and filter", () => {
                expect(client.getUrlExportCucumber(["CYP-123", "CYP-456"], 56)).to.eq(
                    "https://xray.cloud.getxray.app/api/v2/export/cucumber?keys=CYP-123;CYP-456&filter=56"
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
                "https://xray.cloud.getxray.app/api/v2/import/execution"
            );
        });
        it("import feature", () => {
            expect(client.getUrlImportFeature("CYP")).to.eq(
                "https://xray.cloud.getxray.app/api/v2/import/feature?projectKey=CYP"
            );
        });
    });
});
