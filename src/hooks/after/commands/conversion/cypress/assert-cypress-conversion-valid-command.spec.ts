import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "node:path";
import { getMockedLogger } from "../../../../../../test/mocks";
import { XrayClient } from "../../../../../client/xray/xray-client";
import { XrayTest } from "../../../../../types/xray/import-test-execution-results";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { AssertCypressConversionValidCommand } from "./assert-cypress-conversion-valid-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(AssertCypressConversionValidCommand.name, () => {
        it("correctly verifies xray json data", async () => {
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

        it("throws for missing xray test arrays", async () => {
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

        it("throws for empty xray test arrays", async () => {
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
