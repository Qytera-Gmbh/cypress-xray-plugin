import { expect } from "chai";
import { getMockedLogger } from "../../../test/mocks";
import { Level } from "../../logging/logging";
import { dedent } from "../../util/dedent";
import { ParseFeatureFileCommand } from "./parseFeatureFileCommand";

describe(ParseFeatureFileCommand.name, () => {
    it("displays errors for invalid feature files", async () => {
        const filePath = "./test/resources/features/invalid.feature";
        const logger = getMockedLogger();
        const command = new ParseFeatureFileCommand(filePath);
        await expect(command.compute()).to.eventually.be.rejectedWith(
            dedent(`
                Parser errors:
                (9:3): expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got 'Invalid: Element'
            `)
        );
        expect(logger.message).to.have.been.calledWithExactly(
            Level.INFO,
            `Parsing feature file: ./test/resources/features/invalid.feature`
        );
    });
});
