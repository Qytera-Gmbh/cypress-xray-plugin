import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import { expect } from "chai";
import dedent from "dedent";
import fs from "fs";
import { expectToExist, resolveTestDirPath, stubLogging, stubRequests } from "../../../test/util";
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
                        expect(stubbedSuccess).to.have.been.calledOnceWith(
                            dedent(`
                                Successfully attached files to issue: CYP-123
                                turtle.png
                            `)
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
                        expect(stubbedSuccess).to.have.been.calledOnceWith(
                            dedent(`
                                Successfully attached files to issue: CYP-123
                                turtle.png
                                greetings.txt
                            `)
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

                it("should handle bad responses", async () => {
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
                        "Failed to attach files: AxiosError: Request failed with status code 413"
                    );
                    const expectedPath = resolveTestDirPath("addAttachmentError.json");
                    expect(stubbedError).to.have.been.calledWithExactly(
                        `Complete error logs have been written to: ${expectedPath}`
                    );
                });
            });

            describe("get fields", () => {
                it("logs correct messages", async () => {
                    const { stubbedInfo, stubbedSuccess } = stubLogging();
                    const { stubbedGet } = stubRequests();
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
                    await client.getFields();
                    expect(stubbedInfo).to.have.been.calledWithExactly("Getting fields...");
                    expect(stubbedSuccess).to.have.been.calledOnceWith(
                        "Successfully retrieved data for 141 fields"
                    );
                });
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
                        headers: null,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                        config: null,
                    });
                    const fields = await client.getFields();
                    expect(fields).to.eq(mockedData);
                });

                it("should handle bad responses", async () => {
                    const { stubbedGet } = stubRequests();
                    const { stubbedError } = stubLogging();
                    stubbedGet.onFirstCall().rejects(
                        new AxiosError(
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
                        )
                    );
                    const response = await client.getFields();
                    expect(response).to.be.undefined;
                    expect(stubbedError).to.have.been.calledTwice;
                    expect(stubbedError).to.have.been.calledWithExactly(
                        "Failed to get fields: AxiosError: Request failed with status code 409"
                    );
                    const expectedPath = resolveTestDirPath("getFieldsError.json");
                    expect(stubbedError).to.have.been.calledWithExactly(
                        `Complete error logs have been written to: ${expectedPath}`
                    );
                });
            });

            describe("search", () => {
                it("logs correct messages", async () => {
                    const { stubbedInfo, stubbedSuccess } = stubLogging();
                    const { stubbedPost } = stubRequests();
                    stubbedPost.onFirstCall().resolves({
                        status: HttpStatusCode.Ok,
                        data: JSON.parse(
                            fs.readFileSync(
                                "./test/resources/fixtures/jira/responses/search.json",
                                "utf-8"
                            )
                        ),
                        headers: null,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                        config: null,
                    });
                    await client.search({
                        jql: "project = CYP AND issue in (CYP-268,CYP-237,CYP-332,CYP-333,CYP-338)",
                        fields: ["customfield_12100"],
                    });
                    expect(stubbedInfo).to.have.been.calledOnceWithExactly("Searching issues...");
                    expect(stubbedSuccess).to.have.been.calledOnceWithExactly("Found 5 issues");
                });
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
                        headers: null,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                        config: null,
                    });
                    const response = await client.search({
                        jql: "project = CYP AND issue in (CYP-268,CYP-237,CYP-332,CYP-333,CYP-338)",
                        fields: ["customfield_12100"],
                    });
                    expect(stubbedPost).to.have.been.calledOnce;
                    expect(response).to.be.an("array").with.length(5);
                    expect(response[0].key).to.eq("CYP-333");
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
                            issues: mockedData.issues.slice(0, 2),
                        },
                        headers: null,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                        config: null,
                    });
                    stubbedPost.onSecondCall().resolves({
                        status: HttpStatusCode.Ok,
                        data: {
                            ...mockedData,
                            startAt: 2,
                            maxResults: 2,
                            issues: mockedData.issues.slice(2, 4),
                        },
                        headers: null,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                        config: null,
                    });
                    stubbedPost.onThirdCall().resolves({
                        status: HttpStatusCode.Ok,
                        data: {
                            ...mockedData,
                            startAt: 4,
                            maxResults: 2,
                            issues: mockedData.issues.slice(4, 5),
                        },
                        headers: null,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                        config: null,
                    });
                    const response = await client.search({
                        jql: "project = CYP AND issue in (CYP-268,CYP-237,CYP-332,CYP-333,CYP-338)",
                        fields: ["customfield_12100"],
                    });
                    expect(stubbedPost).to.have.been.calledThrice;
                    expect(stubbedPost.getCall(0).args[1]["startAt"]).to.be.undefined;
                    expect(stubbedPost.getCall(1).args[1]["startAt"]).to.eq(2);
                    expect(stubbedPost.getCall(2).args[1]["startAt"]).to.eq(4);
                    expect(response).to.be.an("array").with.length(5);
                    expect(response[0].key).to.eq("CYP-333");
                    expect(response[1].key).to.eq("CYP-338");
                    expect(response[2].key).to.eq("CYP-332");
                    expect(response[3].key).to.eq("CYP-268");
                    expect(response[4].key).to.eq("CYP-237");
                });

                it("should handle bad responses", async () => {
                    const { stubbedPost } = stubRequests();
                    const { stubbedError } = stubLogging();
                    stubbedPost.onFirstCall().rejects(
                        new AxiosError(
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
                        )
                    );
                    const response = await client.search({});
                    expect(response).to.be.undefined;
                    expect(stubbedError).to.have.been.calledTwice;
                    expect(stubbedError).to.have.been.calledWithExactly(
                        "Failed to search issues: AxiosError: Request failed with status code 401"
                    );
                    const expectedPath = resolveTestDirPath("searchError.json");
                    expect(stubbedError).to.have.been.calledWithExactly(
                        `Complete error logs have been written to: ${expectedPath}`
                    );
                });
            });
        });
    });
});
