import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { LOG } from "../../../util/logging.js";
import { ComputableState } from "../../command.js";
import { ConstantCommand } from "./constant-command.js";
import { FallbackCommand } from "./fallback-command.js";

await describe(relative(cwd(), import.meta.filename), async () => {
    await describe(FallbackCommand.name, async () => {
        await it("computes the result if possible", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const input = new ConstantCommand(LOG, 42);
            const command = new FallbackCommand(
                {
                    fallbackOn: [ComputableState.FAILED],
                    fallbackValue: "fallback",
                },
                LOG,
                input
            );
            assert.strictEqual(await command.compute(), 42);
        });

        await it("returns the fallback value", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const input = new ConstantCommand(LOG, 42);
            const command = new FallbackCommand(
                {
                    fallbackOn: [ComputableState.FAILED],
                    fallbackValue: "fallback",
                },
                LOG,
                input
            );
            input.setState(ComputableState.FAILED);
            assert.strictEqual(await command.compute(), "fallback");
        });
    });
});
