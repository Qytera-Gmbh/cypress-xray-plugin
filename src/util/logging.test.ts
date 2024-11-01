import ansiColors from "ansi-colors";
import type { AxiosResponse } from "axios";
import { AxiosError, AxiosHeaders } from "axios";
import { expect } from "chai";
import fs from "fs";
import { describe, it } from "node:test";
import path from "path";
import { stub } from "sinon";
import { resolveTestDirPath } from "../../test/util.js";
import { LoggedError } from "./errors.js";
import { CapturingLogger, Level, PluginLogger } from "./logging.js";

await describe(path.relative(process.cwd(), import.meta.filename), async () => {
    await describe(PluginLogger.name, async () => {
        await describe("message", async () => {
            await it("handles single line messages", () => {
                const stdout = stub(console, "info");
                const logger = new PluginLogger();
                logger.message(Level.INFO, "hello");
                expect(stdout).to.have.been.calledOnceWithExactly(
                    `${ansiColors.white("│ Cypress Xray Plugin │ INFO    │")} ${ansiColors.gray(
                        "hello"
                    )}`
                );
            });
            await it("handles multi line messages", () => {
                const stdout = stub(console, "info");
                const logger = new PluginLogger();
                logger.message(Level.INFO, "hello\nbonjour");
                expect(stdout).to.have.been.calledThrice;
                expect(stdout.getCall(0).args).to.deep.eq([
                    `${ansiColors.white("│ Cypress Xray Plugin │ INFO    │")} ${ansiColors.gray(
                        "hello"
                    )}`,
                ]);
                expect(stdout.getCall(1).args).to.deep.eq([
                    `${ansiColors.white("│ Cypress Xray Plugin │ INFO    │")}   ${ansiColors.gray(
                        "bonjour"
                    )}`,
                ]);
                expect(stdout.getCall(2).args).to.deep.eq([
                    ansiColors.white("│ Cypress Xray Plugin │ INFO    │"),
                ]);
            });
        });

        await describe("logToFile", async () => {
            await it("writes to relative directories", () => {
                const logger = new PluginLogger({
                    logDirectory: path.relative(".", resolveTestDirPath("logs")),
                });
                const actualPath = logger.logToFile("[1, 2, 3]", "logToFileRelative.json");
                const expectedPath = resolveTestDirPath("logs", "logToFileRelative.json");
                expect(actualPath).to.eq(expectedPath);
                const parsedFile = fs.readFileSync(expectedPath, "utf8");
                expect(parsedFile).to.deep.eq("[1, 2, 3]");
            });

            await it("writes to absolute directories", () => {
                const logger = new PluginLogger({
                    logDirectory: resolveTestDirPath("logs"),
                });
                const actualPath = logger.logToFile("[4, 5, 6]", "logToFileAbsolute.json");
                const expectedPath = resolveTestDirPath("logs", "logToFileAbsolute.json");
                expect(actualPath).to.eq(expectedPath);
                const parsedFile = fs.readFileSync(expectedPath, "utf8");
                expect(parsedFile).to.deep.eq("[4, 5, 6]");
            });

            await it("writes to non-existent directories", () => {
                const timestamp = Date.now();
                const stderr = stub(console, "error");
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
                const parsedError = JSON.parse(fs.readFileSync(expectedPath, "utf8")) as unknown;
                expect(parsedError).to.have.property("error");
                expect(parsedError).to.have.property("stacktrace");
                expect(stderr).to.have.been.calledOnceWith(
                    `${ansiColors.white("│ Cypress Xray Plugin │ ERROR   │")} ${ansiColors.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`
                );
            });
        });

        await describe("logErrorToFile", async () => {
            await it("writes to relative directories", () => {
                const stderr = stub(console, "error");
                const logger = new PluginLogger({
                    logDirectory: path.relative(".", resolveTestDirPath("logs")),
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
                const parsedError = JSON.parse(fs.readFileSync(expectedPath, "utf8")) as unknown;
                expect(parsedError).to.have.property("error");
                expect(parsedError).to.have.property("stacktrace");
                expect(stderr).to.have.been.calledOnceWith(
                    `${ansiColors.white("│ Cypress Xray Plugin │ ERROR   │")} ${ansiColors.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`
                );
            });

            await it("writes to absolute directories", () => {
                const stderr = stub(console, "error");
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
                const parsedError = JSON.parse(fs.readFileSync(expectedPath, "utf8")) as unknown;
                expect(parsedError).to.have.property("error");
                expect(parsedError).to.have.property("stacktrace");
                expect(stderr).to.have.been.calledOnceWith(
                    `${ansiColors.white("│ Cypress Xray Plugin │ ERROR   │")} ${ansiColors.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`
                );
            });

            await it("writes to non-existent directories", () => {
                const timestamp = Date.now();
                const stderr = stub(console, "error");
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
                const parsedError = JSON.parse(fs.readFileSync(expectedPath, "utf8")) as unknown;
                expect(parsedError).to.have.property("error");
                expect(parsedError).to.have.property("stacktrace");
                expect(stderr).to.have.been.calledOnceWith(
                    `${ansiColors.white("│ Cypress Xray Plugin │ ERROR   │")} ${ansiColors.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`
                );
            });

            await it("writes axios errors", () => {
                const timestamp = Date.now();
                const stderr = stub(console, "error");
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
                expect(stderr).to.have.been.calledOnceWith(
                    `${ansiColors.white("│ Cypress Xray Plugin │ ERROR   │")} ${ansiColors.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`
                );
                const parsedData = JSON.parse(fs.readFileSync(expectedPath, "utf-8")) as {
                    error: AxiosError;
                    response: AxiosResponse;
                };
                expect(parsedData.error.message).to.eq("Request failed with status code 400");
                expect(parsedData.error.name).to.eq("AxiosError");
                expect(parsedData.error.code).to.eq("400");
                expect(parsedData.error.status).to.eq(400);
                expect(parsedData.response).to.deep.eq({
                    error: "Must provide a project key",
                });
            });

            await it("writes generic errors", () => {
                const timestamp = Date.now();
                const stderr = stub(console, "error");
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
                expect(parsedError).to.deep.eq({ good: "morning" });
                expect(stderr).to.have.been.calledOnceWith(
                    `${ansiColors.white("│ Cypress Xray Plugin │ ERROR   │")} ${ansiColors.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`
                );
            });

            await it("does not write already logged errors", () => {
                const timestamp = Date.now();
                const stderr = stub(console, "error");
                const logger = new PluginLogger({
                    logDirectory: resolveTestDirPath("logs", timestamp.toString()),
                });
                logger.logErrorToFile(new LoggedError("hello"), "logErrorToFileLogged");
                const expectedPath = resolveTestDirPath(
                    "logs",
                    timestamp.toString(),
                    "logErrorToFileLogged"
                );
                expect(stderr).to.not.have.been.called;
                expect(fs.existsSync(expectedPath)).to.be.false;
            });
        });
    });

    await describe(CapturingLogger.name, async () => {
        await describe("message", async () => {
            await it("stores calls", () => {
                const logger = new CapturingLogger();
                logger.message(Level.INFO, "hello");
                logger.message(Level.ERROR, "alarm");
                expect(logger.getMessages()).to.deep.eq([
                    [Level.INFO, "hello"],
                    [Level.ERROR, "alarm"],
                ]);
            });
        });

        await describe("logToFile", async () => {
            await it("stores calls", () => {
                const logger = new CapturingLogger();
                expect([
                    logger.logToFile("[1, 2, 3]", "logToFile1.json"),
                    logger.logToFile("[5, 6, 7]", "logToFile2.json"),
                ]).to.deep.eq(["logToFile1.json", "logToFile2.json"]);
                expect(logger.getFileLogMessages()).to.deep.eq([
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
                expect(logger.getFileLogErrorMessages()).to.deep.eq([
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
                expect(unconfiguredLogger).to.deep.eq(configuredLogger);
            });
        });
    });
});
