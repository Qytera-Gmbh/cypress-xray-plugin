/// <reference types="cypress" />

import { AxiosError, AxiosHeaders } from "axios";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { TEST_TMP_DIR, stubLogging } from "../../test/util";
import { initLogging, writeErrorFile } from "./logging";

describe("the logging module", () => {
    describe("writeErrorFile", () => {
        const LOG_ROOT = `${TEST_TMP_DIR}/logs`;

        it("should be able to write to relative directories", () => {
            initLogging({
                logDirectory: `./${LOG_ROOT}`,
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
            const expectedPath = path.resolve(LOG_ROOT, "writeErrorFileRelative.json");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                `Complete error logs have been written to: ${expectedPath}`
            );
            expect(JSON.parse(fs.readFileSync(expectedPath).toString())).to.deep.eq({
                something: "else",
            });
        });

        it("should be able to write to absolute directories", () => {
            initLogging({
                logDirectory: path.resolve(LOG_ROOT),
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
            const expectedPath = path.resolve(LOG_ROOT, "writeErrorFileAbsolute.json");
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                `Complete error logs have been written to: ${expectedPath}`
            );
            expect(JSON.parse(fs.readFileSync(expectedPath).toString())).to.deep.eq({
                something: "entirely else",
            });
        });

        it("should be able to write to non-existent directories", () => {
            const timestamp = Date.now();
            initLogging({
                logDirectory: `./${LOG_ROOT}/${timestamp}`,
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
            const expectedPath = path.resolve(
                LOG_ROOT,
                timestamp.toString(),
                "writeErrorFileNonExistent.json"
            );
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                `Complete error logs have been written to: ${expectedPath}`
            );
            expect(JSON.parse(fs.readFileSync(expectedPath).toString())).to.deep.eq({
                something: "entirely different",
            });
        });

        it("should be able to write axios errors", () => {
            const timestamp = Date.now();
            initLogging({
                logDirectory: `./${LOG_ROOT}/${timestamp}`,
            });
            const { stubbedError } = stubLogging();
            writeErrorFile(
                new AxiosError("Request failed with status code 400", "400", null, null, {
                    status: 400,
                    statusText: "Bad Request",
                    config: { headers: new AxiosHeaders({ Authorization: "Bearer 123456790" }) },
                    headers: {},
                    data: {
                        error: "Must provide a project key",
                    },
                }),
                "writeErrorFileAxios"
            );
            const expectedPath = path.resolve(
                LOG_ROOT,
                timestamp.toString(),
                "writeErrorFileAxios.json"
            );
            expect(stubbedError).to.have.been.calledOnceWithExactly(
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

        it("should be able to write generic errors", () => {
            const timestamp = Date.now();
            initLogging({
                logDirectory: `./${LOG_ROOT}/${timestamp}`,
            });
            const { stubbedError } = stubLogging();
            writeErrorFile({ good: "morning" }, "writeErrorFileGeneric");
            const expectedPath = path.resolve(
                LOG_ROOT,
                timestamp.toString(),
                "writeErrorFileGeneric.log"
            );
            expect(stubbedError).to.have.been.calledOnceWithExactly(
                `Complete error logs have been written to: ${expectedPath}`
            );
            expect(JSON.parse(fs.readFileSync(expectedPath).toString())).to.deep.eq({
                good: "morning",
            });
        });
    });
});
