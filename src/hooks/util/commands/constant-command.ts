import type { Logger } from "../../../util/logging.js";
import { Command } from "../../command.js";

export class ConstantCommand<R> extends Command<R, null> {
    private readonly value: R;
    constructor(logger: Logger, value: R) {
        super(null, logger);
        this.value = value;
    }

    public getValue(): R {
        return this.value;
    }

    protected computeResult(): R {
        return this.getValue();
    }
}
