import axios, { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import type { SearchResultsServer } from "../../models/jira/responses/search-results";
import type { Logger } from "../../util/logging";
import { LOG } from "../../util/logging";
import { BasicAuthCredentials } from "../authentication/credentials";
import { AxiosRestClient } from "../https/requests";
import { JiraClientServer } from "./jira-client-server";

void describe(relative(cwd(), __filename), () => {
    void describe(JiraClientServer.name, () => {
        let client: JiraClientServer;
        let restClient: AxiosRestClient;

        beforeEach(() => {
            restClient = new AxiosRestClient(axios);
            client = new JiraClientServer(
                "http://localhost:1234",
                new BasicAuthCredentials("user", "token"),
                restClient
            );
        });

        void describe("search", () => {
            void it("should return all issues without pagination", async (context) => {
                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: {
                            headers: new AxiosHeaders(),
                        },
                        data: JSON.parse(
                            readFileSync(
                                "./test/resources/fixtures/jira/responses/searchServer.json",
                                "utf-8"
                            )
                        ) as SearchResultsServer,
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

            void it("returns all issues with pagination", async (context) => {
                const mockedData = JSON.parse(
                    readFileSync(
                        "./test/resources/fixtures/jira/responses/searchServer.json",
                        "utf-8"
                    )
                ) as SearchResultsServer;
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

            void it("handles bad responses", async (context) => {
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
                    "error",
                    "Failed to search issues: Request failed with status code 401",
                ]);
                assert.deepStrictEqual(logErrorToFile.mock.calls[0].arguments, [
                    error,
                    "searchError",
                ]);
            });
        });
    });
});
