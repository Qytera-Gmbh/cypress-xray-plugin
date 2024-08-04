import { Logger } from "../../../util/logging";
import { Command, Computable } from "../../command";

export class DestructureCommand<R> extends Command<R, null> {
    private readonly input: Computable<Record<number | string | symbol, R>>;
    private readonly accessor: number | string | symbol;
    constructor(
        logger: Logger,
        input: Computable<Record<number | string | symbol, R>>,
        accessor: number | string | symbol
    ) {
        super(null, logger);
        this.input = input;
        this.accessor = accessor;
    }

    protected async computeResult(): Promise<R> {
        const input = await this.input.compute();
        const value = input[this.accessor];
        if (!value) {
            throw new Error(
                `Failed to access element ${this.accessor.toString()} in : ${JSON.stringify(input)}`
            );
        }
        return value;
    }
}
