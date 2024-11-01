import { expect } from "chai";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks.js";
import { ConstantCommand } from "./constant-command.js";

await describe(path.relative(process.cwd(), import.meta.filename), () => {
    await describe(ConstantCommand.name, () => {
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
