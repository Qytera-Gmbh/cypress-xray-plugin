import * as BaseAxios from "axios";
import FormData from "form-data";
import assert from "node:assert";
import { createReadStream } from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import { stub } from "sinon";
import { getMockedLogger } from "../../../test/mocks.js";
import { LOCAL_SERVER } from "../../../test/server-config.js";
import type { Logger } from "../../util/logging.js";
import { Level, LOG } from "../../util/logging.js";
import { AxiosRestClient } from "./https.js";

await describe(relative(cwd(), import.meta.filename), async () => {
    beforeEach(() => {
        BaseAxios.default.interceptors.request.clear();
        BaseAxios.default.interceptors.response.clear();
    });

    await describe("get", async () => {
        await it("returns the response", async () => {
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
            assert.deepStrictEqual(await client.get("https://example.org"), response);
        });

        await it("writes to a file on encountering axios errors if debug is enabled", async (context) => {
            context.mock.timers.enable({ apis: ["Date"] });
            context.mock.timers.tick(12345);

            const logger = getMockedLogger();
            logger.message.withArgs(Level.DEBUG, "Request:  request.json").onFirstCall().returns();
            logger.message
                .withArgs(Level.DEBUG, "Response: response.json")
                .onSecondCall()
                .returns();
            logger.logToFile.onFirstCall().returns("request.json");
            logger.logToFile.onSecondCall().returns("response.json");

            const client = new AxiosRestClient({ debug: true });
            await assert.rejects(client.get("https://localhost:1234"));
            assert.strictEqual(logger.message.callCount, 2);

            const requestBody = JSON.parse(logger.logToFile.getCall(0).args[0]) as unknown;
            assert.deepStrictEqual(requestBody, {
                headers: {
                    ["Accept"]: "application/json, text/plain, */*",
                },
                url: "https://localhost:1234",
            });
            // Complicated assertion to handle different timezones on local and CI.
            const date = new Date();
            assert.strictEqual(
                logger.logToFile.getCall(0).args[1],
                `0${date.getHours().toString()}_00_12_GET_https_localhost_1234_request.json`
            );

            const error = JSON.parse(logger.logToFile.getCall(1).args[0]) as BaseAxios.AxiosError;
            assert.strictEqual(error.code, "ECONNREFUSED");
            assert.strictEqual(error.config?.url, "https://localhost:1234");
            assert.strictEqual(error.config.method, "get");
            // Complicated assertion to handle different timezones on local and CI.
            assert.strictEqual(
                logger.logToFile.getCall(1).args[1],
                `0${date.getHours().toString()}_00_12_GET_https_localhost_1234_response.json`
            );
        });

        await it("writes to a file on encountering axios errors if debug is disabled", async () => {
            const logger = getMockedLogger();
            const client = new AxiosRestClient();
            await assert.rejects(client.get("https://localhost:1234"));
            assert.strictEqual(logger.message.callCount, 1);
            assert.strictEqual(logger.logToFile.callCount, 1);
        });

        await it("logs progress", async (context) => {
            context.mock.timers.enable({ apis: ["Date", "setTimeout", "setInterval"] });

            const message = context.mock.method(LOG, "message", context.mock.fn());

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

            await Promise.resolve();
            context.mock.timers.tick(27000);
            await promise;

            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.INFO,
                "Waiting for https://example.org to respond... (10 seconds)",
            ]);
            assert.deepStrictEqual(message.mock.calls[1].arguments, [
                Level.INFO,
                "Waiting for https://example.org to respond... (20 seconds)",
            ]);
        });
    });

    await describe("post", async () => {
        await it("returns the response", async () => {
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
            assert.deepStrictEqual(await client.post("https://example.org"), response);
        });

        await it("writes to a file on encountering axios errors if debug is enabled", async (context) => {
            context.mock.timers.enable({ apis: ["Date"] });
            context.mock.timers.tick(12345);

            const logger = getMockedLogger();
            logger.message.withArgs(Level.DEBUG, "Request:  request.json").onFirstCall().returns();
            logger.message
                .withArgs(Level.DEBUG, "Response: response.json")
                .onSecondCall()
                .returns();
            logger.logToFile.onFirstCall().returns("request.json");
            logger.logToFile.onSecondCall().returns("response.json");

            const client = new AxiosRestClient({ debug: true });
            await assert.rejects(
                client.post("https://localhost:1234", {
                    five: 6,
                    hello: "!",
                    seven: [1, 2, 3],
                    there: "!",
                })
            );
            assert.strictEqual(logger.message.callCount, 2);

            const requestBody = JSON.parse(logger.logToFile.getCall(0).args[0]) as unknown;
            assert.deepStrictEqual(requestBody, {
                body: {
                    five: 6,
                    hello: "!",
                    seven: [1, 2, 3],
                    there: "!",
                },
                headers: {
                    ["Accept"]: "application/json, text/plain, */*",
                },
                url: "https://localhost:1234",
            });
            // Complicated assertion to handle different timezones on local and CI.
            const date = new Date();
            assert.strictEqual(
                logger.logToFile.getCall(0).args[1],
                `0${date.getHours().toString()}_00_12_POST_https_localhost_1234_request.json`
            );

            const error = JSON.parse(logger.logToFile.getCall(1).args[0]) as BaseAxios.AxiosError;
            assert.strictEqual(error.code, "ECONNREFUSED");
            assert.strictEqual(error.config?.url, "https://localhost:1234");
            assert.strictEqual(error.config.method, "post");
            assert.strictEqual(
                logger.logToFile.getCall(1).args[1],
                `0${date.getHours().toString()}_00_12_POST_https_localhost_1234_response.json`
            );
        });

        await it("writes to a file on encountering axios errors if debug is disabled", async () => {
            const logger = getMockedLogger();
            const client = new AxiosRestClient();
            await assert.rejects(client.get("https://localhost:1234"));
            assert.strictEqual(logger.message.callCount, 1);
            assert.strictEqual(logger.logToFile.callCount, 1);
        });

        await it("logs progress", async (context) => {
            context.mock.timers.enable({ apis: ["Date", "setTimeout", "setInterval"] });

            const message = context.mock.method(LOG, "message", context.mock.fn());

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

            await Promise.resolve();
            context.mock.timers.tick(27000);
            await promise;

            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.INFO,
                "Waiting for https://example.org to respond... (10 seconds)",
            ]);
            assert.deepStrictEqual(message.mock.calls[1].arguments, [
                Level.INFO,
                "Waiting for https://example.org to respond... (20 seconds)",
            ]);
        });
    });

    await describe("put", async () => {
        await it("returns the response", async () => {
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
            assert.deepStrictEqual(await client.put("https://example.org"), response);
        });

        await it("writes to a file on encountering axios errors if debug is enabled", async (context) => {
            context.mock.timers.enable({ apis: ["Date"] });
            context.mock.timers.tick(12345);

            const logger = getMockedLogger();
            logger.message.withArgs(Level.DEBUG, "Request:  request.json").onFirstCall().returns();
            logger.message
                .withArgs(Level.DEBUG, "Response: response.json")
                .onSecondCall()
                .returns();
            logger.logToFile.onFirstCall().returns("request.json");
            logger.logToFile.onSecondCall().returns("response.json");

            const client = new AxiosRestClient({ debug: true });
            await assert.rejects(
                client.put("https://localhost:1234", {
                    five: 6,
                    hello: "!",
                    seven: [1, 2, 3],
                    there: "!",
                })
            );
            assert.strictEqual(logger.message.callCount, 2);

            const requestBody = JSON.parse(logger.logToFile.getCall(0).args[0]) as unknown;
            assert.deepStrictEqual(requestBody, {
                body: {
                    five: 6,
                    hello: "!",
                    seven: [1, 2, 3],
                    there: "!",
                },
                headers: {
                    ["Accept"]: "application/json, text/plain, */*",
                },
                url: "https://localhost:1234",
            });
            // Complicated assertion to handle different timezones on local and CI.
            const date = new Date();
            assert.strictEqual(
                logger.logToFile.getCall(0).args[1],
                `0${date.getHours().toString()}_00_12_PUT_https_localhost_1234_request.json`
            );

            const error = JSON.parse(logger.logToFile.getCall(1).args[0]) as BaseAxios.AxiosError;
            assert.strictEqual(error.code, "ECONNREFUSED");
            assert.strictEqual(error.config?.url, "https://localhost:1234");
            assert.strictEqual(error.config.method, "put");

            assert.strictEqual(
                logger.logToFile.getCall(1).args[1],
                `0${date.getHours().toString()}_00_12_PUT_https_localhost_1234_response.json`
            );
        });

        await it("writes to a file on encountering axios errors if debug is disabled", async () => {
            const logger = getMockedLogger();
            const client = new AxiosRestClient();
            await assert.rejects(client.get("https://localhost:1234"));
            assert.strictEqual(logger.message.callCount, 1);
            assert.strictEqual(logger.logToFile.callCount, 1);
        });

        await it("logs progress", async (context) => {
            context.mock.timers.enable({ apis: ["Date", "setTimeout", "setInterval"] });

            const message = context.mock.method(LOG, "message", context.mock.fn());

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

            await Promise.resolve();
            context.mock.timers.tick(27000);
            await promise;

            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.INFO,
                "Waiting for https://example.org to respond... (10 seconds)",
            ]);
            assert.deepStrictEqual(message.mock.calls[1].arguments, [
                Level.INFO,
                "Waiting for https://example.org to respond... (20 seconds)",
            ]);
        });
    });

    await it("logs form data", async (context) => {
        const logToFile = context.mock.method(
            LOG,
            "logToFile",
            context.mock.fn<Logger["logToFile"]>()
        );

        const restClient = new AxiosRestClient({ debug: true });
        const formdata = new FormData();
        formdata.append("hello.json", JSON.stringify({ hello: "bonjour" }));
        await restClient.post(`http://${LOCAL_SERVER.url}`, formdata, {
            headers: { ...formdata.getHeaders() },
        });
        assert.match(logToFile.mock.calls[0].arguments[0], /{\\"hello\\":\\"bonjour\\"}/g);
    });

    await it("logs formdata only up to a certain length", async (context) => {
        const logToFile = context.mock.method(
            LOG,
            "logToFile",
            context.mock.fn<Logger["logToFile"]>()
        );

        const restClient = new AxiosRestClient({ debug: true, fileSizeLimit: 0.5 });
        const formdata = new FormData();
        formdata.append("long.txt", createReadStream("./test/resources/big.txt"));
        await restClient.post(`http://${LOCAL_SERVER.url}`, formdata, {
            headers: { ...formdata.getHeaders() },
        });
        // The 'end' event is emitted after the response has arrived.
        await new Promise((resolve) => setTimeout(resolve, 100));
        assert.match(logToFile.mock.calls[0].arguments[0], /[... omitted due to file size]/g);
    });

    await it("logs requests happening at the same time", async (context) => {
        const logToFile = context.mock.method(
            LOG,
            "logToFile",
            context.mock.fn<Logger["logToFile"]>()
        );
        context.mock.timers.enable({ apis: ["Date"] });
        context.mock.timers.tick(12345);

        const restClient = new AxiosRestClient({ debug: true });
        await Promise.all([
            restClient.get(`http://${LOCAL_SERVER.url}`),
            restClient.get(`http://${LOCAL_SERVER.url}`),
        ]);
        // Complicated assertion to handle different timezones on local and CI.
        const date = new Date();
        assert.strictEqual(
            logToFile.mock.calls[0].arguments[1],
            `0${date.getHours().toString()}_00_12_GET_http_localhost_8080_request.json`
        );
        assert.strictEqual(
            logToFile.mock.calls[1].arguments[1],
            `0${date.getHours().toString()}_00_12_GET_http_localhost_8080_request_1.json`
        );
    });

    await it("does not rate limit requests by default", async () => {
        const restClient = new AxiosRestClient();
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
        assertApprox(dateHeader1.getTime() - dateHeader0.getTime(), 0, 50);
        assertApprox(dateHeader2.getTime() - dateHeader1.getTime(), 0, 50);
        assertApprox(dateHeader3.getTime() - dateHeader2.getTime(), 0, 50);
        assertApprox(dateHeader4.getTime() - dateHeader3.getTime(), 0, 50);
        assertApprox(dateHeader5.getTime() - dateHeader4.getTime(), 0, 50);
        assertApprox(dateHeader6.getTime() - dateHeader5.getTime(), 0, 50);
        assertApprox(dateHeader7.getTime() - dateHeader6.getTime(), 0, 50);
        assertApprox(dateHeader8.getTime() - dateHeader7.getTime(), 0, 50);
        assertApprox(dateHeader9.getTime() - dateHeader8.getTime(), 0, 50);
    });

    await it("rate limits requests", async () => {
        const restClient = new AxiosRestClient({ rateLimiting: { requestsPerSecond: 2 } });
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
        assertApprox(dateHeader1.getTime() - dateHeader0.getTime(), 500, 50);
        assertApprox(dateHeader2.getTime() - dateHeader1.getTime(), 500, 50);
        assertApprox(dateHeader3.getTime() - dateHeader2.getTime(), 500, 50);
        assertApprox(dateHeader4.getTime() - dateHeader3.getTime(), 500, 50);
    });
});

function assertApprox(actual: number, expected: number, delta: number) {
    assert.ok(
        actual >= expected - delta,
        `${actual.toString()} ~/~ ${expected.toString()} - ${delta.toString()}`
    );
    assert.ok(
        actual <= expected + delta,
        `${actual.toString()} ~/~ ${expected.toString()} + ${delta.toString()}`
    );
}
