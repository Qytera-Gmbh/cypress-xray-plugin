import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import EventEmitter from "node:events";
import path from "path";
import { Command, CommandState, SkippedError } from "./command";

chai.use(chaiAsPromised);

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

        it("returns the failure reason", async () => {
            const error = new Error("Failure 123");
            class FailingCommand extends Command<number, void> {
                protected computeResult(): Promise<number> {
                    throw error;
                }
            }
            const command = new FailingCommand();
            await expect(command.compute()).to.eventually.be.rejectedWith("Failure 123");
            expect(command.getFailureOrSkipReason()).to.eq(error);
            expect(command.getState()).to.eq(CommandState.FAILED);
        });

        it("returns the skip reason", async () => {
            const error = new SkippedError("Skip 123");
            class SkippingCommand extends Command<number, void> {
                protected computeResult(): Promise<number> {
                    throw error;
                }
            }
            const command = new SkippingCommand();
            await expect(command.compute()).to.eventually.be.rejectedWith("Skip 123");
            expect(command.getFailureOrSkipReason()).to.eq(error);
            expect(command.getState()).to.eq(CommandState.SKIPPED);
        });

        it("updates its state", async () => {
            const eventEmitter = new EventEmitter();

            class WaitingCommand extends Command<number, void> {
                protected computeResult(): Promise<number> {
                    return new Promise((resolve) => {
                        eventEmitter.once("go", () => {
                            resolve(42);
                        });
                    });
                }
            }
            const command = new WaitingCommand();
            expect(command.getState()).to.eq(CommandState.INITIAL);
            const computePromise = command.compute();
            expect(command.getState()).to.eq(CommandState.PENDING);
            // Await something to force the event loop to go back to the computeResult() method.
            await new Promise<void>((resolve) => {
                resolve();
            });
            eventEmitter.emit("go");
            expect(await computePromise).to.eq(42);
            expect(command.getState()).to.eq(CommandState.SUCCEEDED);
        });

        it("computes its result only once", async () => {
            class ComputingCommand extends Command<number, void> {
                private hasComputed = false;

                protected computeResult(): Promise<number> {
                    if (!this.hasComputed) {
                        this.hasComputed = true;
                        return new Promise((resolve) => {
                            resolve(42);
                        });
                    }
                    return new Promise((resolve) => {
                        resolve(0);
                    });
                }
            }
            const command = new ComputingCommand();
            expect(await command.compute()).to.eq(42);
            expect(await command.compute()).to.eq(42);
        });

        it("throws on failure retrieval if it did not fail", async () => {
            class ComputingCommand extends Command<number, void> {
                protected computeResult(): Promise<number> {
                    return new Promise((resolve) => {
                        resolve(42);
                    });
                }
            }
            const command = new ComputingCommand();
            expect(() => command.getFailureOrSkipReason()).to.throw(
                "The command was neither skipped, nor did it fail"
            );
            await command.compute();
            expect(() => command.getFailureOrSkipReason()).to.throw(
                "The command was neither skipped, nor did it fail"
            );
        });
    });
});
