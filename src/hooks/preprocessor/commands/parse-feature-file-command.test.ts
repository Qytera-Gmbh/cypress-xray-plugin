import { expect } from "chai";
import { describe, it } from "node:test";
import { relative } from "path";
import { getMockedLogger } from "../../../../test/mocks.js";
import { dedent } from "../../../util/dedent.js";
import { Level } from "../../../util/logging.js";
import { ParseFeatureFileCommand } from "./parse-feature-file-command.js";

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await describe(ParseFeatureFileCommand.name, async () => {
        await it("displays errors for invalid feature files", async () => {
            const logger = getMockedLogger();
            const filePath = "./test/resources/features/invalid.feature";

            const command = new ParseFeatureFileCommand({ filePath: filePath }, logger);
            await expect(command.compute()).to.eventually.be.rejectedWith(
                dedent(`
                    ./test/resources/features/invalid.feature

                      Failed to parse feature file.

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
});
