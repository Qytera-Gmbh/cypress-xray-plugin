/// <reference types="cypress" />

import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import { expect } from "chai";
import { readFileSync } from "fs";
import {
    RESOLVED_JWT_CREDENTIALS,
    resolveTestDirPath,
    stubLogging,
    stubRequests,
} from "../../../test/util";
import { XrayClientCloud } from "./xrayClientCloud";

describe("the xray cloud client", () => {
    const client: XrayClientCloud = new XrayClientCloud(RESOLVED_JWT_CREDENTIALS);

    describe("import execution", () => {
        it("should handle successful responses", async () => {
            const { stubbedPost } = stubRequests();
            const { stubbedInfo, stubbedSuccess } = stubLogging();
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
            expect(stubbedInfo).to.have.been.calledWithExactly("Importing execution...");
            expect(stubbedSuccess).to.have.been.calledWithExactly(
                "Successfully uploaded test execution results to CYP-123."
            );
        });
        it("should handle bad responses", async () => {
            const { stubbedPost } = stubRequests();
            const { stubbedInfo, stubbedError } = stubLogging();
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
            expect(stubbedInfo).to.have.been.calledWithExactly("Importing execution...");
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
            const { stubbedInfo, stubbedSuccess } = stubLogging();
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
                    readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                        "utf-8"
                    )
                ),
                JSON.parse(
                    readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoCloud.json",
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

        it("should handle bad responses", async () => {
            const { stubbedPost } = stubRequests();
            const { stubbedInfo, stubbedError } = stubLogging();
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
                    readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                        "utf-8"
                    )
                ),
                JSON.parse(
                    readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoCloud.json",
                        "utf-8"
                    )
                )
            );
            expect(response).to.be.undefined;
            expect(stubbedInfo).to.have.been.calledWithExactly("Importing execution (Cucumber)...");
            expect(stubbedError).to.have.been.calledWithExactly(
                "Failed to import Cucumber execution: AxiosError: Request failed with status code 400"
            );
            const expectedPath = resolveTestDirPath("importExecutionCucumberMultipartError.json");
            expect(stubbedError).to.have.been.calledWithExactly(
                `Complete error logs have been written to: ${expectedPath}`
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
