import { AxiosError, AxiosHeaders, HttpStatusCode } from "axios";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { useFakeTimers } from "sinon";
import { getMockedLogger, getMockedRestClient } from "../../../test/mocks";
import { dedent } from "../../util/dedent";
import { Level } from "../../util/logging";
import { JwtCredentials } from "./credentials";

chai.use(chaiAsPromised);

describe("credentials", () => {
    describe(JwtCredentials.name, () => {
        let credentials: JwtCredentials = new JwtCredentials("id", "secret", "https://example.org");

        beforeEach(() => {
            credentials = new JwtCredentials("id", "secret", "https://example.org");
        });

        describe(credentials.getAuthorizationHeader.name, () => {
            it("returns authorization headers", async () => {
                getMockedLogger({ allowUnstubbedCalls: true });
                const restClient = getMockedRestClient();
                restClient.post.onFirstCall().resolves({
                    status: HttpStatusCode.Found,
                    data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                    headers: {},
                    statusText: HttpStatusCode[HttpStatusCode.Found],
                    config: { headers: new AxiosHeaders() },
                });
                await expect(credentials.getAuthorizationHeader()).to.eventually.deep.eq({
                    ["Authorization"]:
                        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                });
            });

            it("authorizes once only", async () => {
                getMockedLogger({ allowUnstubbedCalls: true });
                const restClient = getMockedRestClient();
                restClient.post.resolves({
                    status: HttpStatusCode.Found,
                    data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                    headers: {},
                    statusText: HttpStatusCode[HttpStatusCode.Found],
                    config: { headers: new AxiosHeaders() },
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
                const restClient = getMockedRestClient();
                restClient.post.onFirstCall().resolves({
                    status: HttpStatusCode.Found,
                    data: "<div>Demo Page</div>",
                    headers: {},
                    statusText: HttpStatusCode[HttpStatusCode.Found],
                    config: { headers: new AxiosHeaders() },
                });
                await expect(credentials.getAuthorizationHeader()).to.eventually.be.rejectedWith(
                    "Expected to receive a JWT token, but did not"
                );
            });

            it("handles bad responses", async () => {
                const logger = getMockedLogger({ allowUnstubbedCalls: true });
                const restClient = getMockedRestClient();
                restClient.post.onFirstCall().rejects(
                    new AxiosError(
                        "Request failed with status code 404",
                        HttpStatusCode.BadRequest.toString(),
                        undefined,
                        null,
                        {
                            status: HttpStatusCode.NotFound,
                            statusText: HttpStatusCode[HttpStatusCode.NotFound],
                            config: { headers: new AxiosHeaders() },
                            headers: {},
                            data: {
                                errorMessages: ["not found"],
                            },
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

                        Request failed with status code 404
                    `)
                );
            });

            it("logs progress", async () => {
                const clock = useFakeTimers();
                const logger = getMockedLogger();
                const restClient = getMockedRestClient();
                restClient.post.onFirstCall().returns(
                    new Promise((resolve) => {
                        setTimeout(() => {
                            resolve({
                                status: HttpStatusCode.Found,
                                data: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
                                headers: {},
                                statusText: HttpStatusCode[HttpStatusCode.Found],
                                config: { headers: new AxiosHeaders() },
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
