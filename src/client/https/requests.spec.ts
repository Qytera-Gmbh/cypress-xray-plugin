import * as BaseAxios from "axios";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import FormData from "form-data";
import { Readable } from "node:stream";
import path from "path";
import { stub, useFakeTimers } from "sinon";
import { getMockedLogger } from "../../../test/mocks";
import { LOCAL_SERVER } from "../../../test/server-config";
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
            // Complicated assertion to handle different timezones on local and CI.
            const date = new Date();
            expect(logger.logToFile.getCall(0).args[1]).to.eq(
                `0${date.getHours().toString()}_00_12_GET_https_localhost_1234_request.json`
            );

            const error = JSON.parse(logger.logToFile.getCall(1).args[0]) as BaseAxios.AxiosError;
            expect(error.code).to.eq("ECONNREFUSED");
            expect(error.config?.url).to.eq("https://localhost:1234");
            expect(error.config?.method).to.eq("get");
            // Complicated assertion to handle different timezones on local and CI.
            expect(logger.logToFile.getCall(1).args[1]).to.eq(
                `0${date.getHours().toString()}_00_12_GET_https_localhost_1234_response.json`
            );
        });

        it("writes to a file on encountering axios errors if debug is disabled", async () => {
            const logger = getMockedLogger();
            const client = new AxiosRestClient();
            await expect(client.get("https://localhost:1234")).to.eventually.be.rejected;
            expect(logger.message).to.have.been.calledOnce;
            expect(logger.message).to.have.been.calledOnce;
        });

        it("logs progress", async () => {
            const clock = useFakeTimers();
            const logger = getMockedLogger();
            const stubbedAxios = stub(BaseAxios.default.create());
            stub(BaseAxios.default, "create").returns(stubbedAxios);
            const restClient = new AxiosRestClient();
            stubbedAxios.get.onFirstCall().returns(
                new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({
                            config: { headers: {} },
                            data: "<html>ok</html>",
                            headers: {},
                            status: BaseAxios.HttpStatusCode.Ok,
                            statusText: BaseAxios.HttpStatusCode[BaseAxios.HttpStatusCode.Found],
                        });
                    }, 23000);
                })
            );
            const promise = restClient.get("https://example.org");
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
            // Complicated assertion to handle different timezones on local and CI.
            const date = new Date();
            expect(logger.logToFile.getCall(0).args[1]).to.eq(
                `0${date.getHours().toString()}_00_12_POST_https_localhost_1234_request.json`
            );

            const error = JSON.parse(logger.logToFile.getCall(1).args[0]) as BaseAxios.AxiosError;
            expect(error.code).to.eq("ECONNREFUSED");
            expect(error.config?.url).to.eq("https://localhost:1234");
            expect(error.config?.method).to.eq("post");
            expect(logger.logToFile.getCall(1).args[1]).to.eq(
                `0${date.getHours().toString()}_00_12_POST_https_localhost_1234_response.json`
            );
        });

        it("writes to a file on encountering axios errors if debug is disabled", async () => {
            const logger = getMockedLogger();
            const client = new AxiosRestClient();
            await expect(client.get("https://localhost:1234")).to.eventually.be.rejected;
            expect(logger.message).to.have.been.calledOnce;
            expect(logger.logToFile).to.have.been.calledOnce;
        });

        it("logs progress", async () => {
            const clock = useFakeTimers();
            const logger = getMockedLogger();
            const stubbedAxios = stub(BaseAxios.default.create());
            stub(BaseAxios.default, "create").returns(stubbedAxios);
            const restClient = new AxiosRestClient();
            stubbedAxios.post.onFirstCall().returns(
                new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({
                            config: { headers: {} },
                            data: "<html>ok</html>",
                            headers: {},
                            status: BaseAxios.HttpStatusCode.Ok,
                            statusText: BaseAxios.HttpStatusCode[BaseAxios.HttpStatusCode.Found],
                        });
                    }, 23000);
                })
            );
            const promise = restClient.post("https://example.org");
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
            // Complicated assertion to handle different timezones on local and CI.
            const date = new Date();
            expect(logger.logToFile.getCall(0).args[1]).to.eq(
                `0${date.getHours().toString()}_00_12_PUT_https_localhost_1234_request.json`
            );

            const error = JSON.parse(logger.logToFile.getCall(1).args[0]) as BaseAxios.AxiosError;
            expect(error.code).to.eq("ECONNREFUSED");
            expect(error.config?.url).to.eq("https://localhost:1234");
            expect(error.config?.method).to.eq("put");

            expect(logger.logToFile.getCall(1).args[1]).to.eq(
                `0${date.getHours().toString()}_00_12_PUT_https_localhost_1234_response.json`
            );
        });

        it("writes to a file on encountering axios errors if debug is disabled", async () => {
            const logger = getMockedLogger();
            const client = new AxiosRestClient();
            await expect(client.get("https://localhost:1234")).to.eventually.be.rejected;
            expect(logger.message).to.have.been.calledOnce;
            expect(logger.logToFile).to.have.been.calledOnce;
        });

        it("logs progress", async () => {
            const clock = useFakeTimers();
            const logger = getMockedLogger();
            const stubbedAxios = stub(BaseAxios.default.create());
            stub(BaseAxios.default, "create").returns(stubbedAxios);
            const restClient = new AxiosRestClient();
            stubbedAxios.put.onFirstCall().returns(
                new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({
                            config: { headers: {} },
                            data: "<html>ok</html>",
                            headers: {},
                            status: BaseAxios.HttpStatusCode.Ok,
                            statusText: BaseAxios.HttpStatusCode[BaseAxios.HttpStatusCode.Found],
                        });
                    }, 23000);
                })
            );
            const promise = restClient.put("https://example.org");
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

    it("logs form data", async () => {
        const logger = getMockedLogger();
        const restClient = new AxiosRestClient({ debug: true });
        const formdata = new FormData();
        formdata.append("hello.json", JSON.stringify({ hello: "bonjour" }));
        await restClient.post(`http://${LOCAL_SERVER.url}`, formdata, {
            headers: { ...formdata.getHeaders() },
        });
        expect(logger.logToFile.firstCall.args[0]).to.contain('{\\"hello\\":\\"bonjour\\"}');
    });

    it("logs formdata only up to a certain length", async () => {
        const logger = getMockedLogger();
        const restClient = new AxiosRestClient({ debug: true, fileSizeLimit: 1 });
        const buffer = Buffer.alloc(1024 * 1024 * 1, ".");
        const formdata = new FormData();
        formdata.append("long.txt", Readable.from(buffer));
        await restClient.post(`http://${LOCAL_SERVER.url}`, formdata, {
            headers: { ...formdata.getHeaders() },
        });
        expect(logger.logToFile.firstCall.args[0]).to.contain("[... omitted due to file size]");
    });

    it("logs requests happening at the same time", async () => {
        useFakeTimers(new Date(12345));
        const logger = getMockedLogger();
        const restClient = new AxiosRestClient({ debug: true });
        await Promise.all([
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
        ]);
        // Complicated assertion to handle different timezones on local and CI.
        const date = new Date();
        expect(logger.logToFile.firstCall.args[1]).to.eq(
            `0${date.getHours().toString()}_00_12_GET_http_localhost_8080_request.json`
        );
        expect(logger.logToFile.secondCall.args[1]).to.eq(
            `0${date.getHours().toString()}_00_12_GET_http_localhost_8080_request_1.json`
        );
    });

    it("does not rate limit requests by default", async () => {
        const restClient = new AxiosRestClient({ debug: false });
        const responses = await Promise.all([
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
        ]);
        /* eslint-disable @typescript-eslint/no-unsafe-argument */
        const dateHeader0 = new Date(Number.parseInt(responses[0].headers["x-response-time"]));
        const dateHeader1 = new Date(Number.parseInt(responses[1].headers["x-response-time"]));
        const dateHeader2 = new Date(Number.parseInt(responses[2].headers["x-response-time"]));
        const dateHeader3 = new Date(Number.parseInt(responses[3].headers["x-response-time"]));
        const dateHeader4 = new Date(Number.parseInt(responses[4].headers["x-response-time"]));
        const dateHeader5 = new Date(Number.parseInt(responses[5].headers["x-response-time"]));
        const dateHeader6 = new Date(Number.parseInt(responses[6].headers["x-response-time"]));
        const dateHeader7 = new Date(Number.parseInt(responses[7].headers["x-response-time"]));
        const dateHeader8 = new Date(Number.parseInt(responses[8].headers["x-response-time"]));
        const dateHeader9 = new Date(Number.parseInt(responses[9].headers["x-response-time"]));
        /* eslint-enable @typescript-eslint/no-unsafe-argument */
        expect(dateHeader1.getTime() - dateHeader0.getTime()).to.be.approximately(0, 20);
        expect(dateHeader2.getTime() - dateHeader1.getTime()).to.be.approximately(0, 20);
        expect(dateHeader3.getTime() - dateHeader2.getTime()).to.be.approximately(0, 20);
        expect(dateHeader4.getTime() - dateHeader3.getTime()).to.be.approximately(0, 20);
        expect(dateHeader5.getTime() - dateHeader4.getTime()).to.be.approximately(0, 20);
        expect(dateHeader6.getTime() - dateHeader5.getTime()).to.be.approximately(0, 20);
        expect(dateHeader7.getTime() - dateHeader6.getTime()).to.be.approximately(0, 20);
        expect(dateHeader8.getTime() - dateHeader7.getTime()).to.be.approximately(0, 20);
        expect(dateHeader9.getTime() - dateHeader8.getTime()).to.be.approximately(0, 20);
    }).timeout(3000);

    it("rate limits requests", async () => {
        const restClient = new AxiosRestClient({ maxRequestsPerSecond: 2 });
        const responses = await Promise.all([
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
        ]);
        /* eslint-disable @typescript-eslint/no-unsafe-argument */
        const dateHeader0 = new Date(Number.parseInt(responses[0].headers["x-response-time"]));
        const dateHeader1 = new Date(Number.parseInt(responses[1].headers["x-response-time"]));
        const dateHeader2 = new Date(Number.parseInt(responses[2].headers["x-response-time"]));
        const dateHeader3 = new Date(Number.parseInt(responses[3].headers["x-response-time"]));
        const dateHeader4 = new Date(Number.parseInt(responses[4].headers["x-response-time"]));
        /* eslint-enable @typescript-eslint/no-unsafe-argument */
        expect(dateHeader1.getTime() - dateHeader0.getTime()).to.be.approximately(500, 20);
        expect(dateHeader2.getTime() - dateHeader1.getTime()).to.be.approximately(500, 20);
        expect(dateHeader3.getTime() - dateHeader2.getTime()).to.be.approximately(500, 20);
        expect(dateHeader4.getTime() - dateHeader3.getTime()).to.be.approximately(500, 20);
    }).timeout(3000);
});
