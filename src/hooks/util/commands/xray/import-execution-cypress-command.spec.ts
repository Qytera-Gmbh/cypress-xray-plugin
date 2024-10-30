import { expect } from "chai";
import path from "node:path";
import { getMockedLogger, getMockedXrayClient } from "../../../../../test/mocks";
import type { XrayTestExecutionResults } from "../../../../types/xray/import-test-execution-results";
import type { MultipartInfo } from "../../../../types/xray/requests/import-execution-multipart-info";
import { ConstantCommand } from "../constant-command";
import { ImportExecutionCypressCommand } from "./import-execution-cypress-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ImportExecutionCypressCommand.name, () => {
        it("imports cypress xray json", async () => {
            const logger = getMockedLogger();
            const xrayClient = getMockedXrayClient();
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
            const command = new ImportExecutionCypressCommand(
                {
                    xrayClient: xrayClient,
                },
                logger,
                new ConstantCommand(logger, [results, info])
            );
            xrayClient.importExecutionMultipart.withArgs(results, info).resolves("CYP-123");
            expect(await command.compute()).to.eq("CYP-123");
            expect(logger.message).to.not.have.been.called;
        });
    });
});
