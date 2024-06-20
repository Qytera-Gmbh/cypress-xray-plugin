import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import fs from "fs";
import path from "path";
import { SinonStubbedInstance, useFakeTimers } from "sinon";
import { getMockedLogger, getMockedRestClient } from "../../../test/mocks";
import { expectToExist } from "../../../test/util";
import { FieldDetail } from "../../types/jira/responses/field-detail";
import { IssueTypeDetails } from "../../types/jira/responses/issue-type-details";
import { SearchResults } from "../../types/jira/responses/search-results";
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
                await expect(
                    client.addAttachment("CYP-123", "./test/resources/greetings.txt")
                ).to.eventually.be.rejectedWith("Failed to add attachments to issue");
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
                    status: HttpStatusCode.Ok,
                    data: issueTypes,
                    headers: {},
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                    config: {
                        headers: new AxiosHeaders(),
                    },
                });
                expect(await client.getIssueTypes()).to.eq(issueTypes);
            });

            it("handles issues without name or id", async () => {
                const issueTypes: IssueTypeDetails[] = [
                    { subtask: false, id: "12345" },
                    { subtask: false, name: "Custom issue" },
                    { subtask: true, description: "A legacy subtask" },
                ];
                restClient.get.onFirstCall().resolves({
                    status: HttpStatusCode.Ok,
                    data: issueTypes,
                    headers: {},
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                    config: {
                        headers: new AxiosHeaders(),
                    },
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
                await expect(client.getIssueTypes()).to.eventually.be.rejectedWith(
                    "Failed to fetch Jira issue types"
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
                await expect(client.getFields()).to.eventually.be.rejectedWith(
                    "Failed to fetch Jira fields"
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
                    status: HttpStatusCode.Ok,
                    data: {
                        ...mockedData,
                        startAt: 0,
                        maxResults: 1,
                        issues: mockedData.issues?.slice(0, 1),
                    },
                    headers: {},
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                    config: {
                        headers: new AxiosHeaders(),
                    },
                });
                restClient.post.onCall(1).resolves({
                    status: HttpStatusCode.Ok,
                    data: {
                        ...mockedData,
                        total: undefined,
                        startAt: 1,
                        maxResults: 0,
                        issues: undefined,
                    },
                    headers: {},
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                    config: {
                        headers: new AxiosHeaders(),
                    },
                });
                restClient.post.onCall(2).resolves({
                    status: HttpStatusCode.Ok,
                    data: {
                        ...mockedData,
                        startAt: undefined,
                        maxResults: 1,
                        issues: mockedData.issues?.slice(1, 2),
                    },
                    headers: {},
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                    config: {
                        headers: new AxiosHeaders(),
                    },
                });
                restClient.post.onCall(3).resolves({
                    status: HttpStatusCode.Ok,
                    data: {
                        ...mockedData,
                        startAt: 1,
                        maxResults: 1,
                        issues: mockedData.issues?.slice(1, 2),
                    },
                    headers: {},
                    statusText: HttpStatusCode[HttpStatusCode.Ok],
                    config: {
                        headers: new AxiosHeaders(),
                    },
                });
                restClient.post.onCall(4).resolves({
                    status: HttpStatusCode.Ok,
                    data: {
                        ...mockedData,
                        startAt: 2,
                        maxResults: 3,
                        issues: mockedData.issues?.slice(2),
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
                await expect(client.search({})).to.eventually.be.rejectedWith(
                    "Failed to search for issues"
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
                        status: HttpStatusCode.NoContent,
                        data: undefined,
                        headers: {},
                        statusText: HttpStatusCode[HttpStatusCode.NoContent],
                        config: {
                            headers: new AxiosHeaders(),
                        },
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
                    "editIssue"
                );
            });
        });

        it("logs progress", async () => {
            const clock = useFakeTimers();
            const mockedData = JSON.parse(
                fs.readFileSync("./test/resources/fixtures/jira/responses/getFields.json", "utf-8")
            ) as FieldDetail[];
            const logger = getMockedLogger();
            restClient.get.onFirstCall().returns(
                new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({
                            status: HttpStatusCode.Ok,
                            data: mockedData.slice(0, 2),
                            headers: {},
                            statusText: HttpStatusCode[HttpStatusCode.Ok],
                            config: {
                                headers: new AxiosHeaders(),
                            },
                        });
                    }, 23000);
                })
            );
            const responsePromise = client.getFields();
            await clock.tickAsync(27000);
            await responsePromise;
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Waiting for https://example.org to respond... (10 seconds)"
            );
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Waiting for https://example.org to respond... (20 seconds)"
            );
        });
    });
});
