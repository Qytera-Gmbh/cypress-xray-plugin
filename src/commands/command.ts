export abstract class Command {
    public abstract execute(): void | Promise<void>;
}
