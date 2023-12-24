import { Command } from "../util/command/command";

export class ReduceCommand<U, V, R> extends Command<R> {
    constructor(
        private readonly leftCommand: Command<U>,
        private readonly rightCommand: Command<V>,
        private readonly reducer: (left: U, right: V, initialValue?: R) => R | Promise<R>,
        private readonly initialValue?: R
    ) {
        super();
        this.leftCommand = leftCommand;
        this.rightCommand = rightCommand;
        this.reducer = reducer;
        this.initialValue = initialValue;
    }

    protected async computeResult(): Promise<R> {
        const inputs = await Promise.all([
            this.leftCommand.getResult(),
            this.rightCommand.getResult(),
        ]);
        return await this.reducer(inputs[0], inputs[1], this.initialValue);
    }
}
