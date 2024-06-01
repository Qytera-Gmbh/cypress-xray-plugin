import { expect } from "chai";
import path from "path";
import { getMockedLogger } from "../../../../../../test/mocks";
import {
    XrayTest,
    XrayTestExecutionInfo,
} from "../../../../../types/xray/import-test-execution-results";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { CombineCypressJsonCommand } from "./combine-cypress-xray-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(CombineCypressJsonCommand.name, () => {
        it("combines cucumber multipart data", async () => {
            const logger = getMockedLogger();
            const xrayInfo: XrayTestExecutionInfo = {
                summary: "A test execution",
                description: "Run using Cypress",
            };
            const xrayTests: [XrayTest, ...XrayTest[]] = [{ status: "PASS" }, { status: "FAIL" }];
            const command = new CombineCypressJsonCommand(
                { testExecutionIssueKey: "CYP-123" },
                logger,
                new ConstantCommand(logger, xrayTests),
                new ConstantCommand(logger, xrayInfo)
            );
            expect(await command.compute()).to.deep.eq({
                testExecutionKey: "CYP-123",
                info: {
                    summary: "A test execution",
                    description: "Run using Cypress",
                },
                tests: [{ status: "PASS" }, { status: "FAIL" }],
            });
        });
    });
});
