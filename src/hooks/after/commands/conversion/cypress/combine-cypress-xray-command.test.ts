import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { LOG } from "../../../../../util/logging";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { CombineCypressJsonCommand } from "./combine-cypress-xray-command";

describe(relative(cwd(), __filename), async () => {
    await describe(CombineCypressJsonCommand.name, async () => {
        await it("combines cucumber multipart data", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const command = new CombineCypressJsonCommand(
                { testExecutionIssueKey: "CYP-123" },
                LOG,
                new ConstantCommand(LOG, [{ status: "PASS" }, { status: "FAIL" }]),
                new ConstantCommand(LOG, {
                    fields: {
                        description: "Run using Cypress",
                        issuetype: { name: "Test Execution", subtask: false },
                        project: {
                            key: "CYP",
                        },
                        summary: "A test execution",
                    },
                })
            );
            assert.deepStrictEqual(await command.compute(), [
                {
                    testExecutionKey: "CYP-123",
                    tests: [{ status: "PASS" }, { status: "FAIL" }],
                },
                {
                    fields: {
                        description: "Run using Cypress",
                        issuetype: { name: "Test Execution", subtask: false },
                        project: {
                            key: "CYP",
                        },
                        summary: "A test execution",
                    },
                },
            ]);
        });
    });
});
