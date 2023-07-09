/// <reference types="cypress" />

import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import { expect } from "chai";
import fs from "fs";
import { expectToExist, stubLogging, stubRequests } from "../../../test/util";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { JiraClientCloud } from "./jiraClientCloud";

describe("the Jira Cloud client", () => {
    // The concrete client implementation does not matter here. The methods here only test the
    // abstract base class's code.
    const client: JiraClientCloud = new JiraClientCloud(
        "https://example.org",
        new BasicAuthCredentials("user", "token")
    );

    describe("add attachment", () => {
        it("should use the correct headers", async () => {
            stubLogging();
            const { stubbedPost } = stubRequests();
            stubbedPost.resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/jira/responses/singleAttachment.json",
                        "utf-8"
                    )
                ),
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            await client.addAttachment("CYP-123", "./test/resources/turtle.png");
            const headers = stubbedPost.getCalls()[0].args[2]?.headers;
            expectToExist(headers);
            expect(headers?.Authorization).to.eq("Basic dXNlcjp0b2tlbg==");
            expect(headers["X-Atlassian-Token"]).to.eq("no-check");
            expect(headers["content-type"]).to.match(/multipart\/form-data; .+/);
        });

        describe("single file attachment", () => {
            it("logs correct messages", async () => {
                const { stubbedInfo, stubbedSuccess } = stubLogging();
                const { stubbedPost } = stubRequests();
                stubbedPost.resolves({
                    status: HttpStatusCode.Ok,
                    data: JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/jira/responses/singleAttachment.json",
                            "utf-8"
                        )
                    ),
                    headers: null,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                    config: null,
                });
                await client.addAttachment("CYP-123", "./test/resources/turtle.png");
                expect(stubbedInfo).to.have.been.calledWithExactly(
                    "Attaching files:",
                    "./test/resources/turtle.png"
                );
                expect(stubbedSuccess).to.have.been.calledOnceWithExactly(
                    "Successfully attached files to issue CYP-123:",
                    "turtle.png"
                );
            });
            it("returns the correct values", async () => {
                stubLogging();
                const { stubbedPost } = stubRequests();
                const mockedData = JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/jira/responses/singleAttachment.json",
                        "utf-8"
                    )
                );
                stubbedPost.resolves({
                    status: HttpStatusCode.Ok,
                    data: mockedData,
                    headers: null,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                    config: null,
                });
                const response = await client.addAttachment(
                    "CYP-123",
                    "./test/resources/turtle.png"
                );
                expect(response).to.eq(mockedData);
            });
        });

        describe("multiple file attachment", () => {
            it("logs correct messages", async () => {
                const { stubbedInfo, stubbedSuccess } = stubLogging();
                const { stubbedPost } = stubRequests();
                stubbedPost.resolves({
                    status: HttpStatusCode.Ok,
                    data: JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/jira/responses/multipleAttachments.json",
                            "utf-8"
                        )
                    ),
                    headers: null,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                    config: null,
                });
                await client.addAttachment(
                    "CYP-123",
                    "./test/resources/turtle.png",
                    "./test/resources/greetings.txt"
                );
                expect(stubbedInfo).to.have.been.calledWithExactly(
                    "Attaching files:",
                    "./test/resources/turtle.png",
                    "./test/resources/greetings.txt"
                );
                expect(stubbedSuccess).to.have.been.calledOnceWithExactly(
                    "Successfully attached files to issue CYP-123:",
                    "turtle.png, greetings.txt"
                );
            });
            it("returns the correct values", async () => {
                stubLogging();
                const { stubbedPost } = stubRequests();
                const mockedData = JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/jira/responses/multipleAttachments.json",
                        "utf-8"
                    )
                );
                stubbedPost.resolves({
                    status: HttpStatusCode.Ok,
                    data: mockedData,
                    headers: null,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                    config: null,
                });
                const response = await client.addAttachment(
                    "CYP-123",
                    "./test/resources/turtle.png",
                    "./test/resources/greetings.txt"
                );
                expect(response).to.eq(mockedData);
            });
        });

        it("should be able to log missing files", async () => {
            const { stubbedPost } = stubRequests();
            const { stubbedWarning } = stubLogging();
            const mockedData = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/jira/responses/singleAttachment.json",
                    "utf-8"
                )
            );
            stubbedPost.resolves({
                status: HttpStatusCode.Ok,
                data: mockedData,
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            const response = await client.addAttachment(
                "CYP-123",
                "./test/resources/missingGreetings.txt",
                "./test/resources/turtle.png"
            );
            expect(response).to.eq(mockedData);
            expect(stubbedWarning).to.have.been.calledOnceWithExactly(
                "File does not exist:",
                "./test/resources/missingGreetings.txt"
            );
        });

        it("should be able to skip missing files", async () => {
            const { stubbedPost } = stubRequests();
            // These are checked elsewhere.
            stubLogging();
            const mockedData = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/jira/responses/multipleAttachments.json",
                    "utf-8"
                )
            );
            stubbedPost.resolves({
                status: HttpStatusCode.Ok,
                data: mockedData,
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            const response = await client.addAttachment(
                "CYP-123",
                "./test/resources/turtle.png",
                "./test/resources/missingGreetings.txt",
                "./test/resources/greetings.txt"
            );
            expect(response).to.eq(mockedData);
        });

        it("should immediately return an empty array when all files are missing", async () => {
            const { stubbedWarning } = stubLogging();
            const response = await client.addAttachment(
                "CYP-123",
                "./test/resources/missingGreetings.txt",
                "./test/resources/missingSomething.png"
            );
            expect(response).to.be.an("array").that.is.empty;
            expect(stubbedWarning).to.have.been.calledWithExactly(
                "All files do not exist. Skipping attaching."
            );
        });

        it("should immediately return an empty array when no files are provided", async () => {
            const { stubbedWarning } = stubLogging();
            const response = await client.addAttachment("CYP-123");
            expect(response).to.be.an("array").that.is.empty;
            expect(stubbedWarning).to.have.been.calledWithExactly(
                "No files provided to attach to issue CYP-123. Skipping attaching."
            );
        });

        it("should fail on bad responses", async () => {
            const { stubbedPost } = stubRequests();
            const { stubbedError } = stubLogging();
            stubbedPost.rejects(
                new AxiosError(
                    "Request failed with status code 413",
                    HttpStatusCode.BadRequest.toString(),
                    undefined,
                    null,
                    {
                        status: HttpStatusCode.PayloadTooLarge,
                        statusText: HttpStatusCode[HttpStatusCode.PayloadTooLarge],
                        config: { headers: new AxiosHeaders() },
                        headers: {},
                        data: {
                            errorMessages: ["The file is way too big."],
                        },
                    }
                )
            );
            const response = await client.addAttachment(
                "CYP-123",
                "./test/resources/greetings.txt"
            );
            expect(response).to.be.undefined;
            expect(stubbedError).to.have.been.calledTwice;
            expect(stubbedError).to.have.been.calledWithExactly(
                'Failed to attach files: "AxiosError: Request failed with status code 413"'
            );
            expect(stubbedError).to.have.been.calledWithExactly(
                'Complete error logs have been written to "addAttachmentError.json"'
            );
        });
    });

    describe("get issue types", () => {
        it("should use the correct headers", async () => {
            stubLogging();
            const { stubbedGet } = stubRequests();
            stubbedGet.resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                        "utf-8"
                    )
                ),
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            await client.getIssueTypes();
            const headers = stubbedGet.getCalls()[0].args[1]?.headers;
            expect(headers["Authorization"]).to.eq("Basic dXNlcjp0b2tlbg==");
        });

        it("logs correct messages", async () => {
            const { stubbedDebug, stubbedInfo, stubbedSuccess } = stubLogging();
            const { stubbedGet } = stubRequests();
            stubbedGet.resolves({
                status: HttpStatusCode.Ok,
                data: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                        "utf-8"
                    )
                ),
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            await client.getIssueTypes();
            expect(stubbedInfo).to.have.been.calledWithExactly("Getting issue types...");
            expect(stubbedSuccess).to.have.been.calledOnceWithExactly(
                "Successfully retrieved data for 21 issue types."
            );
            expect(stubbedDebug).to.have.been.calledOnceWithExactly(
                "Received data for issue types:",
                "Sub Test Execution (id: 10010)",
                "Sub-Task (id: 10020)",
                "Sub-Task (id: 10003)",
                "Sub-Task (id: 10016)",
                "Test (id: 10017)",
                "Story (id: 10001)",
                "Task (id: 10002)",
                "Marketing (id: 10039)",
                "Test Execution (id: 10008)",
                "Precondition (id: 10009)",
                "Task (id: 10014)",
                "Testfall (id: 10021)",
                "Ausführung (id: 10022)",
                "Test Plan (id: 10007)",
                "Bug (id: 10004)",
                "Test (id: 10005)",
                "Test Set (id: 10006)",
                "Task (id: 10018)",
                "Epic (id: 10000)",
                "Epic (id: 10015)",
                "Epic (id: 10019)"
            );
        });

        it("should return the correct values", async () => {
            stubLogging();
            const { stubbedGet } = stubRequests();
            const mockedData = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                    "utf-8"
                )
            );
            stubbedGet.resolves({
                status: HttpStatusCode.Ok,
                data: mockedData,
                headers: null,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
                config: null,
            });
            const response = await client.getIssueTypes();
            expect(response).to.eq(mockedData);
        });

        it("should fail on bad responses", async () => {
            const { stubbedGet } = stubRequests();
            const { stubbedError } = stubLogging();
            stubbedGet.rejects(
                new AxiosError(
                    "Request failed with status code 401",
                    HttpStatusCode.Unauthorized.toString(),
                    undefined,
                    null,
                    {
                        status: HttpStatusCode.Unauthorized,
                        statusText: HttpStatusCode[HttpStatusCode.Unauthorized],
                        config: { headers: new AxiosHeaders() },
                        headers: {},
                        data: {
                            errorMessages: ["Authentication credentials incorrect"],
                        },
                    }
                )
            );
            const response = await client.getIssueTypes();
            expect(response).to.be.undefined;
            expect(stubbedError).to.have.been.calledTwice;
            expect(stubbedError).to.have.been.calledWithExactly(
                'Failed to get issue types: "AxiosError: Request failed with status code 401"'
            );
            expect(stubbedError).to.have.been.calledWithExactly(
                'Complete error logs have been written to "getIssueTypesError.json"'
            );
        });
    });
});
