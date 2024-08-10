import { Logger } from "../../../util/logging";
import { Command, Computable } from "../../command";

interface CommandParameters {
    accessor: number | string | symbol;
}

export class DestructureCommand<R> extends Command<R, CommandParameters> {
    private readonly input: Computable<Record<number | string | symbol, R>>;
    constructor(
        logger: Logger,
        input: Computable<Record<number | string | symbol, R>>,
        accessor: number | string | symbol
    ) {
        super({ accessor: accessor }, logger);
        this.input = input;
    }

    protected async computeResult(): Promise<R> {
        const input = await this.input.compute();
        const value = input[this.parameters.accessor];
        if (!value) {
            throw new Error(
                `Failed to access element ${this.parameters.accessor.toString()} in: ${JSON.stringify(
                    input
                )}`
            );
        }
        return value;
    }
}
