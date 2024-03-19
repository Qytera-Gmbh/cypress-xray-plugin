import { expect } from "chai";
import path from "path";
import { ConstantCommand } from "./constant-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ConstantCommand.name, () => {
        it("returns the value", async () => {
            const command = new ConstantCommand({
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
