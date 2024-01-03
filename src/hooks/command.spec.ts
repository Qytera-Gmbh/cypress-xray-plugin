import { expect } from "chai";
import path from "path";
import { Command } from "./command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(Command.name, () => {
        it("computes the result on compute call", async () => {
            class ArithmeticCommand extends Command<number, void> {
                private readonly x: number;
                private readonly operands: ArithmeticCommand[];

                constructor(x: number, ...operands: ArithmeticCommand[]) {
                    super();
                    this.x = x;
                    this.operands = operands;
                }

                protected async computeResult(): Promise<number> {
                    let result = this.x;
                    for (const operand of this.operands) {
                        result = result + (await operand.compute());
                    }
                    return result;
                }
            }

            const a = new ArithmeticCommand(50);
            const b = new ArithmeticCommand(40);
            const sum = new ArithmeticCommand(10, a, b);
            const resultPromise = sum.compute();
            await Promise.all([sum.compute(), a.compute(), b.compute()]);
            expect(await resultPromise).to.eq(100);
        });
    });
});
