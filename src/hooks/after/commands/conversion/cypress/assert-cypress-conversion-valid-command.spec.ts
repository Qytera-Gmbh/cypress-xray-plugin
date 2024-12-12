import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import type { XrayClient } from "../../../../../client/xray/xray-client";
import type { XrayTest } from "../../../../../types/xray/import-test-execution-results";
import { LOG } from "../../../../../util/logging";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { AssertCypressConversionValidCommand } from "./assert-cypress-conversion-valid-command";

describe(relative(cwd(), __filename), async () => {
    await describe(AssertCypressConversionValidCommand.name, async () => {
        await it("correctly verifies xray json data", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const xrayJson: Parameters<XrayClient["importExecutionMultipart"]> = [
                {
                    testExecutionKey: "CYP-123",
                    tests: [{ status: "PASS" }, { status: "FAIL" }],
                },
                {
                    fields: {
                        description: "Run using Cypress",
                        issuetype: { name: "Test Execution" },
                        project: {
                            key: "CYP",
                        },
                        summary: "A test execution",
                    },
                },
            ];
            const command = new AssertCypressConversionValidCommand(
                LOG,
                new ConstantCommand(LOG, xrayJson)
            );
            await assert.doesNotReject(command.compute());
        });

        await it("throws for missing xray test arrays", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const xrayJson: Parameters<XrayClient["importExecutionMultipart"]> = [
                { testExecutionKey: "CYP-123" },
                {
                    fields: {
                        description: "Run using Cypress",
                        issuetype: { name: "Test Execution" },
                        project: {
                            key: "CYP",
                        },
                        summary: "A test execution",
                    },
                },
            ];
            const command = new AssertCypressConversionValidCommand(
                LOG,
                new ConstantCommand(LOG, xrayJson)
            );
            await assert.rejects(command.compute(), {
                message: "Skipping Cypress results upload: No native Cypress tests were executed",
            });
        });

        await it("throws for empty xray test arrays", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const xrayJson: Parameters<XrayClient["importExecutionMultipart"]> = [
                {
                    testExecutionKey: "CYP-123",
                    tests: [] as unknown as [XrayTest, ...XrayTest[]],
                },
                {
                    fields: {
                        description: "Run using Cypress",
                        issuetype: { name: "Test Execution" },
                        project: {
                            key: "CYP",
                        },
                        summary: "A test execution",
                    },
                },
            ];
            const command = new AssertCypressConversionValidCommand(
                LOG,
                new ConstantCommand(LOG, xrayJson)
            );
            await assert.rejects(command.compute(), {
                message: "Skipping Cypress results upload: No native Cypress tests were executed",
            });
        });
    });
});
