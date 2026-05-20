import axios, { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import { LOG } from "../../util/logging";
import { AxiosRestClient } from "../https/requests";
import { JwtCredentials } from "./credentials";

void describe(relative(cwd(), __filename), () => {
    void describe(JwtCredentials.name, () => {
        let restClient: AxiosRestClient;
        let credentials: JwtCredentials;

        beforeEach(() => {
            restClient = new AxiosRestClient(axios);
            credentials = new JwtCredentials("id", "secret", "http://localhost:1234", restClient);
        });

        void describe(JwtCredentials.prototype.getAuthorizationHeader.name, () => {
            void it("returns authorization headers", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                        headers: {},
                        status: HttpStatusCode.Found,
                        statusText: HttpStatusCode[HttpStatusCode.Found],
                    };
                });

                assert.deepEqual(await credentials.getAuthorizationHeader(), {
                    ["Authorization"]:
                        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                });
            });

            void it("authorizes once only", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const post = context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                        headers: {},
                        status: HttpStatusCode.Found,
                        statusText: HttpStatusCode[HttpStatusCode.Found],
                    };
                });

                const header1 = credentials.getAuthorizationHeader();
                const header2 = credentials.getAuthorizationHeader();
                const expectedHeader = {
                    ["Authorization"]:
                        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                };
                assert.deepEqual(await Promise.all([header1, header2]), [
                    expectedHeader,
                    expectedHeader,
                ]);
                assert.strictEqual(post.mock.callCount(), 1);
            });

            void it("handles unparseable tokens", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                context.mock.method(LOG, "logErrorToFile", context.mock.fn());
                context.mock.method(restClient, "post", () => {
                    return {
                        config: { headers: new AxiosHeaders() },
                        data: "<div>Demo Page</div>",
                        headers: {},
                        status: HttpStatusCode.Found,
                        statusText: HttpStatusCode[HttpStatusCode.Found],
                    };
                });

                await assert.rejects(credentials.getAuthorizationHeader(), {
                    message: "Failed to authenticate",
                });
            });

            void it("handles bad responses", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                context.mock.method(LOG, "logErrorToFile", context.mock.fn());
                context.mock.method(restClient, "post", () => {
                    throw new AxiosError(
                        "Request failed with status code 404",
                        HttpStatusCode.BadRequest.toString(),
                        undefined,
                        null,
                        {
                            config: { headers: new AxiosHeaders() },
                            data: {
                                errorMessages: ["not found"],
                            },
                            headers: {},
                            status: HttpStatusCode.NotFound,
                            statusText: HttpStatusCode[HttpStatusCode.NotFound],
                        }
                    );
                });
                await assert.rejects(credentials.getAuthorizationHeader(), {
                    message: "Failed to authenticate",
                });
                assert.deepEqual(message.mock.calls[1].arguments, [
                    "error",
                    "Failed to authenticate: Request failed with status code 404",
                ]);
            });
        });
    });
});
