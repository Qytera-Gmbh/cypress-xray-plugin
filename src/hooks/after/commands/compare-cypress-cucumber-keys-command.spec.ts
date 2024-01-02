import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks";
import { dedent } from "../../../util/dedent";
import { Level } from "../../../util/logging";
import { ConstantCommand } from "../../util/commands/constant-command";
import { CompareCypressCucumberKeysCommand } from "./compare-cypress-cucumber-keys-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(CompareCypressCucumberKeysCommand.name, () => {
        it("returns the test execution issue key", async () => {
            const command = new CompareCypressCucumberKeysCommand(
                new ConstantCommand("CYP-123"),
                new ConstantCommand("CYP-123")
            );
            expect(await command.compute()).to.eq("CYP-123");
        });

        it("warns about mismatched test execution issue keys", async () => {
            const logger = getMockedLogger();
            const command = new CompareCypressCucumberKeysCommand(
                new ConstantCommand("CYP-123"),
                new ConstantCommand("CYP-456")
            );
            expect(await command.compute()).to.eq("CYP-123");
            expect(logger.message).to.have.been.called.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Cucumber execution results were imported to test execution issue CYP-456, which is different than the one of the Cypress execution results: CYP-123

                    This might be a bug, please report it at: https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues
                `)
            );
        });
    });
});
