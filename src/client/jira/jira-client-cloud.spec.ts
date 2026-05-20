import axios, { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import type { SearchResultsCloud } from "../../models/jira/responses/search-results";
import type { Logger } from "../../util/logging";
import { LOG } from "../../util/logging";
import { BasicAuthCredentials } from "../authentication/credentials";
import { AxiosRestClient } from "../https/requests";
import { JiraClientCloud } from "./jira-client-cloud";

void describe(relative(cwd(), __filename), () => {
    void describe(JiraClientCloud.name, () => {
        let client: JiraClientCloud;
        let restClient: AxiosRestClient;

        beforeEach(() => {
            restClient = new AxiosRestClient(axios);
            client = new JiraClientCloud(
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
                                "./test/resources/fixtures/jira/responses/searchCloud3.json",
                                "utf-8"
                            )
                        ) as SearchResultsCloud,
                        headers: {},
                        status: HttpStatusCode.Ok,
                        statusText: HttpStatusCode[HttpStatusCode.Ok],
                    };
                });
                const response = await client.search({
                    fields: ["id", "key"],
                    jql: "(CXP-1,CXP-2,CXP-3,CXP-4,CXP-5)",
                });
                assert.strictEqual(post.mock.callCount(), 1);
                assert.strictEqual(response.length, 5);
                assert.strictEqual(response[0].key, "CXP-5");
                assert.strictEqual(response[1].key, "CXP-4");
                assert.strictEqual(response[2].key, "CXP-3");
                assert.strictEqual(response[3].key, "CXP-2");
                assert.strictEqual(response[4].key, "CXP-1");
            });

            void it("returns all issues with pagination", async (context) => {
                let i = 0;
                const post = context.mock.method(restClient, "post", () => {
                    switch (i++) {
                        case 0:
                            return {
                                config: {
                                    headers: new AxiosHeaders(),
                                },
                                data: JSON.parse(
                                    readFileSync(
                                        "./test/resources/fixtures/jira/responses/searchCloud1.json",
                                        "utf-8"
                                    )
                                ) as SearchResultsCloud,
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                        case 1:
                            return {
                                config: {
                                    headers: new AxiosHeaders(),
                                },
                                data: JSON.parse(
                                    readFileSync(
                                        "./test/resources/fixtures/jira/responses/searchCloud2.json",
                                        "utf-8"
                                    )
                                ) as SearchResultsCloud,
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                        case 2:
                            return {
                                config: {
                                    headers: new AxiosHeaders(),
                                },
                                data: JSON.parse(
                                    readFileSync(
                                        "./test/resources/fixtures/jira/responses/searchCloud3.json",
                                        "utf-8"
                                    )
                                ) as SearchResultsCloud,
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Ok],
                            };
                    }
                });
                const response = await client.search({
                    fields: ["id", "key"],
                    jql: "(CXP-1,CXP-2,CXP-3,CXP-4,CXP-5,CXP-6,CXP-7,CXP-8,CXP-9,CXP-10,CXP-11,CXP-12,CXP-13,CXP-14,CXP-15)",
                });
                assert.strictEqual(post.mock.callCount(), 3);
                assert.strictEqual(
                    (post.mock.calls[0].arguments[1] as Record<string, unknown>).nextPageToken,
                    undefined
                );
                assert.strictEqual(
                    (post.mock.calls[1].arguments[1] as Record<string, unknown>).nextPageToken,
                    "EDIYx43FxpczIocAtNzEsQ1hQLTcyLENYUC03MyxDWFAtNzQp"
                );
                assert.strictEqual(
                    (post.mock.calls[2].arguments[1] as Record<string, unknown>).nextPageToken,
                    "EDIYx43Fxpckjhliguhsliujuik5gbi4ugbISUHBFDWFAtNzQp"
                );
                assert.strictEqual(response.length, 15);
                assert.strictEqual(response[0].key, "CXP-15");
                assert.strictEqual(response[1].key, "CXP-14");
                assert.strictEqual(response[2].key, "CXP-13");
                assert.strictEqual(response[3].key, "CXP-12");
                assert.strictEqual(response[4].key, "CXP-11");
                assert.strictEqual(response[5].key, "CXP-10");
                assert.strictEqual(response[6].key, "CXP-9");
                assert.strictEqual(response[7].key, "CXP-8");
                assert.strictEqual(response[8].key, "CXP-7");
                assert.strictEqual(response[9].key, "CXP-6");
                assert.strictEqual(response[10].key, "CXP-5");
                assert.strictEqual(response[11].key, "CXP-4");
                assert.strictEqual(response[12].key, "CXP-3");
                assert.strictEqual(response[13].key, "CXP-2");
                assert.strictEqual(response[14].key, "CXP-1");
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
