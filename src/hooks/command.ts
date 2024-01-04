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
    SUCCEEDED = "succeeded",
    /**
     * The command encountered problems during execution.
     */
    FAILED = "failed",
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
export abstract class Command<R = unknown, P = unknown> implements Computable<R> {
    protected readonly parameters: P;
    private readonly result: Promise<R>;
    private readonly executeEmitter: EventEmitter;
    private state: CommandState = CommandState.INITIAL;
    private reason?: unknown = null;

    /**
     * Constructs a new command.
     */
    constructor(parameters: P) {
        this.parameters = parameters;
        this.executeEmitter = new EventEmitter();
        this.result = new Promise<void>((resolve) => this.executeEmitter.once("execute", resolve))
            .then(this.computeResult.bind(this))
            .then((result: R) => {
                this.state = CommandState.SUCCEEDED;
                return result;
            })
            .catch((error: unknown) => {
                if (isSkippedError(error)) {
                    this.state = CommandState.SKIPPED;
                } else {
                    this.state = CommandState.FAILED;
                }
                this.reason = error;
                throw error;
            });
    }

    /**
     * Returns the command's parameters.
     *
     * @returns the parameters
     */
    public getParameters(): P {
        return this.parameters;
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
        if (this.state !== CommandState.FAILED && this.state !== CommandState.SKIPPED) {
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
