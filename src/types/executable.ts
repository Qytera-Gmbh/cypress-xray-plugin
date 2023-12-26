/**
 * Models an entity which can be executed either synchronously or asynchronously.
 */
export interface Executable {
    /**
     * Triggers the execution.
     */
    execute: () => void | Promise<void>;
}
