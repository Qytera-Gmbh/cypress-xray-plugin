import { expect } from "chai";
import { describe, it } from "node:test";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks.js";
import { dedent } from "../../../util/dedent.js";
import { Level } from "../../../util/logging.js";
import { ConstantCommand } from "../../util/commands/constant-command.js";
import { GetSummariesToResetCommand } from "./get-summaries-to-reset-command.js";

await describe(path.relative(process.cwd(), import.meta.filename), async () => {
    await describe(GetSummariesToResetCommand.name, async () => {
        await it("returns summaries of issues to reset", async () => {
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

        await it("warns about unknown old summaries", async () => {
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
                    CYP-123

                      The plugin tried to reset the issue's summary after importing the feature file, but could not because the previous summary could not be retrieved.

                      Make sure to manually restore it if needed.
                `)
            );
        });
    });
});
