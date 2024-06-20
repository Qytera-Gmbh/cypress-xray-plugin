import { EventEmitter } from "node:events";
import { isSkippedError } from "../util/errors";
import { Logger } from "../util/logging";
import { unknownToString } from "../util/string";

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

export interface Failable {
    /**
     * Returns the reason why the entity failed.
     *
     * @returns the error or `undefined` if there was no failure
     */
    getFailure: () => Error | undefined;
}

/**
 * Models the different states of a command.
 */
export enum ComputableState {
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

export interface Stateful<S> {
    /**
     * Returns the state the object is currently in.
     *
     * @returns the state
     */
    getState(): S;
    /**
     * Sets the object's state to the new state.
     *
     * @param state - the new state
     */
    setState(state: S): void;
}

/**
 * Models a generic command. The command only starts doing something when
 * {@link compute | `compute`} is triggered.
 */
export abstract class Command<R = unknown, P = unknown>
    implements Computable<R>, Stateful<ComputableState>, Failable
{
    /**
     * The command's parameters.
     */
    protected readonly parameters: P;
    /**
     * The logger to use for printing progress, failure or success messages.
     */
    protected readonly logger: Logger;
    private readonly result: Promise<R>;
    private readonly executeEmitter: EventEmitter = new EventEmitter();
    private state: ComputableState = ComputableState.INITIAL;
    private failureOrSkipReason: Error | undefined = undefined;

    /**
     * Constructs a new command.
     *
     * @param parameters - the command parameters
     * @param logger - the logger to use for log messages
     */
    constructor(parameters: P, logger: Logger) {
        this.parameters = parameters;
        this.logger = logger;
        this.result = new Promise<void>((resolve) => this.executeEmitter.once("execute", resolve))
            .then(this.computeResult.bind(this))
            .then((result: R) => {
                this.setState(ComputableState.SUCCEEDED);
                return result;
            })
            .catch((error: unknown) => {
                if (error instanceof Error) {
                    if (isSkippedError(error)) {
                        this.setState(ComputableState.SKIPPED);
                    } else {
                        this.setState(ComputableState.FAILED);
                    }
                    this.failureOrSkipReason = error;
                } else {
                    this.setState(ComputableState.FAILED);
                    this.failureOrSkipReason = new Error(unknownToString(error));
                }
                throw this.failureOrSkipReason;
            });
    }

    public async compute(): Promise<R> {
        if (this.state === ComputableState.INITIAL) {
            this.state = ComputableState.PENDING;
            this.executeEmitter.emit("execute");
        }
        return await this.result;
    }

    /**
     * Returns the command's parameters.
     *
     * @returns the parameters
     */
    public getParameters(): P {
        return this.parameters;
    }

    public getState(): ComputableState {
        return this.state;
    }

    public setState(state: ComputableState): void {
        this.state = state;
    }

    public getFailure(): Error | undefined {
        return this.failureOrSkipReason;
    }

    public getLogger(): Logger {
        return this.logger;
    }

    /**
     * Computes the command's result.
     *
     * @returns the result
     */
    protected abstract computeResult(): R | Promise<R>;
}
