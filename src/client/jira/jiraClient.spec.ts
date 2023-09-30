import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import { expect } from "chai";
import fs from "fs";
import { expectToExist, stubLogging, stubRequests } from "../../../test/util";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { SearchResultsServer } from "../../types/jira/responses/searchResults";
import { JiraClientCloud } from "./jiraClientCloud";
import { JiraClientServer } from "./jiraClientServer";

describe("the jira clients", () => {
    ["server", "cloud"].forEach((clientType: string) => {
        // The concrete client implementation does not matter here. The methods here only test the
        // abstract base class's code.
        let client: JiraClientServer | JiraClientCloud;

        describe(clientType, () => {
            beforeEach(() => {
                client =
                    clientType === "server"
                        ? new JiraClientServer(
                              "https://example.org",
                              new BasicAuthCredentials("user", "token")
                          )
                        : new JiraClientCloud(
                              "https://example.org",
                              new BasicAuthCredentials("user", "token")
                          );
            });

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
                        headers: {},
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                        config: {
                            headers: new AxiosHeaders(),
                        },
                    });
                    await client.addAttachment("CYP-123", "./test/resources/turtle.png");
                    const headers = stubbedPost.getCalls()[0].args[2]?.headers;
                    expectToExist(headers);
                    expect(headers.Authorization).to.eq("Basic dXNlcjp0b2tlbg==");
                    expect(headers["X-Atlassian-Token"]).to.eq("no-check");
                    expect(headers["content-type"]).to.match(/multipart\/form-data; .+/);
                });

                describe("single file attachment", () => {
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
                            headers: {},
                            statusText: HttpStatusCode[HttpStatusCode.Ok],
                            config: {
                                headers: new AxiosHeaders(),
                            },
                        });
                        const response = await client.addAttachment(
                            "CYP-123",
                            "./test/resources/turtle.png"
                        );
                        expect(response).to.eq(mockedData);
                    });
                });

                describe("multiple file attachment", () => {
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
                            headers: {},
                            statusText: HttpStatusCode[HttpStatusCode.Ok],
                            config: {
                                headers: new AxiosHeaders(),
                            },
                        });
                        const response = await client.addAttachment(
                            "CYP-123",
                            "./test/resources/turtle.png",
                            "./test/resources/greetings.txt"
                        );
                        expect(response).to.eq(mockedData);
                    });
                });

                it("should log missing files", async () => {
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
                        headers: {},
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                        config: {
                            headers: new AxiosHeaders(),
                        },
                    });
                    const response = await client.addAttachment(
                        "CYP-123",
                        "./test/resources/missingGreetings.txt",
                        "./test/resources/turtle.png"
                    );
                    expect(response).to.eq(mockedData);
                    expect(stubbedWarning).to.have.been.calledOnceWith(
                        "File does not exist:",
                        "./test/resources/missingGreetings.txt"
                    );
                });

                it("should skip missing files", async () => {
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
                        headers: {},
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                        config: {
                            headers: new AxiosHeaders(),
                        },
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

                it("should handle bad responses", async () => {
                    const { stubbedPost } = stubRequests();
                    const { stubbedError, stubbedWriteErrorFile } = stubLogging();
                    const error = new AxiosError(
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
                    );
                    stubbedPost.rejects(error);
                    const response = await client.addAttachment(
                        "CYP-123",
                        "./test/resources/greetings.txt"
                    );
                    expect(response).to.be.undefined;
                    expect(stubbedError).to.have.been.calledOnceWithExactly(
                        "Failed to attach files: AxiosError: Request failed with status code 413"
                    );
                    expect(stubbedWriteErrorFile).to.have.been.calledWithExactly(
                        error,
                        "addAttachmentError"
                    );
                });
            });

            describe("get fields", () => {
                it("returns the correct values", async () => {
                    stubLogging();
                    const { stubbedGet } = stubRequests();
                    const mockedData = JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/jira/responses/getFields.json",
                            "utf-8"
                        )
                    );
                    stubbedGet.onFirstCall().resolves({
                        status: HttpStatusCode.Ok,
                        data: mockedData,
                        headers: {},
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                        config: {
                            headers: new AxiosHeaders(),
                        },
                    });
                    const fields = await client.getFields();
                    expect(fields).to.eq(mockedData);
                });

                it("should handle bad responses", async () => {
                    const { stubbedGet } = stubRequests();
                    const { stubbedError, stubbedWriteErrorFile } = stubLogging();
                    const error = new AxiosError(
                        "Request failed with status code 409",
                        HttpStatusCode.BadRequest.toString(),
                        undefined,
                        null,
                        {
                            status: HttpStatusCode.Conflict,
                            statusText: HttpStatusCode[HttpStatusCode.Conflict],
                            config: { headers: new AxiosHeaders() },
                            headers: {},
                            data: {
                                errorMessages: ["There is a conflict or something"],
                            },
                        }
                    );
                    stubbedGet.onFirstCall().rejects(error);
                    const response = await client.getFields();
                    expect(response).to.be.undefined;
                    expect(stubbedError).to.have.been.calledOnceWithExactly(
                        "Failed to get fields: AxiosError: Request failed with status code 409"
                    );
                    expect(stubbedWriteErrorFile).to.have.been.calledWithExactly(
                        error,
                        "getFieldsError"
                    );
                });
            });

            describe("search", () => {
                it("should return all issues without pagination", async () => {
                    stubLogging();
                    const { stubbedPost } = stubRequests();
                    stubbedPost.onFirstCall().resolves({
                        status: HttpStatusCode.Ok,
                        data: JSON.parse(
                            fs.readFileSync(
                                "./test/resources/fixtures/jira/responses/search.json",
                                "utf-8"
                            )
                        ),
                        headers: {},
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                        config: {
                            headers: new AxiosHeaders(),
                        },
                    });
                    const response = await client.search({
                        jql: "project = CYP AND issue in (CYP-268,CYP-237,CYP-332,CYP-333,CYP-338)",
                        fields: ["customfield_12100"],
                    });
                    expect(stubbedPost).to.have.been.calledOnce;
                    expect(response).to.be.an("array").with.length(5);
                    expectToExist(response);
                    expect(response[0].key).to.eq("CYP-333").and;
                    expect(response[1].key).to.eq("CYP-338");
                    expect(response[2].key).to.eq("CYP-332");
                    expect(response[3].key).to.eq("CYP-268");
                    expect(response[4].key).to.eq("CYP-237");
                });
                it("should return all issues with pagination", async () => {
                    stubLogging();
                    const { stubbedPost } = stubRequests();
                    const mockedData: SearchResultsServer = JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/jira/responses/search.json",
                            "utf-8"
                        )
                    );
                    stubbedPost.onFirstCall().resolves({
                        status: HttpStatusCode.Ok,
                        data: {
                            ...mockedData,
                            startAt: 0,
                            maxResults: 2,
                            issues: mockedData.issues?.slice(0, 2),
                        },
                        headers: {},
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                        config: {
                            headers: new AxiosHeaders(),
                        },
                    });
                    stubbedPost.onSecondCall().resolves({
                        status: HttpStatusCode.Ok,
                        data: {
                            ...mockedData,
                            startAt: 2,
                            maxResults: 2,
                            issues: mockedData.issues?.slice(2, 4),
                        },
                        headers: {},
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                        config: {
                            headers: new AxiosHeaders(),
                        },
                    });
                    stubbedPost.onThirdCall().resolves({
                        status: HttpStatusCode.Ok,
                        data: {
                            ...mockedData,
                            startAt: 4,
                            maxResults: 2,
                            issues: mockedData.issues?.slice(4, 5),
                        },
                        headers: {},
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                        config: {
                            headers: new AxiosHeaders(),
                        },
                    });
                    const response = await client.search({
                        jql: "project = CYP AND issue in (CYP-268,CYP-237,CYP-332,CYP-333,CYP-338)",
                        fields: ["customfield_12100"],
                    });
                    expect(stubbedPost).to.have.been.calledThrice;
                    expect(stubbedPost.getCall(0).args[1]).to.have.property("startAt", 0);
                    expect(stubbedPost.getCall(1).args[1]).to.have.property("startAt", 2);
                    expect(stubbedPost.getCall(2).args[1]).to.have.property("startAt", 4);
                    expectToExist(response);
                    expect(response).to.be.an("array").with.length(5);
                    expect(response[0].key).to.eq("CYP-333");
                    expect(response[1].key).to.eq("CYP-338");
                    expect(response[2].key).to.eq("CYP-332");
                    expect(response[3].key).to.eq("CYP-268");
                    expect(response[4].key).to.eq("CYP-237");
                });

                it("should handle bad responses", async () => {
                    const { stubbedPost } = stubRequests();
                    const { stubbedError, stubbedWriteErrorFile } = stubLogging();
                    const error = new AxiosError(
                        "Request failed with status code 401",
                        HttpStatusCode.BadRequest.toString(),
                        undefined,
                        null,
                        {
                            status: HttpStatusCode.Unauthorized,
                            statusText: HttpStatusCode[HttpStatusCode.Unauthorized],
                            config: { headers: new AxiosHeaders() },
                            headers: {},
                            data: {
                                errorMessages: ["You're not authenticated"],
                            },
                        }
                    );
                    stubbedPost.onFirstCall().rejects(error);
                    const response = await client.search({});
                    expect(response).to.be.undefined;
                    expect(stubbedError).to.have.been.calledOnceWithExactly(
                        "Failed to search issues: AxiosError: Request failed with status code 401"
                    );
                    expect(stubbedWriteErrorFile).to.have.been.calledWithExactly(
                        error,
                        "searchError"
                    );
                });
            });

            describe("editIssue", () => {
                it("should handle bad responses", async () => {
                    const { stubbedError, stubbedWriteErrorFile } = stubLogging();
                    const { stubbedPut } = stubRequests();
                    const error = new AxiosError(
                        "Request failed with status code 400",
                        HttpStatusCode.BadRequest.toString(),
                        undefined,
                        null,
                        {
                            status: HttpStatusCode.BadRequest,
                            statusText: HttpStatusCode[HttpStatusCode.BadRequest],
                            config: { headers: new AxiosHeaders() },
                            headers: {},
                            data: {
                                errorMessages: ["issue CYP-XYZ does not exist"],
                            },
                        }
                    );
                    stubbedPut.onFirstCall().rejects(error);
                    const response = await client.editIssue("CYP-XYZ", {
                        fields: { summary: "Hi" },
                    });
                    expect(response).to.be.undefined;
                    expect(stubbedError).to.have.been.calledOnceWithExactly(
                        "Failed to edit issue: AxiosError: Request failed with status code 400"
                    );
                    expect(stubbedWriteErrorFile).to.have.been.calledWithExactly(
                        error,
                        "editIssue"
                    );
                });
            });
        });
    });
});
