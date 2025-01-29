import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "../../../util/dedent";
import { LOG } from "../../../util/logging";
import { ParseFeatureFileCommand } from "./parse-feature-file-command";

describe(relative(cwd(), __filename), async () => {
    await describe(ParseFeatureFileCommand.name, async () => {
        await it("displays errors for invalid feature files", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const filePath = "./test/resources/features/invalid.feature";

            const command = new ParseFeatureFileCommand({ filePath: filePath }, LOG);
            await assert.rejects(command.compute(), {
                message: dedent(`
                    ./test/resources/features/invalid.feature

                      Failed to parse feature file.

                        Parser errors:
                        (9:3): expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #RuleLine, #Comment, #Empty, got 'Invalid: Element'
                `),
            });
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "info",
                `Parsing feature file: ./test/resources/features/invalid.feature`,
            ]);
        });
    });
});
