import { expect } from "chai";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks";
import { Level } from "../../../logging/logging";
import { dedent } from "../../../util/dedent";
import { ConstantCommand } from "../../util";
import { GetSummariesToResetCommand } from "./getSummariesToResetCommand";

describe(path.relative(process.cwd(), __filename), () => {
    describe(GetSummariesToResetCommand.name, () => {
        it("returns summaries of issues to reset", async () => {
            const command = new GetSummariesToResetCommand(
                new ConstantCommand({
                    ["CYP-123"]: "Old Summary",
                    ["CYP-456"]: "Old Summary Too",
                }),
                new ConstantCommand({
                    ["CYP-123"]: "New Summary",
                    ["CYP-456"]: "Old Summary Too",
                })
            );
            expect(await command.compute()).to.deep.eq({
                ["CYP-123"]: "Old Summary",
            });
        });

        it("warns about unknown old summaries", async () => {
            const command = new GetSummariesToResetCommand(
                new ConstantCommand({}),
                new ConstantCommand({
                    ["CYP-123"]: "New Summary",
                })
            );
            const logger = getMockedLogger();
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
