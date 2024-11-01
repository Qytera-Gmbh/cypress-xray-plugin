import { expect } from "chai";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { getMockedLogger } from "../../../../../../test/mocks.js";
import { ConstantCommand } from "../../../../util/commands/constant-command.js";
import { CombineCypressJsonCommand } from "./combine-cypress-xray-command.js";

await describe(relative(cwd(), import.meta.filename), async () => {
    await describe(CombineCypressJsonCommand.name, async () => {
        await it("combines cucumber multipart data", async () => {
            const logger = getMockedLogger();
            const command = new CombineCypressJsonCommand(
                { testExecutionIssueKey: "CYP-123" },
                logger,
                new ConstantCommand(logger, [{ status: "PASS" }, { status: "FAIL" }]),
                new ConstantCommand(logger, {
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
            expect(await command.compute()).to.deep.eq([
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
