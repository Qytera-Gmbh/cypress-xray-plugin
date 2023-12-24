import { Command } from "../util/command/command";

export class ConstantCommand<R> extends Command<R> {
    constructor(private readonly value: R) {
        super();
        this.value = value;
    }

    public getValue(): R {
        return this.value;
    }

    protected computeResult(): R {
        return this.getValue();
    }
}
