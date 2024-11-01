import { expect } from "chai";
import { describe, it } from "node:test";
import path from "path";
import { getMockedLogger } from "../../../../../../test/mocks.js";
import { ConstantCommand } from "../../../../util/commands/constant-command.js";
import { CombineCypressJsonCommand } from "./combine-cypress-xray-command.js";

await describe(path.relative(process.cwd(), import.meta.filename), () => {
    await describe(CombineCypressJsonCommand.name, () => {
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
