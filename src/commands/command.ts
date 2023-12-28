import { EventEmitter } from "node:events";

/**
 * Models an entity which can compute a result.
 */
export interface Computable<R> {
    /**
     * Computes the result.
     *
     * @returns the result
     */
    compute: () => R | Promise<R>;
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
     * The command is done computing.
     */
    RESOLVED = "resolved",
    /**
     * The command encountered problems during execution.
     */
    REJECTED = "rejected",
    /**
     * The command was skipped.
     */
    SKIPPED = "skipped",
}

/**
 * An error which is thrown when a command is skipped.
 */
export class SkippedError extends Error {}

/**
 * Assesses whether the given error is an instance of a {@link SkippedError | `SkippedError`}.
 *
 * @param error - the error
 * @returns `true` if the error is a {@link SkippedError | `SkippedError`}, otherwise `false`
 */
export function isSkippedError(error: unknown): error is SkippedError {
    return error instanceof SkippedError;
}

/**
 * Models a generic command. The command only starts doing something when
 * {@link compute | `compute`} is triggered.
 */
export abstract class Command<R = unknown> implements Computable<R> {
    private readonly result: Promise<R>;
    private readonly executeEmitter: EventEmitter;
    private state: CommandState = CommandState.INITIAL;
    private reason?: unknown = null;

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
                        if (isSkippedError(error)) {
                            this.state = CommandState.SKIPPED;
                        } else {
                            this.state = CommandState.REJECTED;
                        }
                        this.reason = error;
                        reject(error);
                    });
            });
        });
    }

    /**
     * Returns the state the command is currently in.
     *
     * @returns the state
     */
    public getState(): CommandState {
        return this.state;
    }

    public async compute(): Promise<R> {
        if (this.state === CommandState.INITIAL) {
            this.state = CommandState.PENDING;
            this.executeEmitter.emit("execute");
        }
        return await this.result;
    }

    public getFailureOrSkipReason(): unknown {
        if (this.state !== CommandState.REJECTED && this.state !== CommandState.SKIPPED) {
            throw new Error("The command was neither skipped, nor did it fail");
        }
        return this.reason;
    }

    /**
     * Computes the command's result.
     *
     * @returns the result
     */
    protected abstract computeResult(): Promise<R>;
}