import * as BaseAxios from "axios";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { stub, useFakeTimers } from "sinon";
import { getMockedLogger } from "../../../test/mocks";
import { Level } from "../../util/logging";
import { AxiosRestClient } from "./requests";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    beforeEach(() => {
        BaseAxios.default.interceptors.request.clear();
        BaseAxios.default.interceptors.response.clear();
    });

    describe("get", () => {
        it("returns the response", async () => {
            const response: BaseAxios.AxiosResponse<string> = {
                config: {
                    headers: new BaseAxios.AxiosHeaders(),
                },
                data: "Example domain 123",
                headers: {},
                status: BaseAxios.HttpStatusCode.Ok,
                statusText: BaseAxios.HttpStatusCode[BaseAxios.HttpStatusCode.Ok],
            };
            const restClient = stub(BaseAxios.default.create());
            stub(BaseAxios.default, "create").returns(restClient);
            restClient.get.resolves(response);
            const client = new AxiosRestClient();
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

            const client = new AxiosRestClient({ debug: true });
            await expect(client.get("https://localhost:1234")).to.eventually.be.rejected;
            expect(logger.message).to.have.been.calledTwice;

            const requestBody = JSON.parse(logger.logToFile.getCall(0).args[0]) as unknown;
            expect(requestBody).to.have.property("url", "https://localhost:1234");
            expect(requestBody).to.not.have.property("params");
            expect(requestBody).to.not.have.property("body");
            expect(logger.logToFile.getCall(0).args[1]).to.eq(
                "12345_GET_https_localhost_1234_request.json"
            );

            const error = JSON.parse(logger.logToFile.getCall(1).args[0]) as BaseAxios.AxiosError;
            expect(error.code).to.eq("ECONNREFUSED");
            expect(error.config?.url).to.eq("https://localhost:1234");
            expect(error.config?.method).to.eq("get");
            expect(logger.logToFile.getCall(1).args[1]).to.eq(
                "12345_GET_https_localhost_1234_response.json"
            );
        });

        it("does not write to a file on encountering axios errors if debug is disabled", async () => {
            const logger = getMockedLogger();
            const client = new AxiosRestClient();
            await expect(client.get("https://localhost:1234")).to.eventually.be.rejected;
            expect(logger.message).to.not.have.been.called;
            expect(logger.logToFile).to.not.have.been.called;
        });
    });

    describe("post", () => {
        it("returns the response", async () => {
            const client = new AxiosRestClient();
            const response: BaseAxios.AxiosResponse<string> = {
                config: {
                    headers: new BaseAxios.AxiosHeaders(),
                },
                data: "Example domain 123",
                headers: {},
                status: BaseAxios.HttpStatusCode.Ok,
                statusText: BaseAxios.HttpStatusCode[BaseAxios.HttpStatusCode.Ok],
            };
            const restClient = stub(BaseAxios.default.create());
            stub(BaseAxios.default, "create").returns(restClient);
            restClient.post.resolves(response);
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

            const client = new AxiosRestClient({ debug: true });
            await expect(
                client.post("https://localhost:1234", {
                    five: 6,
                    hello: "!",
                    seven: [1, 2, 3],
                    there: "!",
                })
            ).to.eventually.be.rejected;
            expect(logger.message).to.have.been.calledTwice;

            const requestBody = JSON.parse(logger.logToFile.getCall(0).args[0]) as unknown;
            expect(requestBody).to.have.property("url", "https://localhost:1234");
            expect(requestBody).to.not.have.property("params");
            expect(requestBody).to.have.deep.property("body", {
                five: 6,
                hello: "!",
                seven: [1, 2, 3],
                there: "!",
            });
            expect(logger.logToFile.getCall(0).args[1]).to.eq(
                "12345_POST_https_localhost_1234_request.json"
            );

            const error = JSON.parse(logger.logToFile.getCall(1).args[0]) as BaseAxios.AxiosError;
            expect(error.code).to.eq("ECONNREFUSED");
            expect(error.config?.url).to.eq("https://localhost:1234");
            expect(error.config?.method).to.eq("post");
            expect(logger.logToFile.getCall(1).args[1]).to.eq(
                "12345_POST_https_localhost_1234_response.json"
            );
        });

        it("does not write to a file on encountering axios errors if debug is disabled", async () => {
            const logger = getMockedLogger();
            const client = new AxiosRestClient();
            await expect(client.get("https://localhost:1234")).to.eventually.be.rejected;
            expect(logger.message).to.not.have.been.called;
            expect(logger.logToFile).to.not.have.been.called;
        });
    });

    describe("put", () => {
        it("returns the response", async () => {
            const client = new AxiosRestClient();
            const response: BaseAxios.AxiosResponse<string> = {
                config: {
                    headers: new BaseAxios.AxiosHeaders(),
                },
                data: "Example domain 123",
                headers: {},
                status: BaseAxios.HttpStatusCode.Ok,
                statusText: BaseAxios.HttpStatusCode[BaseAxios.HttpStatusCode.Ok],
            };
            const restClient = stub(BaseAxios.default.create());
            stub(BaseAxios.default, "create").returns(restClient);
            restClient.put.resolves(response);
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

            const client = new AxiosRestClient({ debug: true });
            await expect(
                client.put("https://localhost:1234", {
                    five: 6,
                    hello: "!",
                    seven: [1, 2, 3],
                    there: "!",
                })
            ).to.eventually.be.rejected;
            expect(logger.message).to.have.been.calledTwice;

            const requestBody = JSON.parse(logger.logToFile.getCall(0).args[0]) as unknown;
            expect(requestBody).to.have.property("url", "https://localhost:1234");
            expect(requestBody).to.not.have.property("params");
            expect(requestBody).to.have.deep.property("body", {
                five: 6,
                hello: "!",
                seven: [1, 2, 3],
                there: "!",
            });
            expect(logger.logToFile.getCall(0).args[1]).to.eq(
                "12345_PUT_https_localhost_1234_request.json"
            );

            const error = JSON.parse(logger.logToFile.getCall(1).args[0]) as BaseAxios.AxiosError;
            expect(error.code).to.eq("ECONNREFUSED");
            expect(error.config?.url).to.eq("https://localhost:1234");
            expect(error.config?.method).to.eq("put");
            expect(logger.logToFile.getCall(1).args[1]).to.eq(
                "12345_PUT_https_localhost_1234_response.json"
            );
        });

        it("does not write to a file on encountering axios errors if debug is disabled", async () => {
            const logger = getMockedLogger();
            const client = new AxiosRestClient();
            await expect(client.get("https://localhost:1234")).to.eventually.be.rejected;
            expect(logger.message).to.not.have.been.called;
            expect(logger.logToFile).to.not.have.been.called;
        });
    });
});
