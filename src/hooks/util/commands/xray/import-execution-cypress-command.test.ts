import axios from "axios";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { PatCredentials } from "../../../../client/authentication/credentials";
import { AxiosRestClient } from "../../../../client/https/https";
import type { XrayClient } from "../../../../client/xray/xray-client";
import { ServerClient } from "../../../../client/xray/xray-client-server";
import type { XrayTestExecutionResults } from "../../../../types/xray/import-test-execution-results";
import type { MultipartInfo } from "../../../../types/xray/requests/import-execution-multipart-info";
import { LOG } from "../../../../util/logging";
import { ConstantCommand } from "../constant-command";
import { ImportExecutionCypressCommand } from "./import-execution-cypress-command";

describe(relative(cwd(), __filename), async () => {
    await describe(ImportExecutionCypressCommand.name, async () => {
        await it("imports cypress xray json", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const results: XrayTestExecutionResults = {
                info: { description: "Hello", summary: "Test Execution Summary" },
                testExecutionKey: "CYP-123",
                tests: [
                    { status: "PASSED" },
                    { status: "PASSED" },
                    { status: "PASSED" },
                    { status: "FAILED" },
                ],
            };
            const info: MultipartInfo = {
                fields: {
                    issuetype: {
                        id: "10008",
                    },
                    labels: ["a", "b"],
                    project: {
                        key: "CYP",
                    },
                    summary: "Brand new Test execution",
                },
            };
            const xrayClient = new ServerClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            context.mock.method(
                xrayClient,
                "importExecutionMultipart",
                context.mock.fn<XrayClient["importExecutionMultipart"]>(
                    (executionResults, executionInfo) => {
                        if (executionResults === results && executionInfo === info) {
                            return Promise.resolve("CYP-123");
                        }
                        return Promise.reject(new Error("Mock called unexpectedly"));
                    }
                )
            );
            const command = new ImportExecutionCypressCommand(
                {
                    xrayClient: xrayClient,
                },
                LOG,
                new ConstantCommand(LOG, [results, info])
            );
            assert.strictEqual(await command.compute(), "CYP-123");
            assert.strictEqual(message.mock.callCount(), 0);
        });
    });
});
