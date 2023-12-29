import { Command, Computable } from "./command";

type ComputedTypes<T extends [...Computable<unknown>[]]> = {
    [K in keyof T]: T[K] extends Computable<infer V> ? V : never;
};

export class CombineCommand<T extends Computable<unknown>[], R> extends Command<R> {
    private readonly f: (inputs: ComputedTypes<T>) => R | Promise<R>;
    private readonly inputs: T;
    constructor(f: (inputs: ComputedTypes<T>) => R | Promise<R>, ...inputs: T) {
        super();
        this.f = f;
        this.inputs = inputs;
    }

    public getFunction(): (inputs: ComputedTypes<T>) => R | Promise<R> {
        return this.f;
    }

    protected async computeResult(): Promise<R> {
        const inputs = await Promise.all(this.inputs.map((computable) => computable.compute()));
        return await this.f(inputs as ComputedTypes<T>);
    }
}
