import { expect } from "chai";
import path from "path";
import { getMockedLogger, getMockedXrayClient } from "../../../../../test/mocks.js";
import type { XrayTestExecutionResults } from "../../../../types/xray/import-test-execution-results.js";
import type { MultipartInfo } from "../../../../types/xray/requests/import-execution-multipart-info.js";
import { ConstantCommand } from "../constant-command.js";
import { ImportExecutionCypressCommand } from "./import-execution-cypress-command.js";

await describe(path.relative(process.cwd(), import.meta.filename), () => {
    await describe(ImportExecutionCypressCommand.name, () => {
        await it("imports cypress xray json", async () => {
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
