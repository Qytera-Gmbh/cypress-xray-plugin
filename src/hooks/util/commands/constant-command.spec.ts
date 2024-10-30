import { expect } from "chai";
import path from "node:path";
import { getMockedLogger } from "../../../../test/mocks";
import { ConstantCommand } from "./constant-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ConstantCommand.name, () => {
        it("returns the value", async () => {
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
