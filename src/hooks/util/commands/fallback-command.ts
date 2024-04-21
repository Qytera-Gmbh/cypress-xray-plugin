import { Command, CommandDescription, Computable, ComputableState, Stateful } from "../../command";

interface Parameters<T> {
    fallbackOn: ComputableState[];
    fallbackValue: T;
}

export class FallbackCommand<T, R> extends Command<T | R, Parameters<T>> {
    private readonly input: Computable<R> & Stateful<ComputableState>;
    constructor(parameters: Parameters<T>, input: Command<R>) {
        super(parameters);
        this.input = input;
    }

    public getDescription(): CommandDescription {
        return {
            description:
                "Falls back to a predefined value in case the input command ends up in certain states.",
            runtimeInputs: ["the input command whose state to evaluate"],
        };
    }

    protected async computeResult(): Promise<T | R> {
        if (this.parameters.fallbackOn.includes(this.input.getState())) {
            return this.parameters.fallbackValue;
        }
        return await this.input.compute();
    }
}
