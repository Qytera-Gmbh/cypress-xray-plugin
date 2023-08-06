import { HttpStatusCode } from "axios";
import { expect } from "chai";
import fs from "fs";
import { stubLogging, stubRequests } from "../../../test/util";
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
        it("calls the correct url", async () => {
            const { stubbedPost } = stubRequests();
            stubLogging();
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
            await client.importExecution({ tests: [null] });
            expect(stubbedPost.getCall(0).args[0]).to.eq(
                "https://example.org/rest/raven/latest/import/execution"
            );
        });
        it("should handle successful responses", async () => {
            const { stubbedPost } = stubRequests();
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
        });
    });

    describe("import execution cucumber multipart", () => {
        it("calls the correct url", async () => {
            const { stubbedPost } = stubRequests();
            stubLogging();
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
            await client.importExecutionCucumberMultipart(
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
            expect(stubbedPost.getCall(0).args[0]).to.eq(
                "https://example.org/rest/raven/latest/import/execution/cucumber/multipart"
            );
        });
        it("should handle successful responses", async () => {
            const { stubbedPost } = stubRequests();
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
        });
    });

    describe("import feature", () => {
        it("calls the correct url", async () => {
            const { stubbedPost } = stubRequests();
            stubLogging();
            stubbedPost.onFirstCall().resolves({
                status: HttpStatusCode.Ok,
                data: {
                    updatedOrCreatedTests: [
                        {
                            id: "12345",
                            key: "CYP-123",
                            self: "http://www.example.org/jira/rest/api/2/issue/12345",
                        },
                    ],
                    updatedOrCreatedPreconditions: [],
                    errors: [],
                },
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            await client.importFeature("./test/resources/features/german.feature", "CYP");
            expect(stubbedPost.getCall(0).args[0]).to.eq(
                "https://example.org/rest/raven/latest/import/feature?projectKey=CYP"
            );
        });
    });
});
