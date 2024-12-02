import EventEmitter from "events";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { SkippedError } from "../util/errors";
import { LOG } from "../util/logging";
import { Command, ComputableState } from "./command";

describe(relative(cwd(), __filename), async () => {
    await describe(Command.name, async () => {
        await it("computes the result on compute call", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            class ArithmeticCommand extends Command<number, null> {
                private readonly x: number;
                private readonly operands: ArithmeticCommand[];

                constructor(x: number, ...operands: ArithmeticCommand[]) {
                    super(null, LOG);
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
            assert.strictEqual(await resultPromise, 100);
        });

        await it("returns the failure reason", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const error = new Error("Failure 123");
            class FailingCommand extends Command<number, null> {
                protected computeResult(): Promise<number> {
                    throw error;
                }
            }
            const command = new FailingCommand(null, LOG);
            await assert.rejects(command.compute(), { message: "Failure 123" });
            assert.strictEqual(command.getFailure(), error);
            assert.strictEqual(command.getState(), ComputableState.FAILED);
        });

        await it("returns arbitrary failure reasons", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            class FailingCommand extends Command<number, null> {
                protected computeResult(): Promise<number> {
                    throw "Oh no someone messed up" as unknown as Error;
                }
            }
            const command = new FailingCommand(null, LOG);
            await assert.rejects(command.compute(), { message: "Oh no someone messed up" });
            assert.deepStrictEqual(command.getFailure(), new Error("Oh no someone messed up"));
            assert.strictEqual(command.getState(), ComputableState.FAILED);
        });

        await it("returns the skip reason", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const error = new SkippedError("Skip 123");
            class SkippingCommand extends Command<number, null> {
                protected computeResult(): Promise<number> {
                    throw error;
                }
            }
            const command = new SkippingCommand(null, LOG);
            await assert.rejects(command.compute(), { message: "Skip 123" });
            assert.strictEqual(command.getFailure(), error);
            assert.strictEqual(command.getState(), ComputableState.SKIPPED);
        });

        await it("updates its state", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
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
            const command = new WaitingCommand(null, LOG);
            assert.strictEqual(command.getState(), ComputableState.INITIAL);
            const computePromise = command.compute();
            assert.strictEqual(command.getState(), ComputableState.PENDING);
            // Await something to force the event loop to go back to the computeResult() method.
            await new Promise<void>((resolve) => {
                resolve();
            });
            eventEmitter.emit("go");
            assert.strictEqual(await computePromise, 42);
            assert.strictEqual(command.getState(), ComputableState.SUCCEEDED);
        });

        await it("computes its result only once", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
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
            const command = new ComputingCommand(null, LOG);
            assert.strictEqual(await command.compute(), 42);
            assert.strictEqual(await command.compute(), 42);
        });

        await it("returns the LOG", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            class SomeCommand extends Command<string, null> {
                protected computeResult(): Promise<string> {
                    return new Promise((resolve) => {
                        resolve("ok");
                    });
                }
            }
            const command = new SomeCommand(null, LOG);
            assert.strictEqual(command.getLogger(), LOG);
        });
    });
});
