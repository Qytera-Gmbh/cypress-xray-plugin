import { AxiosError, AxiosHeaders } from "axios";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { resolveTestDirPath, stubLogging } from "../../test/util";
import { initLogging, writeErrorFile } from "./logging";

describe("the logging module", () => {
    describe("writeErrorFile", () => {
        it("should write to relative directories", () => {
            initLogging({
                logDirectory: path.relative(".", resolveTestDirPath("logs")),
            });
            const { stubbedError } = stubLogging();
            writeErrorFile(
                new Error(
                    JSON.stringify({
                        something: "else",
                    })
                ),
                "writeErrorFileRelative"
            );
            const expectedPath = resolveTestDirPath("logs", "writeErrorFileRelative.json");
            expect(stubbedError).to.have.been.calledOnceWith(
                `Complete error logs have been written to: ${expectedPath}`
            );
        });

        it("should write to absolute directories", () => {
            initLogging({
                logDirectory: resolveTestDirPath("logs"),
            });
            const { stubbedError } = stubLogging();
            writeErrorFile(
                new Error(
                    JSON.stringify({
                        something: "entirely else",
                    })
                ),
                "writeErrorFileAbsolute"
            );
            const expectedPath = resolveTestDirPath("logs", "writeErrorFileAbsolute.json");
            expect(stubbedError).to.have.been.calledOnceWith(
                `Complete error logs have been written to: ${expectedPath}`
            );
        });

        it("should write to non-existent directories", () => {
            const timestamp = Date.now();
            initLogging({
                logDirectory: resolveTestDirPath("logs", timestamp.toString()),
            });
            const { stubbedError } = stubLogging();
            writeErrorFile(
                new Error(
                    JSON.stringify({
                        something: "entirely different",
                    })
                ),
                "writeErrorFileNonExistent"
            );
            const expectedPath = resolveTestDirPath(
                "logs",
                timestamp.toString(),
                "writeErrorFileNonExistent.json"
            );
            expect(stubbedError).to.have.been.calledOnceWith(
                `Complete error logs have been written to: ${expectedPath}`
            );
        });

        it("should write axios errors", () => {
            const timestamp = Date.now();
            initLogging({
                logDirectory: resolveTestDirPath("logs", timestamp.toString()),
            });
            const { stubbedError } = stubLogging();
            writeErrorFile(
                new AxiosError(
                    "Request failed with status code 400",
                    "400",
                    { headers: new AxiosHeaders() },
                    null,
                    {
                        status: 400,
                        statusText: "Bad Request",
                        config: {
                            headers: new AxiosHeaders({ Authorization: "Bearer 123456790" }),
                        },
                        headers: {},
                        data: {
                            error: "Must provide a project key",
                        },
                    }
                ),
                "writeErrorFileAxios"
            );
            const expectedPath = resolveTestDirPath(
                "logs",
                timestamp.toString(),
                "writeErrorFileAxios.json"
            );
            expect(stubbedError).to.have.been.calledOnceWith(
                `Complete error logs have been written to: ${expectedPath}`
            );
            const parsedData = JSON.parse(fs.readFileSync(expectedPath).toString());
            expect(parsedData.error.message).to.eq("Request failed with status code 400");
            expect(parsedData.error.name).to.eq("AxiosError");
            expect(parsedData.error.code).to.eq("400");
            expect(parsedData.error.status).to.eq(400);
            expect(parsedData.response).to.deep.eq({
                error: "Must provide a project key",
            });
        });

        it("should write generic errors", () => {
            const timestamp = Date.now();
            initLogging({
                logDirectory: resolveTestDirPath("logs", timestamp.toString()),
            });
            const { stubbedError } = stubLogging();
            writeErrorFile({ good: "morning" }, "writeErrorFileGeneric");
            const expectedPath = resolveTestDirPath(
                "logs",
                timestamp.toString(),
                "writeErrorFileGeneric.log"
            );
            expect(stubbedError).to.have.been.calledOnceWith(
                `Complete error logs have been written to: ${expectedPath}`
            );
            expect(JSON.parse(fs.readFileSync(expectedPath).toString())).to.deep.eq({
                good: "morning",
            });
        });
    });
});
