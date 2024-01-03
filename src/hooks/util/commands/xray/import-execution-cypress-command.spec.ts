import { expect } from "chai";
import path from "path";
import { getMockedLogger, getMockedXrayClient } from "../../../../../test/mocks";
import { XrayTestExecutionResults } from "../../../../types/xray/import-test-execution-results";
import { Level } from "../../../../util/logging";
import { ConstantCommand } from "../constant-command";
import { ImportExecutionCypressCommand } from "./import-execution-cypress-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ImportExecutionCypressCommand.name, () => {
        it("imports cypress xray json", async () => {
            const logger = getMockedLogger();
            const xrayClient = getMockedXrayClient();
            const json: XrayTestExecutionResults = {
                testExecutionKey: "CYP-123",
                info: { summary: "Test Execution Summary", description: "Hello" },
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
                new ConstantCommand(json)
            );
            xrayClient.importExecution.withArgs(json).resolves("CYP-123");
            expect(await command.compute()).to.eq("CYP-123");
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Uploading Cypress test results"
            );
        });
    });
});
