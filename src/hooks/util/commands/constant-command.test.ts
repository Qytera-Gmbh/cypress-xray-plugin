import { expect } from "chai";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { getMockedLogger } from "../../../../test/mocks.js";
import { ConstantCommand } from "./constant-command.js";

await describe(relative(cwd(), import.meta.filename), async () => {
    await describe(ConstantCommand.name, async () => {
        await it("returns the value", async () => {
            const command = new ConstantCommand(getMockedLogger(), {
                a: 10,
                b: 20,
            });
            expect(await command.compute()).to.deep.eq({
                a: 10,
                b: 20,
            });
        });
    });
});
