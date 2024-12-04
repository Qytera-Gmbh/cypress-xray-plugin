import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "../../../util/dedent";
import { Level, LOG } from "../../../util/logging";
import { ConstantCommand } from "../../util/commands/constant-command";
import { GetSummariesToResetCommand } from "./get-summaries-to-reset-command";

describe(relative(cwd(), __filename), async () => {
    await describe(GetSummariesToResetCommand.name, async () => {
        await it("returns summaries of issues to reset", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const command = new GetSummariesToResetCommand(
                LOG,
                new ConstantCommand(LOG, {
                    ["CYP-123"]: "Old Summary",
                    ["CYP-456"]: "Old Summary Too",
                }),
                new ConstantCommand(LOG, {
                    ["CYP-123"]: "New Summary",
                    ["CYP-456"]: "Old Summary Too",
                })
            );
            assert.deepStrictEqual(await command.compute(), {
                ["CYP-123"]: "Old Summary",
            });
        });

        await it("warns about unknown old summaries", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const command = new GetSummariesToResetCommand(
                LOG,
                new ConstantCommand(LOG, {}),
                new ConstantCommand(LOG, {
                    ["CYP-123"]: "New Summary",
                })
            );
            assert.deepStrictEqual(await command.compute(), {});
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.WARNING,
                dedent(`
                    CYP-123

                      The plugin tried to reset the issue's summary after importing the feature file, but could not because the previous summary could not be retrieved.

                      Make sure to manually restore it if needed.
                `),
            ]);
        });
    });
});
