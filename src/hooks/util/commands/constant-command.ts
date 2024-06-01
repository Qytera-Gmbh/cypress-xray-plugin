import { Logger } from "../../../util/logging";
import { Command } from "../../command";

export class ConstantCommand<R> extends Command<R, null> {
    private readonly value: R;
    constructor(logger: Logger, value: R) {
        super(null, logger);
        this.value = value;
    }

    public getValue(): R {
        return this.value;
    }

    protected computeResult(): Promise<R> {
        return new Promise((resolve) => {
            resolve(this.getValue());
        });
    }
}
