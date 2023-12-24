import { Command } from "../util/command/command";

export class ConstantCommand<R> extends Command<R> {
    constructor(private readonly value: R) {
        super();
        this.value = value;
    }

    protected computeResult(): R {
        return this.value;
    }
}
