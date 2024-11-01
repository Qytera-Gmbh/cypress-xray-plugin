import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { relative } from "path";
import { getMockedLogger, getMockedRestClient } from "../../../test/mocks.js";
import { Level } from "../../util/logging.js";
import { JwtCredentials } from "./credentials.js";

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await describe(JwtCredentials.name, async () => {
        let restClient = getMockedRestClient();
        let credentials: JwtCredentials = new JwtCredentials(
            "id",
            "secret",
            "https://example.org",
            restClient
        );

        beforeEach(() => {
            restClient = getMockedRestClient();
            credentials = new JwtCredentials("id", "secret", "https://example.org", restClient);
        });

        await describe(credentials.getAuthorizationHeader.name, async () => {
            await it("returns authorization headers", async () => {
                getMockedLogger({ allowUnstubbedCalls: true });
                restClient.post.onFirstCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                    headers: {},
                    status: HttpStatusCode.Found,
                    statusText: HttpStatusCode[HttpStatusCode.Found],
                });
                assert.deepEqual(await credentials.getAuthorizationHeader(), {
                    ["Authorization"]:
                        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                });
            });

            await it("authorizes once only", async () => {
                getMockedLogger({ allowUnstubbedCalls: true });
                restClient.post.resolves({
                    config: { headers: new AxiosHeaders() },
                    data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                    headers: {},
                    status: HttpStatusCode.Found,
                    statusText: HttpStatusCode[HttpStatusCode.Found],
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
                assert.ok(restClient.post.callCount === 1);
            });

            await it("handles unparseable tokens", async () => {
                getMockedLogger({ allowUnstubbedCalls: true });
                restClient.post.onFirstCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: "<div>Demo Page</div>",
                    headers: {},
                    status: HttpStatusCode.Found,
                    statusText: HttpStatusCode[HttpStatusCode.Found],
                });
                await assert.rejects(credentials.getAuthorizationHeader(), {
                    message: "Failed to authenticate",
                });
            });

            await it("handles bad responses", async () => {
                const logger = getMockedLogger({ allowUnstubbedCalls: true });
                restClient.post.onFirstCall().rejects(
                    new AxiosError(
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
                    )
                );
                await assert.rejects(credentials.getAuthorizationHeader(), {
                    message: "Failed to authenticate",
                });
                assert.deepEqual(logger.message.getCall(1).args, [
                    Level.ERROR,
                    "Failed to authenticate: Request failed with status code 404",
                ]);
            });
        });
    });
});
