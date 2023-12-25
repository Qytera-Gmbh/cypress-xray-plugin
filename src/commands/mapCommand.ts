import { Command, Computable } from "../util/command/command";

export class MapCommand<U, V> extends Command<V> {
    constructor(
        private readonly mapper: (input: U) => V | Promise<V>,
        private readonly input: Computable<U>
    ) {
        super();
        this.mapper = mapper;
        this.input = input;
    }

    protected async computeResult(): Promise<V> {
        const input = await this.input.getResult();
        return await this.mapper(input);
    }
}
