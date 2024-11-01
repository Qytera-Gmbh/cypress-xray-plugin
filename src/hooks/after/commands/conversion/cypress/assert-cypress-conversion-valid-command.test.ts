import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { describe, it } from "node:test";
import path from "path";
import { getMockedLogger } from "../../../../../../test/mocks.js";
import type { XrayClient } from "../../../../../client/xray/xray-client.js";
import type { XrayTest } from "../../../../../types/xray/import-test-execution-results.js";
import { ConstantCommand } from "../../../../util/commands/constant-command.js";
import { AssertCypressConversionValidCommand } from "./assert-cypress-conversion-valid-command.js";

chai.use(chaiAsPromised);

await describe(path.relative(process.cwd(), import.meta.filename), async () => {
    await describe(AssertCypressConversionValidCommand.name, async async async () => {
        await it("correctly verifies xray json data", async () => {
            const logger = getMockedLogger();
            const xrayJson: Parameters<XrayClient["importExecutionMultipart"]> = [
                {
                    testExecutionKey: "CYP-123",
                    tests: [{ status: "PASS" }, { status: "FAIL" }],
                },
                {
                    fields: {
                        description: "Run using Cypress",
                        issuetype: { name: "Test Execution" },
                        project: {
                            key: "CYP",
                        },
                        summary: "A test execution",
                    },
                },
            ];
            const command = new AssertCypressConversionValidCommand(
                logger,
                new ConstantCommand(logger, xrayJson)
            );
            await expect(command.compute()).to.eventually.not.be.rejected;
        });

        await it("throws for missing xray test arrays", async () => {
            const logger = getMockedLogger();
            const xrayJson: Parameters<XrayClient["importExecutionMultipart"]> = [
                { testExecutionKey: "CYP-123" },
                {
                    fields: {
                        description: "Run using Cypress",
                        issuetype: { name: "Test Execution" },
                        project: {
                            key: "CYP",
                        },
                        summary: "A test execution",
                    },
                },
            ];
            const command = new AssertCypressConversionValidCommand(
                logger,
                new ConstantCommand(logger, xrayJson)
            );
            await expect(command.compute()).to.be.rejectedWith(
                "Skipping Cypress results upload: No native Cypress tests were executed"
            );
        });

        await it("throws for empty xray test arrays", async () => {
            const logger = getMockedLogger();
            const xrayJson: Parameters<XrayClient["importExecutionMultipart"]> = [
                {
                    testExecutionKey: "CYP-123",
                    tests: [] as unknown as [XrayTest, ...XrayTest[]],
                },
                {
                    fields: {
                        description: "Run using Cypress",
                        issuetype: { name: "Test Execution" },
                        project: {
                            key: "CYP",
                        },
                        summary: "A test execution",
                    },
                },
            ];
            const command = new AssertCypressConversionValidCommand(
                logger,
                new ConstantCommand(logger, xrayJson)
            );
            await expect(command.compute()).to.be.rejectedWith(
                "Skipping Cypress results upload: No native Cypress tests were executed"
            );
        });
    });
});
