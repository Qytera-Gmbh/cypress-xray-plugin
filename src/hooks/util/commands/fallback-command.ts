import { Logger } from "../../../util/logging";
import { Command, Computable, ComputableState, Stateful } from "../../command";

interface Parameters<T> {
    fallbackOn: ComputableState[];
    fallbackValue: T;
}

export class FallbackCommand<T, R> extends Command<T | R, Parameters<T>> {
    private readonly input: Computable<R> & Stateful<ComputableState>;
    constructor(parameters: Parameters<T>, logger: Logger, input: Command<R>) {
        super(parameters, logger);
        this.input = input;
    }

    protected async computeResult(): Promise<T | R> {
        if (this.parameters.fallbackOn.includes(this.input.getState())) {
            return this.parameters.fallbackValue;
        }
        return await this.input.compute();
    }
}
