import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import { expect } from "chai";
import fs from "fs";
import { SinonStubbedInstance } from "sinon";
import { getMockedLogger, getMockedRestClient } from "../../../test/mocks";
import { expectToExist } from "../../../test/util";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { AxiosRestClient } from "../../https/requests";
import { Level } from "../../logging/logging";
import { SearchResults } from "../../types/jira/responses/searchResults";
import { JiraClient } from "./jiraClient";
import { JiraClientCloud } from "./jiraClientCloud";
import { JiraClientServer } from "./jiraClientServer";

describe("the jira clients", () => {
    let restClient: SinonStubbedInstance<AxiosRestClient>;

    beforeEach(() => {
        restClient = getMockedRestClient();
    });

    ["server", "cloud"].forEach((clientType: string) => {
        // The concrete client implementation does not matter here. The methods here only test the
        // abstract base class's code.
        let client: JiraClient;

        describe(clientType, () => {
            beforeEach(() => {
                client =
                    clientType === "server"
                        ? new JiraClientServer(
                              "https://example.org",
                              new BasicAuthCredentials("user", "token"),
                              restClient
                          )
                        : new JiraClientCloud(
                              "https://example.org",
                              new BasicAuthCredentials("user", "token"),
                              restClient
                          );
            });

            describe("add attachment", () => {
                it("should use the correct headers", async () => {
                    restClient.post.resolves({
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
                    const headers = restClient.post.getCalls()[0].args[2]?.headers;
                    expectToExist(headers);
                    expect(headers.Authorization).to.eq("Basic dXNlcjp0b2tlbg==");
                    expect(headers["X-Atlassian-Token"]).to.eq("no-check");
                    expect(headers["content-type"]).to.match(/multipart\/form-data; .+/);
                });

                describe("single file attachment", () => {
                    it("returns the correct values", async () => {
                        const mockedData = JSON.parse(
                            fs.readFileSync(
                                "./test/resources/fixtures/jira/responses/singleAttachment.json",
                                "utf-8"
                            )
                        ) as unknown;
                        restClient.post.resolves({
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
                        const mockedData = JSON.parse(
                            fs.readFileSync(
                                "./test/resources/fixtures/jira/responses/multipleAttachments.json",
                                "utf-8"
                            )
                        ) as unknown;
                        restClient.post.resolves({
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

                it("logs missing files", async () => {
                    const logger = getMockedLogger({ allowUnstubbedCalls: true });
                    const mockedData = JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/jira/responses/singleAttachment.json",
                            "utf-8"
                        )
                    ) as unknown;
                    restClient.post.resolves({
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
                    expect(logger.message).to.have.been.calledWithExactly(
                        Level.WARNING,
                        "File does not exist:",
                        "./test/resources/missingGreetings.txt"
                    );
                });

                it("skips missing files", async () => {
                    getMockedLogger({ allowUnstubbedCalls: true });
                    const mockedData = JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/jira/responses/multipleAttachments.json",
                            "utf-8"
                        )
                    ) as unknown;
                    restClient.post.resolves({
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

                it("immediately returns an empty array when all files are missing", async () => {
                    const logger = getMockedLogger({ allowUnstubbedCalls: true });
                    const response = await client.addAttachment(
                        "CYP-123",
                        "./test/resources/missingGreetings.txt",
                        "./test/resources/missingSomething.png"
                    );
                    expect(response).to.be.an("array").that.is.empty;
                    expect(logger.message).to.have.been.calledWithExactly(
                        Level.WARNING,
                        "All files do not exist. Skipping attaching."
                    );
                });

                it("immediately returns an empty array when no files are provided", async () => {
                    const logger = getMockedLogger();
                    logger.message
                        .withArgs(
                            Level.WARNING,
                            "No files provided to attach to issue CYP-123. Skipping attaching."
                        )
                        .onFirstCall()
                        .returns();
                    const response = await client.addAttachment("CYP-123");
                    expect(response).to.be.an("array").that.is.empty;
                });

                it("handles bad responses", async () => {
                    const logger = getMockedLogger({ allowUnstubbedCalls: true });
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
                    restClient.post.rejects(error);
                    const response = await client.addAttachment(
                        "CYP-123",
                        "./test/resources/greetings.txt"
                    );
                    expect(response).to.be.undefined;
                    expect(logger.message).to.have.been.calledWithExactly(
                        Level.ERROR,
                        "Failed to attach files: Request failed with status code 413"
                    );
                    expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                        error,
                        "addAttachmentError"
                    );
                });
            });

            describe("get fields", () => {
                it("returns the correct values", async () => {
                    const mockedData = JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/jira/responses/getFields.json",
                            "utf-8"
                        )
                    ) as unknown;
                    restClient.get.onFirstCall().resolves({
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

                it("handles bad responses", async () => {
                    const logger = getMockedLogger({ allowUnstubbedCalls: true });
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
                    restClient.get.onFirstCall().rejects(error);
                    const response = await client.getFields();
                    expect(response).to.be.undefined;
                    expect(logger.message).to.have.been.calledWithExactly(
                        Level.ERROR,
                        "Failed to get fields: Request failed with status code 409"
                    );
                    expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                        error,
                        "getFieldsError"
                    );
                });
            });

            describe("search", () => {
                it("should return all issues without pagination", async () => {
                    restClient.post.onFirstCall().resolves({
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
                    expect(restClient.post).to.have.been.calledOnce;
                    expect(response).to.be.an("array").with.length(5);
                    expectToExist(response);
                    expect(response[0].key).to.eq("CYP-333").and;
                    expect(response[1].key).to.eq("CYP-338");
                    expect(response[2].key).to.eq("CYP-332");
                    expect(response[3].key).to.eq("CYP-268");
                    expect(response[4].key).to.eq("CYP-237");
                });
                it("should return all issues with pagination", async () => {
                    const mockedData: SearchResults = JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/jira/responses/search.json",
                            "utf-8"
                        )
                    ) as SearchResults;
                    restClient.post.onFirstCall().resolves({
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
                    restClient.post.onSecondCall().resolves({
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
                    restClient.post.onThirdCall().resolves({
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
                    expect(restClient.post).to.have.been.calledThrice;
                    expect(restClient.post.getCall(0).args[1]).to.have.property("startAt", 0);
                    expect(restClient.post.getCall(1).args[1]).to.have.property("startAt", 2);
                    expect(restClient.post.getCall(2).args[1]).to.have.property("startAt", 4);
                    expectToExist(response);
                    expect(response).to.be.an("array").with.length(5);
                    expect(response[0].key).to.eq("CYP-333");
                    expect(response[1].key).to.eq("CYP-338");
                    expect(response[2].key).to.eq("CYP-332");
                    expect(response[3].key).to.eq("CYP-268");
                    expect(response[4].key).to.eq("CYP-237");
                });

                it("handles bad responses", async () => {
                    const logger = getMockedLogger({ allowUnstubbedCalls: true });
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
                    restClient.post.onFirstCall().rejects(error);
                    const response = await client.search({});
                    expect(response).to.be.undefined;
                    expect(logger.message).to.have.been.calledWithExactly(
                        Level.ERROR,
                        "Failed to search issues: Request failed with status code 401"
                    );
                    expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                        error,
                        "searchError"
                    );
                });
            });

            describe("editIssue", () => {
                it("handles bad responses", async () => {
                    const logger = getMockedLogger({ allowUnstubbedCalls: true });
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
                    restClient.put.onFirstCall().rejects(error);
                    const response = await client.editIssue("CYP-XYZ", {
                        fields: { summary: "Hi" },
                    });
                    expect(response).to.be.undefined;
                    expect(logger.message).to.have.been.calledWithExactly(
                        Level.ERROR,
                        "Failed to edit issue: Request failed with status code 400"
                    );
                    expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                        error,
                        "editIssue"
                    );
                });
            });
        });
    });
});
