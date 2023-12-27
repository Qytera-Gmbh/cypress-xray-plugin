import { Command, Computable } from "./command";

type ComputedTypes<T extends [...Computable<unknown>[]]> = {
    [K in keyof T]: T[K] extends Computable<infer V> ? V : never;
};

export class MergeCommand<T extends Computable<unknown>[], R> extends Command<R> {
    private readonly merger: (inputs: ComputedTypes<T>) => R | Promise<R>;
    private readonly inputs: T;
    constructor(merger: (inputs: ComputedTypes<T>) => R | Promise<R>, ...inputs: T) {
        super();
        this.merger = merger;
        this.inputs = inputs;
    }

    public getMerger(): (inputs: ComputedTypes<T>) => R | Promise<R> {
        return this.merger;
    }

    protected async computeResult(): Promise<R> {
        const inputs = await Promise.all(this.inputs.map((computable) => computable.compute()));
        return await this.merger(inputs as ComputedTypes<T>);
    }
}
