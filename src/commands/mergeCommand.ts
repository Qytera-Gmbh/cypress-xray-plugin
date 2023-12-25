import { Command, Computable } from "../util/command/command";

type ComputedTypes<T extends [...Computable<unknown>[]]> = {
    [K in keyof T]: T[K] extends Computable<infer V> ? V : never;
};

export class MergeCommand<T extends Computable<unknown>[], R> extends Command<R> {
    private readonly inputs: T;
    constructor(
        private readonly reducer: (inputs: ComputedTypes<T>) => R | Promise<R>,
        ...inputs: T
    ) {
        super();
        this.reducer = reducer;
        this.inputs = inputs;
    }

    protected async computeResult(): Promise<R> {
        const inputs = await Promise.all(this.inputs.map((computable) => computable.getResult()));
        return await this.reducer(inputs as ComputedTypes<T>);
    }
}
