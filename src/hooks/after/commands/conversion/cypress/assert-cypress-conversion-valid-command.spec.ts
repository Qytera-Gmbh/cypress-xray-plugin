import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import {
    XrayTest,
    XrayTestExecutionResults,
} from "../../../../../types/xray/import-test-execution-results";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { AssertCypressConversionValidCommand } from "./assert-cypress-conversion-valid-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(AssertCypressConversionValidCommand.name, () => {
        it("correctly verifies xray json data", async () => {
            const xrayJson: XrayTestExecutionResults = {
                testExecutionKey: "CYP-123",
                info: {
                    summary: "A test execution",
                    description: "Run using Cypress",
                },
                tests: [{ status: "PASS" }, { status: "FAIL" }],
            };
            const command = new AssertCypressConversionValidCommand(new ConstantCommand(xrayJson));
            await expect(command.compute()).to.eventually.not.be.rejected;
        });

        it("throws for missing xray test arrays", async () => {
            const xrayJson: XrayTestExecutionResults = {
                testExecutionKey: "CYP-123",
                info: {
                    summary: "A test execution",
                    description: "Run using Cypress",
                },
            };
            const command = new AssertCypressConversionValidCommand(new ConstantCommand(xrayJson));
            await expect(command.compute()).to.be.rejectedWith(
                "Skipping Cypress results upload: No native Cypress tests were executed"
            );
        });

        it("throws for empty xray test arrays", async () => {
            const xrayJson: XrayTestExecutionResults = {
                testExecutionKey: "CYP-123",
                info: {
                    summary: "A test execution",
                    description: "Run using Cypress",
                },
                tests: [] as unknown as [XrayTest, ...XrayTest[]],
            };
            const command = new AssertCypressConversionValidCommand(new ConstantCommand(xrayJson));
            await expect(command.compute()).to.be.rejectedWith(
                "Skipping Cypress results upload: No native Cypress tests were executed"
            );
        });
    });
});
