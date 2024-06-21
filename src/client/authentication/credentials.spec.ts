import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "node:path";
import { useFakeTimers } from "sinon";
import { getMockedLogger, getMockedRestClient } from "../../../test/mocks";
import { dedent } from "../../util/dedent";
import { Level } from "../../util/logging";
import { JwtCredentials } from "./credentials";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(JwtCredentials.name, () => {
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

        describe(credentials.getAuthorizationHeader.name, () => {
            it("returns authorization headers", async () => {
                getMockedLogger({ allowUnstubbedCalls: true });
                restClient.post.onFirstCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                    headers: {},
                    status: HttpStatusCode.Found,
                    statusText: HttpStatusCode[HttpStatusCode.Found],
                });
                await expect(credentials.getAuthorizationHeader()).to.eventually.deep.eq({
                    ["Authorization"]:
                        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                });
            });

            it("authorizes once only", async () => {
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
                await expect(Promise.all([header1, header2])).to.eventually.deep.eq([
                    expectedHeader,
                    expectedHeader,
                ]);
                expect(restClient.post).to.have.been.calledOnce;
            });

            it("handles unparseable tokens", async () => {
                getMockedLogger({ allowUnstubbedCalls: true });
                restClient.post.onFirstCall().resolves({
                    config: { headers: new AxiosHeaders() },
                    data: "<div>Demo Page</div>",
                    headers: {},
                    status: HttpStatusCode.Found,
                    statusText: HttpStatusCode[HttpStatusCode.Found],
                });
                await expect(credentials.getAuthorizationHeader()).to.eventually.be.rejectedWith(
                    "Authentication failed"
                );
            });

            it("handles bad responses", async () => {
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
                await expect(credentials.getAuthorizationHeader()).to.eventually.be.rejectedWith(
                    "Authentication failed"
                );
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.ERROR,
                    dedent(`
                        Failed to authenticate to: https://example.org

                          Caused by: Request failed with status code 404
                    `)
                );
            });

            it("logs progress", async () => {
                const clock = useFakeTimers();
                const logger = getMockedLogger();
                restClient.post.onFirstCall().returns(
                    new Promise((resolve) => {
                        setTimeout(() => {
                            resolve({
                                config: { headers: new AxiosHeaders() },
                                data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                                headers: {},
                                status: HttpStatusCode.Found,
                                statusText: HttpStatusCode[HttpStatusCode.Found],
                            });
                        }, 23000);
                    })
                );
                const promise = credentials.getAuthorizationHeader();
                await clock.tickAsync(27000);
                await promise;
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
});
