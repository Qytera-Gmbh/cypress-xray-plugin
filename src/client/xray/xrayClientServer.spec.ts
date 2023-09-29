import { AxiosHeaders, HttpStatusCode } from "axios";
import { expect } from "chai";
import fs from "fs";
import { stubRequests } from "../../../test/util";
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
            stubbedPost.resolves({
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
