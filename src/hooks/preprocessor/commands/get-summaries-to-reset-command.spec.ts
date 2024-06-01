import { expect } from "chai";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks";
import { dedent } from "../../../util/dedent";
import { Level } from "../../../util/logging";
import { ConstantCommand } from "../../util/commands/constant-command";
import { GetSummariesToResetCommand } from "./get-summaries-to-reset-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(GetSummariesToResetCommand.name, () => {
        it("returns summaries of issues to reset", async () => {
            const logger = getMockedLogger();
            const command = new GetSummariesToResetCommand(
                logger,
                new ConstantCommand(logger, {
                    ["CYP-123"]: "Old Summary",
                    ["CYP-456"]: "Old Summary Too",
                }),
                new ConstantCommand(logger, {
                    ["CYP-123"]: "New Summary",
                    ["CYP-456"]: "Old Summary Too",
                })
            );
            expect(await command.compute()).to.deep.eq({
                ["CYP-123"]: "Old Summary",
            });
        });

        it("warns about unknown old summaries", async () => {
            const logger = getMockedLogger();
            const command = new GetSummariesToResetCommand(
                logger,
                new ConstantCommand(logger, {}),
                new ConstantCommand(logger, {
                    ["CYP-123"]: "New Summary",
                })
            );
            expect(await command.compute()).to.deep.eq({});
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Skipping resetting summary of issue: CYP-123
                    The previous summary could not be fetched, make sure to manually restore it if needed
                `)
            );
        });
    });
});
