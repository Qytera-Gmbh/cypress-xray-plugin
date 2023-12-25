import { expect } from "chai";
import { Command } from "./command";

describe("command", () => {
    it("computes the result only on execute call", async () => {
        class ArithmeticCommand extends Command<number> {
            private readonly x: number;
            private readonly operands: ArithmeticCommand[];

            constructor(x: number, ...operands: ArithmeticCommand[]) {
                super();
                this.x = x;
                this.operands = operands;
            }

            public async execute(): Promise<void> {
                return new Promise((resolve) => {
                    super.execute();
                    resolve();
                });
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
        await Promise.all([sum.execute(), a.execute(), b.execute()]);
        expect(await resultPromise).to.eq(100);
    });
});
