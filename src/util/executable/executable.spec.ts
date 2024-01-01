import { expect } from "chai";
import { Computable } from "../../commands/command";
import { ExecutableGraph } from "./executable";

describe("ExecutableGraph", () => {
    it("executes vertices in post-order", async () => {
        class ComputableVertex implements Computable<unknown> {
            private readonly message: string;
            private readonly logger: (message: string) => void;
            constructor(message: string, logger: (message: string) => void) {
                this.message = message;
                this.logger = logger;
            }

            public compute(): void | Promise<void> {
                this.logger(this.message);
            }

            public toString(): string {
                return this.message;
            }
        }

        const messages: string[] = [];
        const logger = (message: string) => messages.push(message);

        const g = new ExecutableGraph();
        const v1 = g.place(new ComputableVertex("vertex 1", logger));
        const v2 = g.place(new ComputableVertex("vertex 2", logger));
        const v3 = g.place(new ComputableVertex("vertex 3", logger));
        const v4 = g.place(new ComputableVertex("vertex 4", logger));
        g.connect(v2, v1);
        g.connect(v1, v3);
        g.connect(v2, v4);
        g.connect(v4, v1);

        await g.execute();

        expect(messages).to.deep.eq(["vertex 2", "vertex 4", "vertex 1", "vertex 3"]);
    });
});
