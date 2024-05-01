import * as BaseAxios from "axios";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { stub, useFakeTimers } from "sinon";
import { getMockedLogger } from "../../test/mocks";
import { Level } from "../logging/logging";
import { AxiosRestClient } from "./requests";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    beforeEach(() => {
        BaseAxios.default.interceptors.request.clear();
        BaseAxios.default.interceptors.response.clear();
    });

    describe("get", () => {
        it("throws if init was not called", async () => {
            const client = new AxiosRestClient();
            await expect(client.get("https://example.org")).to.eventually.be.rejectedWith(
                "Requests module has not been initialized"
            );
        });

        it("returns the response", async () => {
            const response: BaseAxios.AxiosResponse<string> = {
                status: BaseAxios.HttpStatusCode.Ok,
                data: "Example domain 123",
                headers: {},
                statusText: BaseAxios.HttpStatusCode[BaseAxios.HttpStatusCode.Ok],
                config: {
                    headers: new BaseAxios.AxiosHeaders(),
                },
            };
            stub(BaseAxios.default, "get").resolves(response);
            const client = new AxiosRestClient();
            client.init({});
            expect(await client.get("https://example.org")).to.deep.contain(response);
        });

        it("writes to a file on encountering axios errors if debug is enabled", async () => {
            const logger = getMockedLogger();
            logger.message.withArgs(Level.DEBUG, "Request:  request.json").onFirstCall().returns();
            logger.message
                .withArgs(Level.DEBUG, "Response: response.json")
                .onSecondCall()
                .returns();
            logger.logToFile.onFirstCall().returns("request.json");
            logger.logToFile.onSecondCall().returns("response.json");
            useFakeTimers(new Date(12345));

            const client = new AxiosRestClient();
            client.init({ debug: true });
            await expect(client.get("https://localhost:1234")).to.eventually.be.rejected;
            expect(logger.message).to.have.been.calledTwice;
            expect(logger.logToFile).to.have.been.calledWithMatch(
                {
                    url: "https://localhost:1234",
                    params: undefined,
                    body: undefined,
                },
                "12345_GET_https_localhost_1234_request.json"
            );
            expect(logger.logToFile).to.have.been.calledWithMatch(
                {
                    code: "ECONNREFUSED",
                    config: {
                        url: "https://localhost:1234",
                        method: "get",
                    },
                },
                "12345_GET_https_localhost_1234_response.json"
            );
        });

        it("does not write to a file on encountering axios errors if debug is disabled", async () => {
            const logger = getMockedLogger();
            const client = new AxiosRestClient();
            client.init({});
            await expect(client.get("https://localhost:1234")).to.eventually.be.rejected;
            expect(logger.message).to.not.have.been.called;
            expect(logger.logToFile).to.not.have.been.called;
        });
    });

    describe("post", () => {
        it("throws if init was not called", async () => {
            const client = new AxiosRestClient();
            await expect(client.post("https://example.org")).to.eventually.be.rejectedWith(
                "Requests module has not been initialized"
            );
        });

        it("returns the response", async () => {
            const client = new AxiosRestClient();
            client.init({});
            const response: BaseAxios.AxiosResponse<string> = {
                status: BaseAxios.HttpStatusCode.Ok,
                data: "Example domain 123",
                headers: {},
                statusText: BaseAxios.HttpStatusCode[BaseAxios.HttpStatusCode.Ok],
                config: {
                    headers: new BaseAxios.AxiosHeaders(),
                },
            };
            stub(BaseAxios.default, "post").resolves(response);
            expect(await client.post("https://example.org")).to.deep.eq(response);
        });

        it("writes to a file on encountering axios errors if debug is enabled", async () => {
            const logger = getMockedLogger();
            logger.message.withArgs(Level.DEBUG, "Request:  request.json").onFirstCall().returns();
            logger.message
                .withArgs(Level.DEBUG, "Response: response.json")
                .onSecondCall()
                .returns();
            logger.logToFile.onFirstCall().returns("request.json");
            logger.logToFile.onSecondCall().returns("response.json");
            useFakeTimers(new Date(12345));

            const client = new AxiosRestClient();
            client.init({ debug: true });
            await expect(
                client.post("https://localhost:1234", {
                    hello: "!",
                    there: "!",
                    five: 6,
                    seven: [1, 2, 3],
                })
            ).to.eventually.be.rejected;
            expect(logger.message).to.have.been.calledTwice;
            expect(logger.logToFile).to.have.been.calledWithMatch(
                {
                    url: "https://localhost:1234",
                    params: undefined,
                    body: {
                        hello: "!",
                        there: "!",
                        five: 6,
                        seven: [1, 2, 3],
                    },
                },
                "12345_POST_https_localhost_1234_request.json"
            );
            expect(logger.logToFile).to.have.been.calledWithMatch(
                {
                    code: "ECONNREFUSED",
                    config: {
                        url: "https://localhost:1234",
                        method: "post",
                    },
                },
                "12345_POST_https_localhost_1234_response.json"
            );
        });

        it("does not write to a file on encountering axios errors if debug is disabled", async () => {
            const logger = getMockedLogger();
            const client = new AxiosRestClient();
            client.init({});
            await expect(client.get("https://localhost:1234")).to.eventually.be.rejected;
            expect(logger.message).to.not.have.been.called;
            expect(logger.logToFile).to.not.have.been.called;
        });
    });

    describe("put", () => {
        it("throws if init was not called", async () => {
            const client = new AxiosRestClient();
            await expect(client.put("https://example.org")).to.eventually.be.rejectedWith(
                "Requests module has not been initialized"
            );
        });

        it("returns the response", async () => {
            const client = new AxiosRestClient();
            client.init({});
            const response: BaseAxios.AxiosResponse<string> = {
                status: BaseAxios.HttpStatusCode.Ok,
                data: "Example domain 123",
                headers: {},
                statusText: BaseAxios.HttpStatusCode[BaseAxios.HttpStatusCode.Ok],
                config: {
                    headers: new BaseAxios.AxiosHeaders(),
                },
            };
            stub(BaseAxios.default, "put").resolves(response);
            expect(await client.put("https://example.org")).to.deep.eq(response);
        });

        it("writes to a file on encountering axios errors if debug is enabled", async () => {
            const logger = getMockedLogger();
            logger.message.withArgs(Level.DEBUG, "Request:  request.json").onFirstCall().returns();
            logger.message
                .withArgs(Level.DEBUG, "Response: response.json")
                .onSecondCall()
                .returns();
            logger.logToFile.onFirstCall().returns("request.json");
            logger.logToFile.onSecondCall().returns("response.json");
            useFakeTimers(new Date(12345));

            const client = new AxiosRestClient();
            client.init({ debug: true });
            await expect(
                client.put("https://localhost:1234", {
                    hello: "!",
                    there: "!",
                    five: 6,
                    seven: [1, 2, 3],
                })
            ).to.eventually.be.rejected;
            expect(logger.message).to.have.been.calledTwice;
            expect(logger.logToFile).to.have.been.calledWithMatch(
                {
                    url: "https://localhost:1234",
                    params: undefined,
                    body: {
                        hello: "!",
                        there: "!",
                        five: 6,
                        seven: [1, 2, 3],
                    },
                },
                "12345_PUT_https_localhost_1234_request.json"
            );
            expect(logger.logToFile).to.have.been.calledWithMatch(
                {
                    code: "ECONNREFUSED",
                    config: {
                        url: "https://localhost:1234",
                        method: "put",
                    },
                },
                "12345_PUT_https_localhost_1234_response.json"
            );
        });

        it("does not write to a file on encountering axios errors if debug is disabled", async () => {
            const logger = getMockedLogger();
            const client = new AxiosRestClient();
            client.init({});
            await expect(client.get("https://localhost:1234")).to.eventually.be.rejected;
            expect(logger.message).to.not.have.been.called;
            expect(logger.logToFile).to.not.have.been.called;
        });
    });
});
