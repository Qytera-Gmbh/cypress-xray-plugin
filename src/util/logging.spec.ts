import type { AxiosResponse } from "axios";
import { AxiosError, AxiosHeaders } from "axios";
import { expect } from "chai";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { stub } from "sinon";
import { resolveTestDirPath } from "../../test/util";
import { LoggedError } from "./errors";
import { CapturingLogger, Level, PluginLogger } from "./logging";

describe(path.relative(process.cwd(), __filename), () => {
    describe(PluginLogger.name, () => {
        describe("message", () => {
            it("handles single line messages", () => {
                const stdout = stub(console, "info");
                const logger = new PluginLogger();
                logger.message(Level.INFO, "hello");
                expect(stdout).to.have.been.calledOnceWithExactly(
                    `${chalk.white("│ Cypress Xray Plugin │ INFO    │")} ${chalk.gray("hello")}`
                );
            });
            it("handles multi line messages", () => {
                const stdout = stub(console, "info");
                const logger = new PluginLogger();
                logger.message(Level.INFO, "hello\nbonjour");
                expect(stdout).to.have.been.calledThrice;
                expect(stdout.getCall(0).args).to.deep.eq([
                    `${chalk.white("│ Cypress Xray Plugin │ INFO    │")} ${chalk.gray("hello")}`,
                ]);
                expect(stdout.getCall(1).args).to.deep.eq([
                    `${chalk.white("│ Cypress Xray Plugin │ INFO    │")}   ${chalk.gray(
                        "bonjour"
                    )}`,
                ]);
                expect(stdout.getCall(2).args).to.deep.eq([
                    chalk.white("│ Cypress Xray Plugin │ INFO    │"),
                ]);
            });
        });

        describe("logToFile", () => {
            it("writes to relative directories", () => {
                const logger = new PluginLogger({
                    logDirectory: path.relative(".", resolveTestDirPath("logs")),
                });
                const actualPath = logger.logToFile("[1, 2, 3]", "logToFileRelative.json");
                const expectedPath = resolveTestDirPath("logs", "logToFileRelative.json");
                expect(actualPath).to.eq(expectedPath);
                const parsedFile = fs.readFileSync(expectedPath, "utf8");
                expect(parsedFile).to.deep.eq("[1, 2, 3]");
            });

            it("writes to absolute directories", () => {
                const logger = new PluginLogger({
                    logDirectory: resolveTestDirPath("logs"),
                });
                const actualPath = logger.logToFile("[4, 5, 6]", "logToFileAbsolute.json");
                const expectedPath = resolveTestDirPath("logs", "logToFileAbsolute.json");
                expect(actualPath).to.eq(expectedPath);
                const parsedFile = fs.readFileSync(expectedPath, "utf8");
                expect(parsedFile).to.deep.eq("[4, 5, 6]");
            });

            it("writes to non-existent directories", () => {
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
                    `${chalk.white("│ Cypress Xray Plugin │ ERROR   │")} ${chalk.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`
                );
            });
        });

        describe("logErrorToFile", () => {
            it("writes to relative directories", () => {
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
                    `${chalk.white("│ Cypress Xray Plugin │ ERROR   │")} ${chalk.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`
                );
            });

            it("writes to absolute directories", () => {
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
                    `${chalk.white("│ Cypress Xray Plugin │ ERROR   │")} ${chalk.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`
                );
            });

            it("writes to non-existent directories", () => {
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
                    `${chalk.white("│ Cypress Xray Plugin │ ERROR   │")} ${chalk.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`
                );
            });

            it("writes axios errors", () => {
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
                    `${chalk.white("│ Cypress Xray Plugin │ ERROR   │")} ${chalk.red(
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

            it("writes generic errors", () => {
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
                    `${chalk.white("│ Cypress Xray Plugin │ ERROR   │")} ${chalk.red(
                        `Complete error logs have been written to: ${expectedPath}`
                    )}`
                );
            });

            it("does not write already logged errors", () => {
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

    describe(CapturingLogger.name, () => {
        describe("message", () => {
            it("stores calls", () => {
                const logger = new CapturingLogger();
                logger.message(Level.INFO, "hello");
                logger.message(Level.ERROR, "alarm");
                expect(logger.getMessages()).to.deep.eq([
                    [Level.INFO, "hello"],
                    [Level.ERROR, "alarm"],
                ]);
            });
        });

        describe("logToFile", () => {
            it("stores calls", () => {
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

        describe("logErrorToFile", () => {
            it("stores calls", () => {
                const logger = new CapturingLogger();
                logger.logErrorToFile(new Error("I failed"), "logToFile1.json");
                logger.logErrorToFile(new Error("I failed, too"), "logToFile2.json");
                expect(logger.getFileLogErrorMessages()).to.deep.eq([
                    [new Error("I failed"), "logToFile1.json"],
                    [new Error("I failed, too"), "logToFile2.json"],
                ]);
            });
        });

        describe("configure", () => {
            it("does nothing", () => {
                const unconfiguredLogger = new CapturingLogger();
                const configuredLogger = new CapturingLogger();
                configuredLogger.configure();
                expect(unconfiguredLogger).to.deep.eq(configuredLogger);
            });
        });
    });
});
