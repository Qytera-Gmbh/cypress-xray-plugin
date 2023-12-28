import { Command, Computable } from "./command";

export class FunctionCommand<R> extends Command<void> {
    private readonly f: (input: R) => void | Promise<void>;
    private readonly input: Computable<R>;
    constructor(f: (input: R) => void | Promise<void>, input: Computable<R>) {
        super();
        this.f = f;
        this.input = input;
    }

    public getFunction(): (input: R) => void | Promise<void> {
        return this.f;
    }

    protected async computeResult(): Promise<void> {
        const input = await this.input.compute();
        await this.f(input);
    }
}
