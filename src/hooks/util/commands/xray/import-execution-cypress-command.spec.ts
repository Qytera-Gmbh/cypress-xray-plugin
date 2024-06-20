import { expect } from "chai";
import path from "path";
import { getMockedLogger, getMockedXrayClient } from "../../../../../test/mocks";
import { XrayTestExecutionResults } from "../../../../types/xray/import-test-execution-results";
import { ConstantCommand } from "../constant-command";
import { ImportExecutionCypressCommand } from "./import-execution-cypress-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ImportExecutionCypressCommand.name, () => {
        it("imports cypress xray json", async () => {
            const logger = getMockedLogger();
            const xrayClient = getMockedXrayClient();
            const json: XrayTestExecutionResults = {
                info: { description: "Hello", summary: "Test Execution Summary" },
                testExecutionKey: "CYP-123",
                tests: [
                    { status: "PASSED" },
                    { status: "PASSED" },
                    { status: "PASSED" },
                    { status: "FAILED" },
                ],
            };
            const command = new ImportExecutionCypressCommand(
                {
                    xrayClient: xrayClient,
                },
                logger,
                new ConstantCommand(logger, json)
            );
            xrayClient.importExecution.withArgs(json).resolves("CYP-123");
            expect(await command.compute()).to.eq("CYP-123");
            expect(logger.message).to.not.have.been.called;
        });
    });
});
