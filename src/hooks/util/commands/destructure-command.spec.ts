import { expect } from "chai";
import path from "node:path";
import { getMockedLogger } from "../../../../test/mocks";
import { ConstantCommand } from "./constant-command";
import { DestructureCommand } from "./destructure-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(DestructureCommand.name, () => {
        it("returns the accessed object value", async () => {
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

        it("throws for invalid object accesses", async () => {
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
