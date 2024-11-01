import { expect } from "chai";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks.js";
import { dedent } from "../../../util/dedent.js";
import { Level } from "../../../util/logging.js";
import { ConstantCommand } from "../../util/commands/constant-command.js";
import { GetLabelsToResetCommand } from "./get-labels-to-reset-command.js";

describe(path.relative(process.cwd(), import.meta.filename), () => {
    describe(GetLabelsToResetCommand.name, () => {
        it("returns labels of issues to reset", async () => {
            const logger = getMockedLogger();
            const command = new GetLabelsToResetCommand(
                logger,
                new ConstantCommand(logger, {
                    ["CYP-123"]: ["a tag"],
                    ["CYP-456"]: ["tag 1", "tag 2"],
                    ["CYP-789"]: ["another tag"],
                }),
                new ConstantCommand(logger, {
                    ["CYP-123"]: ["a tag"],
                    ["CYP-456"]: ["tag 2"],
                    ["CYP-789"]: [],
                })
            );
            expect(await command.compute()).to.deep.eq({
                ["CYP-456"]: ["tag 1", "tag 2"],
                ["CYP-789"]: ["another tag"],
            });
        });

        it("warns about unknown old labels", async () => {
            const logger = getMockedLogger();
            const command = new GetLabelsToResetCommand(
                logger,
                new ConstantCommand(logger, {
                    ["CYP-789"]: ["another tag"],
                }),
                new ConstantCommand(logger, {
                    ["CYP-123"]: ["a tag"],
                    ["CYP-456"]: ["tag 1", "tag 2"],
                    ["CYP-789"]: ["another tag"],
                })
            );
            expect(await command.compute()).to.deep.eq({});
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    CYP-123

                      The plugin tried to reset the issue's labels after importing the feature file, but could not because the previous labels could not be retrieved.

                      Make sure to manually restore them if needed.
                `)
            );
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    CYP-456

                      The plugin tried to reset the issue's labels after importing the feature file, but could not because the previous labels could not be retrieved.

                      Make sure to manually restore them if needed.
                `)
            );
        });
    });
});
