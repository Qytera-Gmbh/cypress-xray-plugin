import { EventEmitter } from "node:events";
import { isSkippedError } from "../util/errors";

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
    implements Computable<R>, Stateful<ComputableState>
{
    /**
     * The command's parameters.
     */
    protected readonly parameters: P;
    private readonly result: Promise<R>;
    private readonly executeEmitter: EventEmitter = new EventEmitter();
    private state: ComputableState = ComputableState.INITIAL;
    private failureOrSkipReason: unknown = null;

    /**
     * Constructs a new command.
     *
     * @param parameters - the command parameters
     */
    constructor(parameters: P) {
        this.parameters = parameters;
        this.result = new Promise<void>((resolve) => this.executeEmitter.once("execute", resolve))
            .then(this.computeResult.bind(this))
            .then((result: R) => {
                this.setState(ComputableState.SUCCEEDED);
                return result;
            })
            .catch((error: unknown) => {
                if (isSkippedError(error)) {
                    this.setState(ComputableState.SKIPPED);
                } else {
                    this.setState(ComputableState.FAILED);
                }
                this.failureOrSkipReason = error;
                throw error;
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

    /**
     * Returns the reason why the command failed or was skipped.
     *
     * @returns the reason
     */
    public getFailureOrSkipReason(): unknown {
        return this.failureOrSkipReason;
    }

    /**
     * Computes the command's result.
     *
     * @returns the result
     */
    protected abstract computeResult(): Promise<R>;
}