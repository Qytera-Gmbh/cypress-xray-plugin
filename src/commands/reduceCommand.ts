import { Command, Computable } from "../util/command/command";

export class ReduceCommand<U, V, R> extends Command<R> {
    constructor(
        private readonly left: Computable<U>,
        private readonly right: Computable<V>,
        private readonly reducer: (left: U, right: V, initialValue?: R) => R | Promise<R>,
        private readonly initialValue?: R
    ) {
        super();
        this.left = left;
        this.right = right;
        this.reducer = reducer;
        this.initialValue = initialValue;
    }

    public getInitialValue(): R | undefined {
        return this.initialValue;
    }

    protected async computeResult(): Promise<R> {
        const inputs = await Promise.all([this.left.getResult(), this.right.getResult()]);
        return await this.reducer(inputs[0], inputs[1], this.initialValue);
    }
}
