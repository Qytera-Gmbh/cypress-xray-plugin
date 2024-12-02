import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "../../../util/dedent";
import { Level, LOG } from "../../../util/logging";
import { ConstantCommand } from "../../util/commands/constant-command";
import { GetLabelsToResetCommand } from "./get-labels-to-reset-command";

describe(relative(cwd(), __filename), async () => {
    await describe(GetLabelsToResetCommand.name, async () => {
        await it("returns labels of issues to reset", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const command = new GetLabelsToResetCommand(
                LOG,
                new ConstantCommand(LOG, {
                    ["CYP-123"]: ["a tag"],
                    ["CYP-456"]: ["tag 1", "tag 2"],
                    ["CYP-789"]: ["another tag"],
                }),
                new ConstantCommand(LOG, {
                    ["CYP-123"]: ["a tag"],
                    ["CYP-456"]: ["tag 2"],
                    ["CYP-789"]: [],
                })
            );
            assert.deepStrictEqual(await command.compute(), {
                ["CYP-456"]: ["tag 1", "tag 2"],
                ["CYP-789"]: ["another tag"],
            });
        });

        await it("warns about unknown old labels", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const command = new GetLabelsToResetCommand(
                LOG,
                new ConstantCommand(LOG, {
                    ["CYP-789"]: ["another tag"],
                }),
                new ConstantCommand(LOG, {
                    ["CYP-123"]: ["a tag"],
                    ["CYP-456"]: ["tag 1", "tag 2"],
                    ["CYP-789"]: ["another tag"],
                })
            );
            assert.deepStrictEqual(await command.compute(), {});
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.WARNING,
                dedent(`
                    CYP-123

                      The plugin tried to reset the issue's labels after importing the feature file, but could not because the previous labels could not be retrieved.

                      Make sure to manually restore them if needed.
                `),
            ]);
            assert.deepStrictEqual(message.mock.calls[1].arguments, [
                Level.WARNING,
                dedent(`
                    CYP-456

                      The plugin tried to reset the issue's labels after importing the feature file, but could not because the previous labels could not be retrieved.

                      Make sure to manually restore them if needed.
                `),
            ]);
        });
    });
});
