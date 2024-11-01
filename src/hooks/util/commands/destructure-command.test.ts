import { expect } from "chai";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { getMockedLogger } from "../../../../test/mocks.js";
import { ConstantCommand } from "./constant-command.js";
import { DestructureCommand } from "./destructure-command.js";

await describe(relative(cwd(), import.meta.filename), async () => {
    await describe(DestructureCommand.name, async () => {
        await it("returns the accessed object value", async () => {
            const logger = getMockedLogger();
            const command = new DestructureCommand(
                logger,
                new ConstantCommand(logger, {
                    a: 10,
                    b: { c: "bonjour" },
                }),
                "b"
            );
            expect(await command.compute()).to.deep.eq({ c: "bonjour" });
        });

        await it("throws for invalid object accesses", async () => {
            const logger = getMockedLogger();
            const command = new DestructureCommand(
                logger,
                new ConstantCommand(logger, {
                    a: 10,
                    b: 20,
                }),
                "c"
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                'Failed to access element c in: {"a":10,"b":20}'
            );
        });
    });
});
