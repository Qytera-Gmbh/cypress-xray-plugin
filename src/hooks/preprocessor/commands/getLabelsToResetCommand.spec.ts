import { expect } from "chai";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks";
import { ConstantCommand } from "../../../commands/constantCommand";
import { Level } from "../../../logging/logging";
import { dedent } from "../../../util/dedent";
import { GetLabelsToResetCommand } from "./getLabelsToResetCommand";

describe(path.relative(process.cwd(), __filename), () => {
    describe(GetLabelsToResetCommand.name, () => {
        it("returns labels of issues to reset", async () => {
            const command = new GetLabelsToResetCommand(
                new ConstantCommand({
                    ["CYP-123"]: ["a tag"],
                    ["CYP-456"]: ["tag 1", "tag 2"],
                    ["CYP-789"]: ["another tag"],
                }),
                new ConstantCommand({
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
            const command = new GetLabelsToResetCommand(
                new ConstantCommand({
                    ["CYP-789"]: ["another tag"],
                }),
                new ConstantCommand({
                    ["CYP-123"]: ["a tag"],
                    ["CYP-456"]: ["tag 1", "tag 2"],
                    ["CYP-789"]: ["another tag"],
                })
            );
            const logger = getMockedLogger();
            expect(await command.compute()).to.deep.eq({});
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Skipping resetting labels of issue: CYP-123
                    The previous labels could not be fetched, make sure to manually restore them if needed
                `)
            );
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Skipping resetting labels of issue: CYP-456
                    The previous labels could not be fetched, make sure to manually restore them if needed
                `)
            );
        });
    });
});
