import { expect } from "chai";
import { getMockedLogger } from "../../../test/mocks";
import { Computable } from "../../hooks/command";
import { SkippedError } from "../errors";
import { Level } from "../logging";
import { ExecutableGraph } from "./executable";

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

describe("ExecutableGraph", () => {
    it("executes vertices in post-order", async () => {
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

    it("does not execute successors on partial failure", async () => {
        const pluginLogger = getMockedLogger();

        const messages: string[] = [];
        const logger = (message: string) => {
            if (message === "vertex 1") {
                throw new Error(`Error in ${message}`);
            }
            messages.push(message);
        };

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
        expect(messages).to.deep.eq(["vertex 2", "vertex 4"]);

        expect(pluginLogger.message).to.have.been.calledWithExactly(
            Level.ERROR,
            "Error in vertex 1"
        );
    });

    it("does not execute successors on full failure", async () => {
        const pluginLogger = getMockedLogger();

        const messages: string[] = [];
        const logger = (message: string) => {
            if (message === "vertex 1" || message === "vertex 4") {
                throw new Error(`Error in ${message}`);
            }
            messages.push(message);
        };

        const g = new ExecutableGraph();
        const v1 = g.place(new ComputableVertex("vertex 1", logger));
        const v2 = g.place(new ComputableVertex("vertex 2", logger));
        const v3 = g.place(new ComputableVertex("vertex 3", logger));
        const v4 = g.place(new ComputableVertex("vertex 4", logger));
        g.connect(v2, v1);
        g.connect(v1, v3);
        g.connect(v2, v4);
        g.connect(v4, v3);

        await g.execute();
        expect(messages).to.deep.eq(["vertex 2"]);
        expect(pluginLogger.message).to.have.been.calledWithExactly(
            Level.ERROR,
            "Error in vertex 1"
        );
        expect(pluginLogger.message).to.have.been.calledWithExactly(
            Level.ERROR,
            "Error in vertex 4"
        );
    });

    it("does not execute successors on skip", async () => {
        const pluginLogger = getMockedLogger();

        const messages: string[] = [];
        const logger = (message: string) => {
            if (message === "vertex 1") {
                throw new SkippedError(`Error in ${message}`);
            }
            messages.push(message);
        };

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
        expect(messages).to.deep.eq(["vertex 2", "vertex 4"]);

        expect(pluginLogger.message).to.have.been.calledWithExactly(
            Level.WARNING,
            "Error in vertex 1"
        );
    });

    it("still executes successors on failure if marked as optional", async () => {
        const pluginLogger = getMockedLogger();

        const messages: string[] = [];
        const logger = (message: string) => {
            if (message === "vertex 1") {
                throw new Error(`Error in ${message}`);
            }
            messages.push(message);
        };

        const g = new ExecutableGraph();
        const v1 = g.place(new ComputableVertex("vertex 1", logger));
        const v2 = g.place(new ComputableVertex("vertex 2", logger));
        const v3 = g.place(new ComputableVertex("vertex 3", logger));
        const v4 = g.place(new ComputableVertex("vertex 4", logger));
        g.connect(v2, v1);
        g.connect(v1, v3, true);
        g.connect(v2, v4);
        g.connect(v4, v1);
        g.connect(v4, v3);

        await g.execute();
        expect(messages).to.deep.eq(["vertex 2", "vertex 4", "vertex 3"]);

        expect(pluginLogger.message).to.have.been.calledWithExactly(
            Level.ERROR,
            "Error in vertex 1"
        );
    });

    it("still executes successors on skip if marked as optional", async () => {
        const pluginLogger = getMockedLogger();

        const messages: string[] = [];
        const logger = (message: string) => {
            if (message === "vertex 1") {
                throw new SkippedError(`Error in ${message}`);
            }
            messages.push(message);
        };

        const g = new ExecutableGraph();
        const v1 = g.place(new ComputableVertex("vertex 1", logger));
        const v2 = g.place(new ComputableVertex("vertex 2", logger));
        const v3 = g.place(new ComputableVertex("vertex 3", logger));
        const v4 = g.place(new ComputableVertex("vertex 4", logger));
        g.connect(v2, v1);
        g.connect(v1, v3, true);
        g.connect(v2, v4);
        g.connect(v4, v1);

        await g.execute();
        expect(messages).to.deep.eq(["vertex 2", "vertex 4", "vertex 3"]);

        expect(pluginLogger.message).to.have.been.calledWithExactly(
            Level.WARNING,
            "Error in vertex 1"
        );
    });
});
