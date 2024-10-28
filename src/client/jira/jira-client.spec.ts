import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import fs from "fs";
import path from "path";
import { SinonStubbedInstance } from "sinon";
import { getMockedLogger, getMockedRestClient } from "../../../test/mocks";
import { expectToExist } from "../../../test/util";
import { IssueTypeDetails } from "../../types/jira/responses/issue-type-details";
import { SearchResults } from "../../types/jira/responses/search-results";
import { User } from "../../types/jira/responses/user";
import { Level } from "../../util/logging";
import { BasicAuthCredentials } from "../authentication/credentials";
import { AxiosRestClient } from "../https/requests";
import { BaseJiraClient } from "./jira-client";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(BaseJiraClient.name, () => {
        let client: BaseJiraClient;
        let restClient: SinonStubbedInstance<AxiosRestClient>;

        beforeEach(() => {
            restClient = getMockedRestClient();
            client = new BaseJiraClient(
                "https://example.org",
                new BasicAuthCredentials("user", "token"),
                restClient
            );
        });

        describe("add attachment", () => {
            it("should use the correct headers", async () => {
                restClient.post.resolves({
                    config: {
                        headers: new AxiosHeaders(),
                    },
                    data: JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/jira/responses/singleAttachment.json",
                            "utf-8"
                        )
                    ),
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
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
                        config: {
                            headers: new AxiosHeaders(),
                        },
                        data: mockedData,
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
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
                        config: {
                            headers: new AxiosHeaders(),
                        },
                        data: mockedData,
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
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
                    config: {
                        headers: new AxiosHeaders(),
                    },
                    data: mockedData,
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
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
                    config: {
                        headers: new AxiosHeaders(),
                    },
                    data: mockedData,
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
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
                        config: { headers: new AxiosHeaders() },
                        data: {
                            errorMessages: ["The file is way too big."],
                        },
                        headers: {},
                        status: HttpStatusCode.PayloadTooLarge,
                        statusText: HttpStatusCode[HttpStatusCode.PayloadTooLarge],
                    }
                );
                restClient.post.rejects(error);
                await expect(
                    client.addAttachment("CYP-123", "./test/resources/greetings.txt")
                ).to.eventually.be.rejectedWith("Failed to attach files");
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

        describe("get issue types", () => {
            it("returns issue types", async () => {
                const issueTypes = JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                        "utf-8"
                    )
                ) as IssueTypeDetails[];
                restClient.get.onFirstCall().resolves({
                    config: {
                        headers: new AxiosHeaders(),
                    },
                    data: issueTypes,
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                expect(await client.getIssueTypes()).to.eq(issueTypes);
            });

            it("handles issues without name or id", async () => {
                const issueTypes: IssueTypeDetails[] = [
                    { id: "12345" },
                    { name: "Custom issue" },
                    { description: "A legacy subtask" },
                ];
                restClient.get.onFirstCall().resolves({
                    config: {
                        headers: new AxiosHeaders(),
                    },
                    data: issueTypes,
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                expect(await client.getIssueTypes()).to.eq(issueTypes);
            });

            it("handles bad responses", async () => {
                const logger = getMockedLogger({ allowUnstubbedCalls: true });
                const error = new AxiosError(
                    "Request failed with status code 409",
                    HttpStatusCode.BadRequest.toString(),
                    undefined,
                    null,
                    {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            errorMessages: ["There is a conflict or something"],
                        },
                        headers: {},
                        status: HttpStatusCode.Conflict,
                        statusText: HttpStatusCode[HttpStatusCode.Conflict],
                    }
                );
                restClient.get.onFirstCall().rejects(error);
                await expect(client.getIssueTypes()).to.eventually.be.rejectedWith(
                    "Failed to get issue types"
                );
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.ERROR,
                    "Failed to get issue types: Request failed with status code 409"
                );
                expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                    error,
                    "getIssueTypesError"
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
                    config: {
                        headers: new AxiosHeaders(),
                    },
                    data: mockedData,
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
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
                        config: { headers: new AxiosHeaders() },
                        data: {
                            errorMessages: ["There is a conflict or something"],
                        },
                        headers: {},
                        status: HttpStatusCode.Conflict,
                        statusText: HttpStatusCode[HttpStatusCode.Conflict],
                    }
                );
                restClient.get.onFirstCall().rejects(error);
                await expect(client.getFields()).to.eventually.be.rejectedWith(
                    "Failed to get fields"
                );
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

        describe("get myself", () => {
            it("returns user details", async () => {
                restClient.get.onFirstCall().resolves({
                    config: {
                        headers: new AxiosHeaders(),
                    },
                    data: {
                        active: true,
                        displayName: "Demo User",
                    } as User,
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                expect(await client.getMyself()).to.deep.eq({
                    active: true,
                    displayName: "Demo User",
                });
                expect(restClient.get).to.have.been.calledOnceWithExactly(
                    "https://example.org/rest/api/latest/myself",
                    {
                        headers: { ["Authorization"]: "Basic dXNlcjp0b2tlbg==" },
                    }
                );
            });

            it("handles bad responses", async () => {
                const logger = getMockedLogger({ allowUnstubbedCalls: true });
                const error = new AxiosError(
                    "Request failed with status code 409",
                    HttpStatusCode.BadRequest.toString(),
                    undefined,
                    null,
                    {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            errorMessages: ["There is a conflict or something"],
                        },
                        headers: {},
                        status: HttpStatusCode.Conflict,
                        statusText: HttpStatusCode[HttpStatusCode.Conflict],
                    }
                );
                restClient.get.onFirstCall().rejects(error);
                await expect(client.getMyself()).to.eventually.be.rejectedWith(
                    "Failed to get user details"
                );
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.ERROR,
                    "Failed to get user details: Request failed with status code 409"
                );
                expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                    error,
                    "getMyselfError"
                );
            });
        });

        describe("search", () => {
            it("should return all issues without pagination", async () => {
                restClient.post.onFirstCall().resolves({
                    config: {
                        headers: new AxiosHeaders(),
                    },
                    data: JSON.parse(
                        fs.readFileSync(
                            "./test/resources/fixtures/jira/responses/search.json",
                            "utf-8"
                        )
                    ),
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                const response = await client.search({
                    fields: ["customfield_12100"],
                    jql: "project = CYP AND issue in (CYP-268,CYP-237,CYP-332,CYP-333,CYP-338)",
                });
                expect(restClient.post).to.have.been.calledOnce;
                expect(response).to.be.an("array").with.length(4);
                expect(response[0].key).to.eq("CYP-333").and;
                expect(response[1].key).to.eq("CYP-338");
                expect(response[2].key).to.eq("CYP-332");
                expect(response[3].key).to.eq("CYP-268");
            });

            it("returns all issues with pagination", async () => {
                const mockedData: SearchResults = JSON.parse(
                    fs.readFileSync("./test/resources/fixtures/jira/responses/search.json", "utf-8")
                ) as SearchResults;
                restClient.post.onCall(0).resolves({
                    config: {
                        headers: new AxiosHeaders(),
                    },
                    data: {
                        ...mockedData,
                        issues: mockedData.issues?.slice(0, 1),
                        maxResults: 1,
                        startAt: 0,
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                restClient.post.onCall(1).resolves({
                    config: {
                        headers: new AxiosHeaders(),
                    },
                    data: {
                        ...mockedData,
                        issues: undefined,
                        maxResults: 0,
                        startAt: 1,
                        total: undefined,
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                restClient.post.onCall(2).resolves({
                    config: {
                        headers: new AxiosHeaders(),
                    },
                    data: {
                        ...mockedData,
                        issues: mockedData.issues?.slice(1, 2),
                        maxResults: 1,
                        startAt: undefined,
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                restClient.post.onCall(3).resolves({
                    config: {
                        headers: new AxiosHeaders(),
                    },
                    data: {
                        ...mockedData,
                        issues: mockedData.issues?.slice(1, 2),
                        maxResults: 1,
                        startAt: 1,
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                restClient.post.onCall(4).resolves({
                    config: {
                        headers: new AxiosHeaders(),
                    },
                    data: {
                        ...mockedData,
                        issues: mockedData.issues?.slice(2),
                        maxResults: 3,
                        startAt: 2,
                    },
                    headers: {},
                    status: HttpStatusCode.Ok,
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                });
                const response = await client.search({
                    fields: ["customfield_12100"],
                    jql: "project = CYP AND issue in (CYP-268,CYP-237,CYP-332,CYP-333,CYP-338)",
                });
                expect(restClient.post).to.have.callCount(5);
                expect(restClient.post.getCall(0).args[1]).to.have.property("startAt", 0);
                expect(restClient.post.getCall(1).args[1]).to.have.property("startAt", 1);
                expect(restClient.post.getCall(2).args[1]).to.have.property("startAt", 1);
                expect(restClient.post.getCall(3).args[1]).to.have.property("startAt", 1);
                expect(restClient.post.getCall(4).args[1]).to.have.property("startAt", 2);
                expect(response).to.be.an("array").with.length(4);
                expect(response[0].key).to.eq("CYP-333");
                expect(response[1].key).to.eq("CYP-338");
                expect(response[2].key).to.eq("CYP-332");
                expect(response[3].key).to.eq("CYP-268");
            });

            it("handles bad responses", async () => {
                const logger = getMockedLogger({ allowUnstubbedCalls: true });
                const error = new AxiosError(
                    "Request failed with status code 401",
                    HttpStatusCode.BadRequest.toString(),
                    undefined,
                    null,
                    {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            errorMessages: ["You're not authenticated"],
                        },
                        headers: {},
                        status: HttpStatusCode.Unauthorized,
                        statusText: HttpStatusCode[HttpStatusCode.Unauthorized],
                    }
                );
                restClient.post.onFirstCall().rejects(error);
                await expect(client.search({})).to.eventually.be.rejectedWith(
                    "Failed to search issues"
                );
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
            it("edits issues", async () => {
                restClient.put
                    .withArgs("https://example.org/rest/api/latest/issue/CYP-XYZ", {
                        fields: { summary: "Hi" },
                    })
                    .onFirstCall()
                    .resolves({
                        config: {
                            headers: new AxiosHeaders(),
                        },
                        data: undefined,
                        headers: {},
                        status: HttpStatusCode.NoContent,
                        statusText: HttpStatusCode[HttpStatusCode.NoContent],
                    });
                expect(
                    await client.editIssue("CYP-XYZ", {
                        fields: { summary: "Hi" },
                    })
                ).to.eq("CYP-XYZ");
            });

            it("handles bad responses", async () => {
                const logger = getMockedLogger({ allowUnstubbedCalls: true });
                const error = new AxiosError(
                    "Request failed with status code 400",
                    HttpStatusCode.BadRequest.toString(),
                    undefined,
                    null,
                    {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            errorMessages: ["issue CYP-XYZ does not exist"],
                        },
                        headers: {},
                        status: HttpStatusCode.BadRequest,
                        statusText: HttpStatusCode[HttpStatusCode.BadRequest],
                    }
                );
                restClient.put.onFirstCall().rejects(error);
                await expect(
                    client.editIssue("CYP-XYZ", {
                        fields: { summary: "Hi" },
                    })
                ).to.eventually.be.rejectedWith("Failed to edit issue");
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.ERROR,
                    "Failed to edit issue: Request failed with status code 400"
                );
                expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                    error,
                    "editIssueError"
                );
            });
        });

        describe("transitionIssue", () => {
            it("transitions issues", async () => {
                restClient.post.onFirstCall().resolves({
                    config: {
                        headers: new AxiosHeaders(),
                    },
                    data: undefined,
                    headers: {},
                    status: HttpStatusCode.NoContent,
                    statusText: HttpStatusCode[HttpStatusCode.NoContent],
                });
                await client.transitionIssue("CYP-XYZ", {
                    transition: {
                        name: "resolve",
                        to: {
                            name: "done",
                        },
                    },
                });
                expect(restClient.post).to.have.been.calledOnceWith(
                    "https://example.org/rest/api/latest/issue/CYP-XYZ/transitions",
                    {
                        transition: {
                            name: "resolve",
                            to: {
                                name: "done",
                            },
                        },
                    },
                    {
                        headers: { ["Authorization"]: "Basic dXNlcjp0b2tlbg==" },
                    }
                );
            });

            it("handles bad responses", async () => {
                const logger = getMockedLogger({ allowUnstubbedCalls: true });
                const error = new AxiosError(
                    "Request failed with status code 404",
                    HttpStatusCode.NotFound.toString(),
                    undefined,
                    null,
                    {
                        config: { headers: new AxiosHeaders() },
                        data: {
                            errorMessages: ["issue CYP-XYZ does not exist"],
                        },
                        headers: {},
                        status: HttpStatusCode.NotFound,
                        statusText: HttpStatusCode[HttpStatusCode.NotFound],
                    }
                );
                restClient.post.onFirstCall().rejects(error);
                await expect(
                    client.transitionIssue("CYP-XYZ", {
                        transition: {
                            name: "resolve",
                            to: {
                                name: "done",
                            },
                        },
                    })
                ).to.eventually.be.rejectedWith("Failed to transition issue");
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.ERROR,
                    "Failed to transition issue: Request failed with status code 404"
                );
                expect(logger.logErrorToFile).to.have.been.calledOnceWithExactly(
                    error,
                    "transitionIssueError"
                );
            });
        });
    });
});
