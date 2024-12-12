import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { LOG } from "../../../util/logging";
import { ConstantCommand } from "./constant-command";
import { DestructureCommand } from "./destructure-command";

describe(relative(cwd(), __filename), async () => {
    await describe(DestructureCommand.name, async () => {
        await it("returns the accessed object value", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const command = new DestructureCommand(
                LOG,
                new ConstantCommand(LOG, {
                    a: 10,
                    b: { c: "bonjour" },
                }),
                "b"
            );
            assert.deepStrictEqual(await command.compute(), { c: "bonjour" });
        });

        await it("throws for invalid object accesses", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const command = new DestructureCommand(
                LOG,
                new ConstantCommand(LOG, {
                    a: 10,
                    b: 20,
                }),
                "c"
            );
            await assert.rejects(command.compute(), {
                message: 'Failed to access element c in: {"a":10,"b":20}',
            });
        });
    });
});
