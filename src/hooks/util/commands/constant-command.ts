import { Command, CommandDescription } from "../../command";

export class ConstantCommand<R> extends Command<R, void> {
    private readonly value: R;
    constructor(value: R) {
        super();
        this.value = value;
    }

    public getValue(): R {
        return this.value;
    }

    public getDescription(): CommandDescription {
        return {
            description: "Returns a constant value.",
            runtimeInputs: [],
        };
    }

    protected computeResult(): Promise<R> {
        return new Promise((resolve) => {
            resolve(this.getValue());
        });
    }
}
