import { expect } from "chai";
import { Executable, ExecutableGraph } from "./executable";

describe("ExecutableGraph", () => {
    it("executes vertices in post-order", async () => {
        class ExecutableVertex implements Executable {
            constructor(
                private readonly message: string,
                private readonly logger: (message: string) => void
            ) {
                this.message = message;
                this.logger = logger;
            }

            public execute(): void | Promise<void> {
                this.logger(this.message);
            }

            public toString(): string {
                return this.message;
            }
        }

        const messages: string[] = [];
        const logger = (message: string) => messages.push(message);

        const v1 = new ExecutableVertex("vertex 1", logger);
        const v2 = new ExecutableVertex("vertex 2", logger);
        const v3 = new ExecutableVertex("vertex 3", logger);
        const v4 = new ExecutableVertex("vertex 4", logger);

        const g = new ExecutableGraph();
        g.connect(v2, v1);
        g.connect(v1, v3);
        g.connect(v2, v4);
        g.connect(v4, v1);

        await g.execute();

        expect(messages).to.deep.eq(["vertex 2", "vertex 4", "vertex 1", "vertex 3"]);
    });
});
