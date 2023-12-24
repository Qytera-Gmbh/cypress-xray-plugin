import { EventEmitter } from "node:events";
import { Executable } from "./executable";

/**
 * Models an entity which can compute a result.
 */
export interface Computable<R> {
    /**
     * Retrieves the computed result.
     *
     * @returns the result
     */
    getResult: () => R | Promise<R>;
}

/**
 * Models the different states of a command.
 */
export enum CommandState {
    /**
     * The command has neither been told to compute, nor is it done computing.
     */
    INITIAL = "initial",
    /**
     * The command has been told to compute but is not yet done computing.
     */
    PENDING = "pending",
    /**
     * The command has been told to compute and is done computing.
     */
    SETTLED = "settled",
}

/**
 * Models a generic command. The command does not automatically compute or execute, it only starts
 * doing something when {@link Command.execute | `execute`} is triggered. All attempts to retrieve
 * the result prior to that will result in a pending promise being returned.
 */
export abstract class Command<R> implements Computable<R>, Executable {
    private readonly result: Promise<R>;
    private readonly executeEmitter: EventEmitter;
    private state: CommandState = CommandState.INITIAL;

    /**
     * Constructs a new command.
     */
    constructor() {
        this.executeEmitter = new EventEmitter();
        this.result = new Promise((resolve) => {
            this.executeEmitter.on("execute", () => {
                this.state = CommandState.SETTLED;
                resolve(this.computeResult());
            });
        });
    }

    public async getResult(): Promise<R> {
        return await this.result;
    }

    public async execute(): Promise<void> {
        if (this.state === "initial") {
            this.state = CommandState.PENDING;
            this.executeEmitter.emit("execute");
        }
    }

    /**
     * Returns the state the command is currently in.
     *
     * @returns the state
     */
    public getState(): CommandState {
        return this.state;
    }

    /**
     * Computes the command's result.
     *
     * @returns the result
     */
    protected abstract computeResult(): R | Promise<R>;
}
