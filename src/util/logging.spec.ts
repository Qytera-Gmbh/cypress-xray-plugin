import ansiColors from "ansi-colors";
import type { AxiosResponse } from "axios";
import { AxiosError, AxiosHeaders } from "axios";
import assert from "node:assert";
import fs from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { resolveTestDirPath } from "../../test/util";
import { LoggedError } from "./errors";
import { CapturingLogger, Level, PluginLogger } from "./logging";

describe(relative(cwd(), __filename), async () => {
    await describe(PluginLogger.name, async () => {
        await describe("message", async () => {
            await it("handles single line messages", (context) => {
                const info = context.mock.method(console, "info", context.mock.fn());
                const logger = new PluginLogger();
                logger.message(Level.INFO, "hello");
                assert.deepStrictEqual(info.mock.calls[0].arguments, [
                    `${ansiColors.white("│ Cypress Xray Plugin │ INFO    │")} ${ansiColors.gray(
                        "hello"
                    )}`,
                ]);
            });
            await it("handles multi line messages", (context) => {
                const info = context.mock.method(console, "info", context.mock.fn());
                const logger = new PluginLogger();
                logger.message(Level.INFO, "hello\nbonjour");
                assert.deepStrictEqual(info.mock.callCount(), 3);
                assert.deepStrictEqual(info.mock.calls[0].arguments, [
                    `${ansiColors.white("│ Cypress Xray Plugin │ INFO    │")} ${ansiColors.gray(
                        "hello"
                    )}`,
                ]);
                assert.deepStrictEqual(info.mock.calls[1].arguments, [
                    `${ansiColors.white("│ Cypress Xray Plugin │ INFO    │")}   ${ansiColors.gray(
                        "bonjour"
                    )}`,
                ]);
                assert.deepStrictEqual(info.mock.calls[2].arguments, [
                    ansiColors.white("│ Cypress Xray Plugin │ INFO    │"),
                ]);
            });
        });

        await describe("logToFile", async () => {
            await it("writes to relative directories", () => {
                const logger = new PluginLogger({
                    logDirectory: relative(".", resolveTestDirPath("logs")),
                });
                const actualPath = logger.logToFile("[1, 2, 3]", "logToFileRelative.json");
                const expectedPath = resolveTestDirPath("logs", "logToFileRelative.json");
                assert.strictEqual(actualPath, expectedPath);
                const parsedFile = fs.readFileSync(expectedPath, "utf8");
                assert.deepStrictEqual(parsedFile, "[1, 2, 3]");
            });

            await it("writes to absolute directories", () => {
                const logger = new PluginLogger({
                    logDirectory: resolveTestDirPath("logs"),
                });
                const actualPath = logger.logToFile("[4, 5, 6]", "logToFileAbsolute.json");
                const expectedPath = resolveTestDirPath("logs", "logToFileAbsolute.json");
                assert.strictEqual(actualPath, expectedPath);
                const parsedFile = fs.readFileSync(expectedPath, "utf8");
                assert.deepStrictEqual(parsedFile, "[4, 5, 6]");
            });

            await it("writes to non-existent directories", (context) => {
                const error = context.mock.method(console, "error", context.mock.fn());
                const timestamp = Date.now();
                const logger = new PluginLogger({
                    logDirectory: resolveTestDirPath("logs", timestamp.toString()),
                });
                logger.logErrorToFile(
                    new Error(
                        JSON.stringify({
                            something: "entirely different",
                        })
                    ),
                    "logErrorToFileNonExistent"
                );
                const expectedPath = resolveTestDirPath(
                    "logs",
                    timestamp.toString(),
                    "logErrorToFileNonExistent.json"
                );
                const parsedError = JSON.parse(fs.readFileSync(expectedPath, "utf8")) as object;
                assert.strictEqual("error" in parsedError, true);
                assert.strictEqual("stacktrace" in parsedError, true);
                assert.deepStrictEqual(error.mock.calls[0].arguments, [
                    `${ansiColors.white("│ Cypress Xray Plugin │ ERROR   │")} ${ansiColors.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`,
                ]);
            });
        });

        await describe("logErrorToFile", async () => {
            await it("writes to relative directories", (context) => {
                const error = context.mock.method(console, "error", context.mock.fn());
                const logger = new PluginLogger({
                    logDirectory: relative(".", resolveTestDirPath("logs")),
                });
                logger.logErrorToFile(
                    new Error(
                        JSON.stringify({
                            something: "else",
                        })
                    ),
                    "logErrorToFileRelative"
                );
                const expectedPath = resolveTestDirPath("logs", "logErrorToFileRelative.json");
                const parsedError = JSON.parse(fs.readFileSync(expectedPath, "utf8")) as object;
                assert.strictEqual("error" in parsedError, true);
                assert.strictEqual("stacktrace" in parsedError, true);
                assert.deepStrictEqual(error.mock.calls[0].arguments, [
                    `${ansiColors.white("│ Cypress Xray Plugin │ ERROR   │")} ${ansiColors.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`,
                ]);
            });

            await it("writes to absolute directories", (context) => {
                const error = context.mock.method(console, "error", context.mock.fn());
                const logger = new PluginLogger({
                    logDirectory: resolveTestDirPath("logs"),
                });
                logger.logErrorToFile(
                    new Error(
                        JSON.stringify({
                            something: "entirely else",
                        })
                    ),
                    "logErrorToFileAbsolute"
                );
                const expectedPath = resolveTestDirPath("logs", "logErrorToFileAbsolute.json");
                const parsedError = JSON.parse(fs.readFileSync(expectedPath, "utf8")) as object;
                assert.strictEqual("error" in parsedError, true);
                assert.strictEqual("stacktrace" in parsedError, true);
                assert.deepStrictEqual(error.mock.calls[0].arguments, [
                    `${ansiColors.white("│ Cypress Xray Plugin │ ERROR   │")} ${ansiColors.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`,
                ]);
            });

            await it("writes to non-existent directories", (context) => {
                const timestamp = Date.now();

                const error = context.mock.method(console, "error", context.mock.fn());
                const logger = new PluginLogger({
                    logDirectory: resolveTestDirPath("logs", timestamp.toString()),
                });
                logger.logErrorToFile(
                    new Error(
                        JSON.stringify({
                            something: "entirely different",
                        })
                    ),
                    "logErrorToFileNonExistent"
                );
                const expectedPath = resolveTestDirPath(
                    "logs",
                    timestamp.toString(),
                    "logErrorToFileNonExistent.json"
                );
                const parsedError = JSON.parse(fs.readFileSync(expectedPath, "utf8")) as object;
                assert.strictEqual("error" in parsedError, true);
                assert.strictEqual("stacktrace" in parsedError, true);
                assert.deepStrictEqual(error.mock.calls[0].arguments, [
                    `${ansiColors.white("│ Cypress Xray Plugin │ ERROR   │")} ${ansiColors.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`,
                ]);
            });

            await it("writes axios errors", (context) => {
                const timestamp = Date.now();

                const error = context.mock.method(console, "error", context.mock.fn());
                const logger = new PluginLogger({
                    logDirectory: resolveTestDirPath("logs", timestamp.toString()),
                });
                logger.logErrorToFile(
                    new AxiosError(
                        "Request failed with status code 400",
                        "400",
                        { headers: new AxiosHeaders() },
                        null,
                        {
                            config: {
                                headers: new AxiosHeaders({
                                    ["Authorization"]: "Bearer 123456790",
                                }),
                            },
                            data: {
                                error: "Must provide a project key",
                            },
                            headers: {},
                            status: 400,
                            statusText: "Bad Request",
                        }
                    ),
                    "logErrorToFileAxios"
                );
                const expectedPath = resolveTestDirPath(
                    "logs",
                    timestamp.toString(),
                    "logErrorToFileAxios.json"
                );
                assert.deepStrictEqual(error.mock.calls[0].arguments, [
                    `${ansiColors.white("│ Cypress Xray Plugin │ ERROR   │")} ${ansiColors.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`,
                ]);
                const parsedData = JSON.parse(fs.readFileSync(expectedPath, "utf-8")) as {
                    error: AxiosError;
                    response: AxiosResponse;
                };
                assert.strictEqual(parsedData.error.message, "Request failed with status code 400");
                assert.strictEqual(parsedData.error.name, "AxiosError");
                assert.strictEqual(parsedData.error.code, "400");
                assert.strictEqual(parsedData.error.status, 400);
                assert.deepStrictEqual(parsedData.response, {
                    error: "Must provide a project key",
                });
            });

            await it("writes generic errors", (context) => {
                const timestamp = Date.now();

                const error = context.mock.method(console, "error", context.mock.fn());
                const logger = new PluginLogger({
                    logDirectory: resolveTestDirPath("logs", timestamp.toString()),
                });
                logger.logErrorToFile({ good: "morning" }, "logErrorToFileGeneric");
                const expectedPath = resolveTestDirPath(
                    "logs",
                    timestamp.toString(),
                    "logErrorToFileGeneric.log"
                );
                const parsedError = JSON.parse(fs.readFileSync(expectedPath, "utf8")) as unknown;
                assert.deepStrictEqual(parsedError, { good: "morning" });
                assert.deepStrictEqual(error.mock.calls[0].arguments, [
                    `${ansiColors.white("│ Cypress Xray Plugin │ ERROR   │")} ${ansiColors.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`,
                ]);
            });

            await it("does not write already logged errors", (context) => {
                const error = context.mock.method(console, "error", context.mock.fn());
                const timestamp = Date.now();
                const logger = new PluginLogger({
                    logDirectory: resolveTestDirPath("logs", timestamp.toString()),
                });
                logger.logErrorToFile(new LoggedError("hello"), "logErrorToFileLogged");
                const expectedPath = resolveTestDirPath(
                    "logs",
                    timestamp.toString(),
                    "logErrorToFileLogged"
                );
                assert.strictEqual(error.mock.callCount(), 0);
                assert.strictEqual(fs.existsSync(expectedPath), false);
            });
        });
    });

    await describe(CapturingLogger.name, async () => {
        await describe("message", async () => {
            await it("stores calls", () => {
                const logger = new CapturingLogger();
                logger.message(Level.INFO, "hello");
                logger.message(Level.ERROR, "alarm");
                assert.deepStrictEqual(logger.getMessages(), [
                    [Level.INFO, "hello"],
                    [Level.ERROR, "alarm"],
                ]);
            });
        });

        await describe("logToFile", async () => {
            await it("stores calls", () => {
                const logger = new CapturingLogger();
                assert.deepStrictEqual(
                    [
                        logger.logToFile("[1, 2, 3]", "logToFile1.json"),
                        logger.logToFile("[5, 6, 7]", "logToFile2.json"),
                    ],
                    ["logToFile1.json", "logToFile2.json"]
                );
                assert.deepStrictEqual(logger.getFileLogMessages(), [
                    ["[1, 2, 3]", "logToFile1.json"],
                    ["[5, 6, 7]", "logToFile2.json"],
                ]);
            });
        });

        await describe("logErrorToFile", async () => {
            await it("stores calls", () => {
                const logger = new CapturingLogger();
                logger.logErrorToFile(new Error("I failed"), "logToFile1.json");
                logger.logErrorToFile(new Error("I failed, too"), "logToFile2.json");
                assert.deepStrictEqual(logger.getFileLogErrorMessages(), [
                    [new Error("I failed"), "logToFile1.json"],
                    [new Error("I failed, too"), "logToFile2.json"],
                ]);
            });
        });

        await describe("configure", async () => {
            await it("does nothing", () => {
                const unconfiguredLogger = new CapturingLogger();
                const configuredLogger = new CapturingLogger();
                configuredLogger.configure();
                assert.deepStrictEqual(unconfiguredLogger, configuredLogger);
            });
        });
    });
});
