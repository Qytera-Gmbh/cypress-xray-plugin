import { Command, Computable } from "./command";

export class FunctionCommand<R> extends Command<void> {
    private readonly function: (input: R) => void | Promise<void>;
    private readonly input: Computable<R>;
    constructor(assertion: (input: R) => void | Promise<void>, input: Computable<R>) {
        super();
        this.function = assertion;
        this.input = input;
    }

    public getFunction(): (input: R) => void | Promise<void> {
        return this.function;
    }

    protected async computeResult(): Promise<void> {
        const input = await this.input.compute();
        await this.function(input);
    }
}
