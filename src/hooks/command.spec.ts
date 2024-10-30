import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import EventEmitter from "node:events";
import path from "node:path";
import { getMockedLogger } from "../../test/mocks";
import { SkippedError } from "../util/errors";
import { Command, ComputableState } from "./command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(Command.name, () => {
        it("computes the result on compute call", async () => {
            const logger = getMockedLogger();
            class ArithmeticCommand extends Command<number, null> {
                private readonly x: number;
                private readonly operands: ArithmeticCommand[];

                constructor(x: number, ...operands: ArithmeticCommand[]) {
                    super(null, logger);
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
            const logger = getMockedLogger();
            const error = new Error("Failure 123");
            class FailingCommand extends Command<number, null> {
                protected computeResult(): Promise<number> {
                    throw error;
                }
            }
            const command = new FailingCommand(null, logger);
            await expect(command.compute()).to.eventually.be.rejectedWith("Failure 123");
            expect(command.getFailure()).to.eq(error);
            expect(command.getState()).to.eq(ComputableState.FAILED);
        });

        it("returns arbitrary failure reasons", async () => {
            const logger = getMockedLogger();
            class FailingCommand extends Command<number, null> {
                protected computeResult(): Promise<number> {
                    throw "Oh no someone messed up" as unknown as Error;
                }
            }
            const command = new FailingCommand(null, logger);
            await expect(command.compute()).to.eventually.be.rejectedWith(
                "Oh no someone messed up"
            );
            expect(command.getFailure()).to.deep.eq(new Error("Oh no someone messed up"));
            expect(command.getState()).to.eq(ComputableState.FAILED);
        });

        it("returns the skip reason", async () => {
            const logger = getMockedLogger();
            const error = new SkippedError("Skip 123");
            class SkippingCommand extends Command<number, null> {
                protected computeResult(): Promise<number> {
                    throw error;
                }
            }
            const command = new SkippingCommand(null, logger);
            await expect(command.compute()).to.eventually.be.rejectedWith("Skip 123");
            expect(command.getFailure()).to.eq(error);
            expect(command.getState()).to.eq(ComputableState.SKIPPED);
        });

        it("updates its state", async () => {
            const logger = getMockedLogger();
            const eventEmitter = new EventEmitter();

            class WaitingCommand extends Command<number, null> {
                protected computeResult(): Promise<number> {
                    return new Promise((resolve) => {
                        eventEmitter.once("go", () => {
                            resolve(42);
                        });
                    });
                }
            }
            const command = new WaitingCommand(null, logger);
            expect(command.getState()).to.eq(ComputableState.INITIAL);
            const computePromise = command.compute();
            expect(command.getState()).to.eq(ComputableState.PENDING);
            // Await something to force the event loop to go back to the computeResult() method.
            await new Promise<void>((resolve) => {
                resolve();
            });
            eventEmitter.emit("go");
            expect(await computePromise).to.eq(42);
            expect(command.getState()).to.eq(ComputableState.SUCCEEDED);
        });

        it("computes its result only once", async () => {
            const logger = getMockedLogger();
            class ComputingCommand extends Command<number, null> {
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
            const command = new ComputingCommand(null, logger);
            expect(await command.compute()).to.eq(42);
            expect(await command.compute()).to.eq(42);
        });

        it("returns the logger", () => {
            const logger = getMockedLogger();
            class SomeCommand extends Command<string, null> {
                protected computeResult(): Promise<string> {
                    return new Promise((resolve) => {
                        resolve("ok");
                    });
                }
            }
            const command = new SomeCommand(null, logger);
            expect(command.getLogger()).to.eq(logger);
        });
    });
});
