import { Command, Computable } from "./command";

type ComputedTypes<T extends [...unknown[]]> = {
    [K in keyof T]: T[K] extends infer V ? Computable<V> : never;
};

export class CombineCommand<T extends [...unknown[]], R> extends Command<R> {
    private readonly f: (inputs: T) => R | Promise<R>;
    private readonly inputs: ComputedTypes<T>;
    constructor(f: (inputs: T) => R | Promise<R>, ...inputs: ComputedTypes<T>) {
        super();
        this.f = f;
        this.inputs = inputs;
    }

    public getFunction(): (inputs: T) => R | Promise<R> {
        return this.f;
    }

    protected async computeResult(): Promise<R> {
        const inputs = await Promise.all(this.inputs.map((computable) => computable.compute()));
        return await this.f(inputs as T);
    }
}
