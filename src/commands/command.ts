import { EventEmitter } from "node:events";
import { Executable } from "../util/command/executable";

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
    RESOLVED = "resolved",
    /**
     * The command has been told to compute and encountered problems during execution.
     */
    REJECTED = "rejected",
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
    private failure?: unknown = null;

    /**
     * Constructs a new command.
     */
    constructor() {
        this.executeEmitter = new EventEmitter();
        this.result = new Promise((resolve, reject) => {
            this.executeEmitter.on("execute", () => {
                this.computeResult()
                    .then((result: R) => {
                        this.state = CommandState.RESOLVED;
                        resolve(result);
                    })
                    .catch((error: unknown) => {
                        this.state = CommandState.REJECTED;
                        this.failure = error;
                        reject(error);
                    });
            });
        });
    }

    public execute(): void {
        if (this.state === CommandState.INITIAL) {
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

    public async getResult(): Promise<R> {
        if (this.state === CommandState.REJECTED) {
            throw new Error("The command failed");
        }
        return await this.result;
    }

    public getFailure(): unknown {
        if (this.state !== CommandState.REJECTED) {
            throw new Error("The command did not fail");
        }
        return this.failure;
    }

    /**
     * Computes the command's result.
     *
     * @returns the result
     */
    protected abstract computeResult(): Promise<R>;
}
