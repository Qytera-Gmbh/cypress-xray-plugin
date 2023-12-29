import { Command, Computable } from "./command";

export class FunctionCommand<U, R> extends Command<R> {
    private readonly f: (input: U) => R | Promise<R>;
    private readonly input: Computable<U>;
    constructor(f: (input: U) => R | Promise<R>, input: Computable<U>) {
        super();
        this.f = f;
        this.input = input;
    }

    public getFunction(): (input: U) => R | Promise<R> {
        return this.f;
    }

    protected async computeResult(): Promise<R> {
        const input = await this.input.compute();
        return await this.f(input);
    }
}
