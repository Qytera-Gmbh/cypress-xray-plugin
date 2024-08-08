import { expect } from "chai";
import path from "path";
import { getMockedLogger } from "../../../../../../test/mocks";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { CombineCypressJsonCommand } from "./combine-cypress-xray-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(CombineCypressJsonCommand.name, () => {
        it("combines cucumber multipart data", async () => {
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
