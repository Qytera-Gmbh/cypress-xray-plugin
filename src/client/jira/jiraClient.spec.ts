/// <reference types="cypress" />

import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import { expect } from "chai";
import fs from "fs";
import { expectToExist, stubLogging, stubRequests } from "../../../test/util";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { JiraClientCloud } from "./jiraClientCloud";

describe("the Jira Cloud client", () => {
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
});
