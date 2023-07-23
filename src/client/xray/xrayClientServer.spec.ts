import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import { expect } from "chai";
import dedent from "dedent";
import fs from "fs";
import { resolveTestDirPath, stubLogging, stubRequests } from "../../../test/util";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { JiraClientServer } from "../jira/jiraClientServer";
import { XrayClientServer } from "./xrayClientServer";

describe("the xray server client", () => {
    const client: XrayClientServer = new XrayClientServer(
        "https://example.org",
        new BasicAuthCredentials("user", "xyz"),
        new JiraClientServer("https://example.org", new BasicAuthCredentials("user", "xyz"))
    );

    describe("import execution", () => {
        it("should handle successful responses", async () => {
            const { stubbedPost } = stubRequests();
            const { stubbedInfo, stubbedSuccess } = stubLogging();
            stubbedPost.resolves({
                status: HttpStatusCode.Ok,
                data: {
                    testExecIssue: {
                        id: "12345",
                        key: "CYP-123",
                        self: "http://www.example.org/jira/rest/api/2/issue/12345",
                    },
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
            expect(stubbedInfo).to.have.been.calledWithExactly("Importing execution...");
            expect(stubbedSuccess).to.have.been.calledWithExactly(
                "Successfully uploaded test execution results to CYP-123."
            );
        });
    });

    describe("import execution cucumber multipart", () => {
        it("should handle successful responses", async () => {
            const { stubbedPost } = stubRequests();
            const { stubbedInfo, stubbedSuccess } = stubLogging();
            stubbedPost.resolves({
                status: HttpStatusCode.Ok,
                data: {
                    testExecIssue: {
                        id: "12345",
                        key: "CYP-123",
                        self: "http://www.example.org/jira/rest/api/2/issue/12345",
                    },
                },
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            const response = await client.importExecutionCucumberMultipart(
                JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                        "utf-8"
                    )
                ),
                JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoServer.json",
                        "utf-8"
                    )
                )
            );
            expect(response).to.eq("CYP-123");
            expect(stubbedInfo).to.have.been.calledWithExactly("Importing execution (Cucumber)...");
            expect(stubbedSuccess).to.have.been.calledWithExactly(
                "Successfully uploaded Cucumber test execution results to CYP-123."
            );
        });
    });

    describe("get test types", () => {
        it("should handle successful responses", async () => {
            const { stubbedInfo, stubbedSuccess } = stubLogging();
            const { stubbedGet, stubbedPost } = stubRequests();
            stubbedGet.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/jira/responses/getFields.json",
                        "utf-8"
                    )
                ),
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            stubbedPost.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync("./test/resources/fixtures/jira/responses/search.json", "utf-8")
                ),
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            const response = await client.getTestTypes("CYP", "CYP-237", "CYP-333", "CYP-338");
            expect(response["CYP-332"]).to.eq("Manual");
            expect(response["CYP-237"]).to.eq("Manual");
            expect(response["CYP-338"]).to.eq("Cucumber");
            expect(stubbedInfo).to.have.been.calledWithExactly("Retrieving test types...");
            expect(stubbedSuccess).to.have.been.calledWithExactly(
                "Successfully retrieved test types for 3 issues"
            );
        });

        it("should throw for missing test types", async () => {
            const { stubbedError } = stubLogging();
            const { stubbedGet, stubbedPost } = stubRequests();
            stubbedGet.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/jira/responses/getFields.json",
                        "utf-8"
                    )
                ),
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            stubbedPost.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync("./test/resources/fixtures/jira/responses/search.json", "utf-8")
                ),
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            const response = await client.getTestTypes("CYP", "CYP-12345", "CYP-333", "CYP-67890");
            expect(response).to.be.undefined;
            expect(stubbedError).to.have.been.calledTwice;
            expect(stubbedError).to.have.been.calledWith(
                dedent(`
                    Failed to get test types: Error: Failed to retrieve test types for issues:

                    CYP-12345
                    CYP-67890

                    Make sure these issues exist and are actually test issues
                `)
            );
        });

        it("should handle bad field responses", async () => {
            const { stubbedGet } = stubRequests();
            const { stubbedError } = stubLogging();
            stubbedGet.onFirstCall().rejects(
                new AxiosError("Request failed with status code 401", "401", null, null, {
                    status: 401,
                    statusText: "Bad Request",
                    config: { headers: new AxiosHeaders() },
                    headers: {},
                    data: {
                        error: "Unauthorized",
                    },
                })
            );
            const response = await client.getTestTypes("CYP", "CYP-330", "CYP-331", "CYP-332");
            expect(response).to.be.undefined;
            expect(stubbedError).to.have.callCount(4);
            expect(stubbedError.getCall(0)).to.have.been.calledWith(
                "Failed to get fields: AxiosError: Request failed with status code 401"
            );
            expect(stubbedError.getCall(1)).to.have.been.calledWith(
                `Complete error logs have been written to: ${resolveTestDirPath(
                    "getFieldsError.json"
                )}`
            );
            expect(stubbedError.getCall(2)).to.have.been.calledWith(
                "Failed to get test types: Error: Failed to fetch Jira fields"
            );
            expect(stubbedError.getCall(3)).to.have.been.calledWith(
                `Complete error logs have been written to: ${resolveTestDirPath(
                    "getTestTypesError.json"
                )}`
            );
        });

        it("should handle field responses without the test type field", async () => {
            const { stubbedGet } = stubRequests();
            const { stubbedError } = stubLogging();
            stubbedGet.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/jira/responses/getFieldsNoTestType.json",
                        "utf-8"
                    )
                ),
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            const response = await client.getTestTypes("CYP", "CYP-330", "CYP-331", "CYP-332");
            expect(response).to.be.undefined;
            expect(stubbedError).to.have.callCount(2);
            expect(stubbedError.getCall(0)).to.have.been.calledWith(
                "Failed to get test types: Error: Jira field does not exist: Test Type"
            );
            expect(stubbedError.getCall(1)).to.have.been.calledWith(
                `Complete error logs have been written to: ${resolveTestDirPath(
                    "getTestTypesError.json"
                )}`
            );
        });

        it("should handle bad search responses", async () => {
            const { stubbedGet, stubbedPost } = stubRequests();
            const { stubbedError } = stubLogging();
            stubbedGet.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/jira/responses/getFields.json",
                        "utf-8"
                    )
                ),
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
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
            expect(stubbedError).to.have.callCount(4);
            expect(stubbedError.getCall(0)).to.have.been.calledWith(
                "Failed to search issues: AxiosError: Request failed with status code 400"
            );
            let expectedPath = resolveTestDirPath("searchError.json");
            expect(stubbedError.getCall(1)).to.have.been.calledWith(
                `Complete error logs have been written to: ${expectedPath}`
            );
            expect(stubbedError.getCall(2)).to.have.been.calledWith(
                "Failed to get test types: Error: Successfully retrieved test type field data, but failed to search issues"
            );
            expectedPath = resolveTestDirPath("getTestTypesError.json");
            expect(stubbedError.getCall(3)).to.have.been.calledWith(
                `Complete error logs have been written to: ${expectedPath}`
            );
        });

        it("should handle search responses without fields", async () => {
            const { stubbedGet, stubbedPost } = stubRequests();
            const { stubbedError } = stubLogging();
            stubbedGet.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/jira/responses/getFields.json",
                        "utf-8"
                    )
                ),
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            stubbedPost.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/jira/responses/searchNoFields.json",
                        "utf-8"
                    )
                ),
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            const response = await client.getTestTypes("CYP", "CYP-333");
            expect(response).to.be.undefined;
            expect(stubbedError).to.have.been.calledTwice;
            expect(stubbedError).to.have.been.calledWith(
                dedent(`
                    Failed to get test types: Error: Failed to retrieve test types for issues:

                    CYP-333

                    Make sure these issues exist and are actually test issues
                `)
            );
        });

        it("should handle search responses with incorrect fields", async () => {
            const { stubbedGet, stubbedPost } = stubRequests();
            const { stubbedError } = stubLogging();
            stubbedGet.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/jira/responses/getFields.json",
                        "utf-8"
                    )
                ),
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            stubbedPost.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/jira/responses/searchIncorrectFields.json",
                        "utf-8"
                    )
                ),
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            const response = await client.getTestTypes("CYP", "CYP-123", "CYP-456");
            expect(response).to.be.undefined;
            expect(stubbedError).to.have.been.calledTwice;
            expect(stubbedError).to.have.been.calledWith(
                dedent(`
                    Failed to get test types: Error: Failed to retrieve test types for issues:

                    CYP-123
                    CYP-456

                    Make sure these issues exist and are actually test issues
                `)
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
