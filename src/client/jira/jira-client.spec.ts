import axios, { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import type { Attachment } from "../../types/jira/responses/attachment";
import type { IssueTypeDetails } from "../../types/jira/responses/issue-type-details";
import type { SearchResults } from "../../types/jira/responses/search-results";
import type { User } from "../../types/jira/responses/user";
import type { Logger } from "../../util/logging";
import { Level, LOG } from "../../util/logging";
import { BasicAuthCredentials } from "../authentication/credentials";
import { AxiosRestClient } from "../https/requests";
import { BaseJiraClient } from "./jira-client";

describe(relative(cwd(), __filename), async () => {
    await describe(BaseJiraClient.name, async () => {
        let client: BaseJiraClient;
        let restClient: AxiosRestClient;

        beforeEach(() => {
            restClient = new AxiosRestClient(axios);
            client = new BaseJiraClient(
                "http://localhost:1234",
                new BasicAuthCredentials("user", "token"),
                restClient
            );
        });

        await describe("add attachment", async () => {
            await it("should use the correct headers", async (context) => {
                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: {
                            headers: new AxiosHeaders(),
                        },
                        data: JSON.parse(
                            readFileSync(
                                "./test/resources/fixtures/jira/responses/singleAttachment.json",
                                "utf-8"
                            )
                        ) as Attachment,
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                await client.addAttachment("CYP-123", "./test/resources/turtle.png");
                const headers = post.mock.calls[0].arguments[2]?.headers;
                assert.ok(headers);
                assert.strictEqual(headers.Authorization, "Basic dXNlcjp0b2tlbg==");
                assert.strictEqual(headers["X-Atlassian-Token"], "no-check");
                assert.match(headers["content-type"] as string, /multipart\/form-data; .+/);
            });

            await describe("single file attachment", async () => {
                await it("returns the correct values", async (context) => {
                    const mockedData = JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/jira/responses/singleAttachment.json",
                            "utf-8"
                        )
                    ) as unknown;
                    context.mock.method(restClient, "post", () => {
                        return {
                            config: {
                                headers: new AxiosHeaders(),
                            },
                            data: mockedData,
                            headers: {},
                            status: HttpStatusCode.Ok,
                            statusText: HttpStatusCode[HttpStatusCode.Ok],
                        };
                    });
                    const response = await client.addAttachment(
                        "CYP-123",
                        "./test/resources/turtle.png"
                    );
                    assert.strictEqual(response, mockedData);
                });
            });

            await describe("multiple file attachment", async () => {
                await it("returns the correct values", async (context) => {
                    const mockedData = JSON.parse(
                        readFileSync(
                            "./test/resources/fixtures/jira/responses/multipleAttachments.json",
                            "utf-8"
                        )
                    ) as unknown;
                    context.mock.method(restClient, "post", () => {
                        return {
                            config: {
                                headers: new AxiosHeaders(),
                            },
                            data: mockedData,
                            headers: {},
                            status: HttpStatusCode.Ok,
                            statusText: HttpStatusCode[HttpStatusCode.Ok],
                        };
                    });
                    const response = await client.addAttachment(
                        "CYP-123",
                        "./test/resources/turtle.png",
                        "./test/resources/greetings.txt"
                    );
                    assert.strictEqual(response, mockedData);
                });
            });

            await it("logs missing files", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());

                const mockedData = JSON.parse(
                    readFileSync(
                        "./test/resources/fixtures/jira/responses/singleAttachment.json",
                        "utf-8"
                    )
                ) as unknown;
                context.mock.method(restClient, "post", () => {
                    return {
                        config: {
                            headers: new AxiosHeaders(),
                        },
                        data: mockedData,
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const response = await client.addAttachment(
                    "CYP-123",
                    "./test/resources/missingGreetings.txt",
                    "./test/resources/turtle.png"
                );
                assert.strictEqual(response, mockedData);
                assert.deepStrictEqual(message.mock.calls[0].arguments, [
                    Level.WARNING,
                    "File does not exist:",
                    "./test/resources/missingGreetings.txt",
                ]);
            });

            await it("skips missing files", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const mockedData = JSON.parse(
                    readFileSync(
                        "./test/resources/fixtures/jira/responses/multipleAttachments.json",
                        "utf-8"
                    )
                ) as unknown;
                context.mock.method(restClient, "post", () => {
                    return {
                        config: {
                            headers: new AxiosHeaders(),
                        },
                        data: mockedData,
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const response = await client.addAttachment(
                    "CYP-123",
                    "./test/resources/turtle.png",
                    "./test/resources/missingGreetings.txt",
                    "./test/resources/greetings.txt"
                );
                assert.strictEqual(response, mockedData);
            });

            await it("immediately returns an empty array when all files are missing", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());

                const response = await client.addAttachment(
                    "CYP-123",
                    "./test/resources/missingGreetings.txt",
                    "./test/resources/missingSomething.png"
                );
                assert.deepStrictEqual(response, []);
                assert.deepStrictEqual(message.mock.calls[2].arguments, [
                    Level.WARNING,
                    "All files do not exist. Skipping attaching.",
                ]);
            });

            await it("immediately returns an empty array when no files are provided", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                assert.deepStrictEqual(await client.addAttachment("CYP-123"), []);
                assert.deepStrictEqual(message.mock.calls[0].arguments, [
                    Level.WARNING,
                    "No files provided to attach to issue CYP-123. Skipping attaching.",
                ]);
            });

            await it("handles bad responses", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const logErrorToFile = context.mock.method(
                    LOG,
                    "logErrorToFile",
                    context.mock.fn<Logger["logToFile"]>()
                );
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
                context.mock.method(restClient, "post", () => {
                    throw error;
                });
                await assert.rejects(
                    client.addAttachment("CYP-123", "./test/resources/greetings.txt"),
                    { message: "Failed to attach files" }
                );
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.ERROR,
                    "Failed to attach files: Request failed with status code 413",
                ]);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "addAttachmentError",
                ]);
            });
        });

        await describe("get issue types", async () => {
            await it("returns issue types", async (context) => {
                const issueTypes = JSON.parse(
                    readFileSync(
                        "./test/resources/fixtures/jira/responses/getIssueTypes.json",
                        "utf-8"
                    )
                ) as IssueTypeDetails[];
                context.mock.method(restClient, "get", () => {
                    return {
                        config: {
                            headers: new AxiosHeaders(),
                        },
                        data: issueTypes,
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                assert.strictEqual(await client.getIssueTypes(), issueTypes);
            });

            await it("handles issues without name or id", async (context) => {
                const issueTypes: IssueTypeDetails[] = [
                    { id: "12345" },
                    { name: "Custom issue" },
                    { description: "A legacy subtask" },
                ];
                context.mock.method(restClient, "get", () => {
                    return {
                        config: {
                            headers: new AxiosHeaders(),
                        },
                        data: issueTypes,
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                assert.strictEqual(await client.getIssueTypes(), issueTypes);
            });

            await it("handles bad responses", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const logErrorToFile = context.mock.method(
                    LOG,
                    "logErrorToFile",
                    context.mock.fn<Logger["logToFile"]>()
                );
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
                context.mock.method(restClient, "get", () => {
                    throw error;
                });
                await assert.rejects(client.getIssueTypes(), {
                    message: "Failed to get issue types",
                });
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.ERROR,
                    "Failed to get issue types: Request failed with status code 409",
                ]);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "getIssueTypesError",
                ]);
            });
        });

        await describe("get fields", async () => {
            await it("returns the correct values", async (context) => {
                const mockedData = JSON.parse(
                    readFileSync("./test/resources/fixtures/jira/responses/getFields.json", "utf-8")
                ) as unknown;
                context.mock.method(restClient, "get", () => {
                    return {
                        config: {
                            headers: new AxiosHeaders(),
                        },
                        data: mockedData,
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const fields = await client.getFields();
                assert.strictEqual(fields, mockedData);
            });

            await it("handles bad responses", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const logErrorToFile = context.mock.method(
                    LOG,
                    "logErrorToFile",
                    context.mock.fn<Logger["logToFile"]>()
                );
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
                context.mock.method(restClient, "get", () => {
                    throw error;
                });
                await assert.rejects(client.getFields(), { message: "Failed to get fields" });
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.ERROR,
                    "Failed to get fields: Request failed with status code 409",
                ]);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "getFieldsError",
                ]);
            });
        });

        await describe("get myself", async () => {
            await it("returns user details", async (context) => {
                const get = context.mock.method(restClient, "get", () => {
                    return {
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
                    };
                });
                assert.deepStrictEqual(await client.getMyself(), {
                    active: true,
                    displayName: "Demo User",
                });
                assert.strictEqual(get.mock.callCount(), 1);
                assert.deepStrictEqual(get.mock.calls[0].arguments, [
                    "http://localhost:1234/rest/api/latest/myself",
                    {
                        headers: { ["Authorization"]: "Basic dXNlcjp0b2tlbg==" },
                    },
                ]);
            });

            await it("handles bad responses", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const logErrorToFile = context.mock.method(
                    LOG,
                    "logErrorToFile",
                    context.mock.fn<Logger["logToFile"]>()
                );
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
                context.mock.method(restClient, "get", () => {
                    throw error;
                });
                await assert.rejects(client.getMyself(), { message: "Failed to get user details" });
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.ERROR,
                    "Failed to get user details: Request failed with status code 409",
                ]);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "getMyselfError",
                ]);
            });
        });

        await describe("search", async () => {
            await it("should return all issues without pagination", async (context) => {
                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: {
                            headers: new AxiosHeaders(),
                        },
                        data: JSON.parse(
                            readFileSync(
                                "./test/resources/fixtures/jira/responses/search.json",
                                "utf-8"
                            )
                        ) as SearchResults,
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const response = await client.search({
                    fields: ["customfield_12100"],
                    jql: "project = CYP AND issue in (CYP-268,CYP-237,CYP-332,CYP-333,CYP-338)",
                });
                assert.strictEqual(post.mock.callCount(), 1);
                assert.strictEqual(response.length, 4);
                assert.strictEqual(response[0].key, "CYP-333");
                assert.strictEqual(response[1].key, "CYP-338");
                assert.strictEqual(response[2].key, "CYP-332");
                assert.strictEqual(response[3].key, "CYP-268");
            });

            await it("returns all issues with pagination", async (context) => {
                const mockedData: SearchResults = JSON.parse(
                    readFileSync("./test/resources/fixtures/jira/responses/search.json", "utf-8")
                ) as SearchResults;
                let i = 0;
                const post = context.mock.method(restClient, "post", () => {
                    switch (i++) {
                        case 0:
                            return {
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
                            };
                        case 1:
                            return {
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
                            };
                        case 2:
                            return {
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
                            };
                        case 3:
                            return {
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
                            };
                        case 4:
                            return {
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
                            };
                    }
                });
                const response = await client.search({
                    fields: ["customfield_12100"],
                    jql: "project = CYP AND issue in (CYP-268,CYP-237,CYP-332,CYP-333,CYP-338)",
                });
                assert.strictEqual(post.mock.callCount(), 5);
                assert.strictEqual(
                    (post.mock.calls[0].arguments[1] as Record<string, unknown>).startAt,
                    0
                );
                assert.strictEqual(
                    (post.mock.calls[1].arguments[1] as Record<string, unknown>).startAt,
                    1
                );
                assert.strictEqual(
                    (post.mock.calls[2].arguments[1] as Record<string, unknown>).startAt,
                    1
                );
                assert.strictEqual(
                    (post.mock.calls[3].arguments[1] as Record<string, unknown>).startAt,
                    1
                );
                assert.strictEqual(
                    (post.mock.calls[4].arguments[1] as Record<string, unknown>).startAt,
                    2
                );
                assert.strictEqual(response.length, 4);
                assert.strictEqual(response[0].key, "CYP-333");
                assert.strictEqual(response[1].key, "CYP-338");
                assert.strictEqual(response[2].key, "CYP-332");
                assert.strictEqual(response[3].key, "CYP-268");
            });

            await it("handles bad responses", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const logErrorToFile = context.mock.method(
                    LOG,
                    "logErrorToFile",
                    context.mock.fn<Logger["logToFile"]>()
                );
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
                context.mock.method(restClient, "post", () => {
                    throw error;
                });
                await assert.rejects(client.search({}), { message: "Failed to search issues" });
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.ERROR,
                    "Failed to search issues: Request failed with status code 401",
                ]);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "searchError",
                ]);
            });
        });

        await describe("editIssue", async () => {
            await it("edits issues", async (context) => {
                const put = context.mock.method(restClient, "put", () => {
                    return {
                        config: {
                            headers: new AxiosHeaders(),
                        },
                        data: undefined,
                        headers: {},
                        status: HttpStatusCode.NoContent,
                        statusText: HttpStatusCode[HttpStatusCode.NoContent],
                    };
                });
                assert.strictEqual(
                    await client.editIssue("CYP-XYZ", {
                        fields: { summary: "Hi" },
                    }),
                    "CYP-XYZ"
                );
                assert.strictEqual(put.mock.callCount(), 1);
                assert.strictEqual(
                    put.mock.calls[0].arguments[0],
                    "http://localhost:1234/rest/api/latest/issue/CYP-XYZ"
                );
                assert.deepStrictEqual(put.mock.calls[0].arguments[1], {
                    fields: { summary: "Hi" },
                });
            });

            await it("handles bad responses", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const logErrorToFile = context.mock.method(
                    LOG,
                    "logErrorToFile",
                    context.mock.fn<Logger["logToFile"]>()
                );
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
                context.mock.method(restClient, "put", () => {
                    throw error;
                });
                await assert.rejects(
                    client.editIssue("CYP-XYZ", {
                        fields: { summary: "Hi" },
                    }),
                    { message: "Failed to edit issue" }
                );
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.ERROR,
                    "Failed to edit issue: Request failed with status code 400",
                ]);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "editIssueError",
                ]);
            });
        });

        await describe("transitionIssue", async () => {
            await it("transitions issues", async (context) => {
                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: {
                            headers: new AxiosHeaders(),
                        },
                        data: undefined,
                        headers: {},
                        status: HttpStatusCode.NoContent,
                        statusText: HttpStatusCode[HttpStatusCode.NoContent],
                    };
                });
                await client.transitionIssue("CYP-XYZ", {
                    transition: {
                        name: "resolve",
                        to: {
                            name: "done",
                        },
                    },
                });
                assert.strictEqual(post.mock.callCount(), 1);
                assert.deepStrictEqual(post.mock.calls[0].arguments, [
                    "http://localhost:1234/rest/api/latest/issue/CYP-XYZ/transitions",
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
                    },
                ]);
            });

            await it("handles bad responses", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const logErrorToFile = context.mock.method(
                    LOG,
                    "logErrorToFile",
                    context.mock.fn<Logger["logToFile"]>()
                );
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
                context.mock.method(restClient, "post", () => {
                    throw error;
                });
                await assert.rejects(
                    client.transitionIssue("CYP-XYZ", {
                        transition: {
                            name: "resolve",
                            to: {
                                name: "done",
                            },
                        },
                    }),
                    { message: "Failed to transition issue" }
                );
                assert.deepStrictEqual(message.mock.calls[1].arguments, [
                    Level.ERROR,
                    "Failed to transition issue: Request failed with status code 404",
                ]);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "transitionIssueError",
                ]);
            });
        });
    });
});
