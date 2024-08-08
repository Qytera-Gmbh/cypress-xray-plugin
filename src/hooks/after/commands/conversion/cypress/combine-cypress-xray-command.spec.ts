import { expect } from "chai";
import path from "path";
import { getMockedLogger } from "../../../../../../test/mocks";
import { XrayTest } from "../../../../../types/xray/import-test-execution-results";
import { MultipartInfo } from "../../../../../types/xray/requests/import-execution-multipart-info";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { CombineCypressJsonCommand } from "./combine-cypress-xray-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(CombineCypressJsonCommand.name, () => {
        it("combines cucumber multipart data", async () => {
            const logger = getMockedLogger();
            const xrayInfo: MultipartInfo = {
                fields: {
                    description: "Run using Cypress",
                    issuetype: { name: "Test Execution", subtask: false },
                    project: {
                        key: "CYP",
                    },
                    summary: "A test execution",
                },
            };
            const xrayTests: [XrayTest, ...XrayTest[]] = [{ status: "PASS" }, { status: "FAIL" }];
            const command = new CombineCypressJsonCommand(
                { testExecutionIssueKey: "CYP-123" },
                logger,
                new ConstantCommand(logger, xrayTests),
                new ConstantCommand(logger, xrayInfo)
            );
            expect(await command.compute()).to.deep.eq({
                info: {
                    description: "Run using Cypress",
                    summary: "A test execution",
                },
                testExecutionKey: "CYP-123",
                tests: [{ status: "PASS" }, { status: "FAIL" }],
            });
        });
    });
});
