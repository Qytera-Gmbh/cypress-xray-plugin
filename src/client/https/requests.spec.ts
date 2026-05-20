import axios, { AxiosHeaders, HttpStatusCode, type AxiosError, type AxiosResponse } from "axios";
import FormData from "form-data";
import assert from "node:assert";
import { createReadStream } from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import { LOCAL_SERVER } from "../../../test/server";
import type { Logger } from "../../util/logging";
import { LOG } from "../../util/logging";
import { AxiosRestClient } from "./requests";

void describe(relative(cwd(), __filename), () => {
    beforeEach(() => {
        axios.interceptors.request.clear();
        axios.interceptors.response.clear();
    });

    void describe("get", () => {
        void it("returns the response", async (context) => {
            const response: AxiosResponse<string> = {
                config: {
                    headers: new AxiosHeaders(),
                },
                data: "Example domain 123",
                headers: {},
                status: HttpStatusCode.Ok,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
            };

            context.mock.method(axios, "get", () => response);

            const client = new AxiosRestClient(axios);
            assert.deepStrictEqual(await client.get("http://localhost:1234"), response);
        });

        void it("writes to a file on encountering axios errors if debug is enabled", async (context) => {
            context.mock.timers.enable({ apis: ["Date"] });
            context.mock.timers.tick(12345);
            const message = context.mock.method(LOG, "message", context.mock.fn());
            let i = 0;
            const logToFile = context.mock.method(LOG, "logToFile", () => {
                if (i++ == 0) {
                    return "request.json";
                }
                return "response.json";
            });

            const client = new AxiosRestClient(axios, { debug: true });
            await assert.rejects(client.get("https://localhost:1234"));
            assert.strictEqual(message.mock.callCount(), 2);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "debug",
                "Request:  request.json",
            ]);
            assert.deepStrictEqual(message.mock.calls[1].arguments, [
                "debug",
                "Response: response.json",
            ]);

            const requestBody = JSON.parse(
                logToFile.mock.calls[0].arguments[0] as string
            ) as unknown;
            assert.deepStrictEqual(requestBody, {
                headers: {
                    ["Accept"]: "application/json, text/plain, */*",
                },
                url: "https://localhost:1234",
            });
            // Complicated assertion to handle different timezones on local and CI.
            const date = new Date();
            assert.strictEqual(
                logToFile.mock.calls[0].arguments[1],
                `0${date.getHours().toString()}_00_12_GET_https_localhost_1234_request.json`
            );

            const error = JSON.parse(logToFile.mock.calls[1].arguments[0] as string) as AxiosError;
            assert.strictEqual(error.code, "ECONNREFUSED");
            assert.strictEqual(error.config?.url, "https://localhost:1234");
            assert.strictEqual(error.config.method, "get");
            // Complicated assertion to handle different timezones on local and CI.
            assert.strictEqual(
                logToFile.mock.calls[1].arguments[1],
                `0${date.getHours().toString()}_00_12_GET_https_localhost_1234_response.json`
            );
        });

        void it("writes to a file on encountering axios errors if debug is disabled", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const logToFile = context.mock.method(
                LOG,
                "logToFile",
                context.mock.fn<Logger["logToFile"]>()
            );
            const client = new AxiosRestClient(axios);
            await assert.rejects(client.get("https://localhost:1234"));
            assert.strictEqual(message.mock.callCount(), 1);
            assert.strictEqual(logToFile.mock.callCount(), 1);
        });

        void it("logs progress", async (context) => {
            context.mock.timers.enable({ apis: ["Date", "setTimeout", "setInterval"] });

            const message = context.mock.method(LOG, "message", context.mock.fn());

            context.mock.method(
                axios,
                "get",
                () =>
                    new Promise((resolve) => {
                        setTimeout(() => {
                            resolve({
                                config: { headers: {} },
                                data: "<html>ok</html>",
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Found],
                            });
                        }, 23000);
                    })
            );

            const restClient = new AxiosRestClient(axios);

            const promise = restClient.get("http://localhost:1234");

            await Promise.resolve();
            context.mock.timers.tick(27000);
            await promise;

            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "info",
                "Waiting for http://localhost:1234 to respond... (10 seconds)",
            ]);
            assert.deepStrictEqual(message.mock.calls[1].arguments, [
                "info",
                "Waiting for http://localhost:1234 to respond... (20 seconds)",
            ]);
        });
    });

    void describe("post", () => {
        void it("returns the response", async (context) => {
            const response: AxiosResponse<string> = {
                config: {
                    headers: new AxiosHeaders(),
                },
                data: "Example domain 123",
                headers: {},
                status: HttpStatusCode.Ok,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
            };

            context.mock.method(axios, "post", () => response);
            const client = new AxiosRestClient(axios);
            assert.deepStrictEqual(await client.post("http://localhost:1234"), response);
        });

        void it("writes to a file on encountering axios errors if debug is enabled", async (context) => {
            context.mock.timers.enable({ apis: ["Date"] });
            context.mock.timers.tick(12345);

            const message = context.mock.method(LOG, "message", context.mock.fn());
            let i = 0;
            const logToFile = context.mock.method(LOG, "logToFile", () => {
                if (i++ == 0) {
                    return "request.json";
                }
                return "response.json";
            });

            const client = new AxiosRestClient(axios, { debug: true });
            await assert.rejects(
                client.post("https://localhost:1234", {
                    five: 6,
                    hello: "!",
                    seven: [1, 2, 3],
                    there: "!",
                })
            );
            assert.strictEqual(message.mock.callCount(), 2);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "debug",
                "Request:  request.json",
            ]);
            assert.deepStrictEqual(message.mock.calls[1].arguments, [
                "debug",
                "Response: response.json",
            ]);

            const requestBody = JSON.parse(
                logToFile.mock.calls[0].arguments[0] as string
            ) as unknown;
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
                logToFile.mock.calls[0].arguments[1],
                `0${date.getHours().toString()}_00_12_POST_https_localhost_1234_request.json`
            );

            const error = JSON.parse(logToFile.mock.calls[1].arguments[0] as string) as AxiosError;
            assert.strictEqual(error.code, "ECONNREFUSED");
            assert.strictEqual(error.config?.url, "https://localhost:1234");
            assert.strictEqual(error.config.method, "post");
            assert.strictEqual(
                logToFile.mock.calls[1].arguments[1],
                `0${date.getHours().toString()}_00_12_POST_https_localhost_1234_response.json`
            );
        });

        void it("writes to a file on encountering axios errors if debug is disabled", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const logToFile = context.mock.method(
                LOG,
                "logToFile",
                context.mock.fn<Logger["logToFile"]>()
            );
            const client = new AxiosRestClient(axios);
            await assert.rejects(client.get("https://localhost:1234"));
            assert.strictEqual(message.mock.callCount(), 1);
            assert.strictEqual(logToFile.mock.callCount(), 1);
        });

        void it("logs progress", async (context) => {
            context.mock.timers.enable({ apis: ["Date", "setTimeout", "setInterval"] });

            const message = context.mock.method(LOG, "message", context.mock.fn());

            context.mock.method(
                axios,
                "post",
                () =>
                    new Promise((resolve) => {
                        setTimeout(() => {
                            resolve({
                                config: { headers: {} },
                                data: "<html>ok</html>",
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Found],
                            });
                        }, 23000);
                    })
            );

            const restClient = new AxiosRestClient(axios);
            const promise = restClient.post("http://localhost:1234");

            await Promise.resolve();
            context.mock.timers.tick(27000);
            await promise;

            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "info",
                "Waiting for http://localhost:1234 to respond... (10 seconds)",
            ]);
            assert.deepStrictEqual(message.mock.calls[1].arguments, [
                "info",
                "Waiting for http://localhost:1234 to respond... (20 seconds)",
            ]);
        });
    });

    void describe("put", () => {
        void it("returns the response", async (context) => {
            const client = new AxiosRestClient(axios);
            const response: AxiosResponse<string> = {
                config: {
                    headers: new AxiosHeaders(),
                },
                data: "Example domain 123",
                headers: {},
                status: HttpStatusCode.Ok,
                statusText: HttpStatusCode[HttpStatusCode.Ok],
            };

            context.mock.method(axios, "put", () => response);
            assert.deepStrictEqual(await client.put("http://localhost:1234"), response);
        });

        void it("writes to a file on encountering axios errors if debug is enabled", async (context) => {
            context.mock.timers.enable({ apis: ["Date"] });
            context.mock.timers.tick(12345);

            const message = context.mock.method(LOG, "message", context.mock.fn());
            let i = 0;
            const logToFile = context.mock.method(LOG, "logToFile", () => {
                if (i++ == 0) {
                    return "request.json";
                }
                return "response.json";
            });

            const client = new AxiosRestClient(axios, { debug: true });
            await assert.rejects(
                client.put("https://localhost:1234", {
                    five: 6,
                    hello: "!",
                    seven: [1, 2, 3],
                    there: "!",
                })
            );
            assert.strictEqual(message.mock.callCount(), 2);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "debug",
                "Request:  request.json",
            ]);
            assert.deepStrictEqual(message.mock.calls[1].arguments, [
                "debug",
                "Response: response.json",
            ]);

            const requestBody = JSON.parse(
                logToFile.mock.calls[0].arguments[0] as string
            ) as unknown;
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
                logToFile.mock.calls[0].arguments[1],
                `0${date.getHours().toString()}_00_12_PUT_https_localhost_1234_request.json`
            );

            const error = JSON.parse(logToFile.mock.calls[1].arguments[0] as string) as AxiosError;
            assert.strictEqual(error.code, "ECONNREFUSED");
            assert.strictEqual(error.config?.url, "https://localhost:1234");
            assert.strictEqual(error.config.method, "put");

            assert.strictEqual(
                logToFile.mock.calls[1].arguments[1],
                `0${date.getHours().toString()}_00_12_PUT_https_localhost_1234_response.json`
            );
        });

        void it("writes to a file on encountering axios errors if debug is disabled", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const logToFile = context.mock.method(
                LOG,
                "logToFile",
                context.mock.fn<Logger["logToFile"]>()
            );
            const client = new AxiosRestClient(axios);
            await assert.rejects(client.get("https://localhost:1234"));
            assert.strictEqual(message.mock.callCount(), 1);
            assert.strictEqual(logToFile.mock.callCount(), 1);
        });

        void it("logs progress", async (context) => {
            context.mock.timers.enable({ apis: ["Date", "setTimeout", "setInterval"] });

            const message = context.mock.method(LOG, "message", context.mock.fn());

            context.mock.method(
                axios,
                "put",
                () =>
                    new Promise((resolve) => {
                        setTimeout(() => {
                            resolve({
                                config: { headers: {} },
                                data: "<html>ok</html>",
                                headers: {},
                                status: HttpStatusCode.Ok,
                                statusText: HttpStatusCode[HttpStatusCode.Found],
                            });
                        }, 23000);
                    })
            );

            const restClient = new AxiosRestClient(axios);
            const promise = restClient.put("http://localhost:1234");

            await Promise.resolve();
            context.mock.timers.tick(27000);
            await promise;

            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "info",
                "Waiting for http://localhost:1234 to respond... (10 seconds)",
            ]);
            assert.deepStrictEqual(message.mock.calls[1].arguments, [
                "info",
                "Waiting for http://localhost:1234 to respond... (20 seconds)",
            ]);
        });
    });

    void it("logs form data", async (context) => {
        const logToFile = context.mock.method(
            LOG,
            "logToFile",
            context.mock.fn<Logger["logToFile"]>()
        );

        const restClient = new AxiosRestClient(axios, { debug: true });
        const formdata = new FormData();
        formdata.append("hello.json", JSON.stringify({ hello: "bonjour" }));
        await restClient.post(`http://${LOCAL_SERVER.url}`, formdata, {
            headers: { ...formdata.getHeaders() },
        });
        assert.match(logToFile.mock.calls[0].arguments[0], /{\\"hello\\":\\"bonjour\\"}/g);
    });

    void it("logs formdata only up to a certain length", async (context) => {
        const logToFile = context.mock.method(
            LOG,
            "logToFile",
            context.mock.fn<Logger["logToFile"]>()
        );

        const restClient = new AxiosRestClient(axios, { debug: true, fileSizeLimit: 0.5 });
        const formdata = new FormData();
        formdata.append("long.txt", createReadStream("./test/resources/big.txt"));
        await restClient.post(`http://${LOCAL_SERVER.url}`, formdata, {
            headers: { ...formdata.getHeaders() },
        });
        // The 'end' event is emitted after the response has arrived.
        await new Promise((resolve) => setTimeout(resolve, 100));
        assert.match(logToFile.mock.calls[0].arguments[0], /[... omitted due to file size]/g);
    });

    void it("logs requests happening at the same time", async (context) => {
        const logToFile = context.mock.method(
            LOG,
            "logToFile",
            context.mock.fn<Logger["logToFile"]>()
        );
        context.mock.timers.enable({ apis: ["Date"] });
        context.mock.timers.tick(12345);

        const restClient = new AxiosRestClient(axios, { debug: true });
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

    void it("does not rate limit requests by default", async () => {
        const restClient = new AxiosRestClient(axios);
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

    void it("rate limits requests", async () => {
        const restClient = new AxiosRestClient(axios, { rateLimiting: { requestsPerSecond: 2 } });
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
