import type { Logger } from "../../../util/logging";
import type { Computable, ComputableState, Stateful } from "../../command";
import { Command } from "../../command";

interface Parameters<T> {
    fallbackOn: ComputableState[];
    fallbackValue: T;
}

export class FallbackCommand<T, R> extends Command<R | T, Parameters<T>> {
    private readonly input: Computable<R> & Stateful<ComputableState>;
    constructor(parameters: Parameters<T>, logger: Logger, input: Command<R>) {
        super(parameters, logger);
        this.input = input;
    }

    protected async computeResult(): Promise<R | T> {
        if (this.parameters.fallbackOn.includes(this.input.getState())) {
            return this.parameters.fallbackValue;
        }
        return await this.input.compute();
    }
}
