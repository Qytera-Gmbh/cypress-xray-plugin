import { Computable } from "../../commands/command";
import { LOG, Level } from "../../logging/logging";
import { errorMessage } from "../errors";
import { SimpleDirectedGraph } from "../graph/graph";

/**
 * Models a graph which can be executed in a top-down fashion, i.e. starting at vertices without
 * incoming edges and progressing towards leaf vertices without outgoing edges.
 */
export class ExecutableGraph<V extends Computable<unknown>> extends SimpleDirectedGraph<V> {
    /**
     * Stores vertices which computed their results successfully.
     */
    private readonly computedVertices = new Set<Computable<unknown>>();
    /**
     * Stores vertices which cannot/must not be computed anymore because of failures.
     */
    private readonly forbiddenVertices = new Set<Computable<unknown>>();

    /**
     * Triggers the graph's execution.
     */
    public async execute(): Promise<void> {
        const roots = [...this.getVertices()].filter((vertex) => !this.hasIncoming(vertex));
        await Promise.all(roots.map((root) => this.executeFollowedBySuccessors(root)));
    }

    private async executeFollowedBySuccessors(vertex: V): Promise<void> {
        if (!this.computedVertices.has(vertex)) {
            try {
                await vertex.compute();
                this.computedVertices.add(vertex);
                await Promise.all(
                    [...this.getOutgoing(vertex)]
                        .map((edge) => edge.getDestination())
                        .filter((successor) => {
                            // Skip vertices marked as failed/forbidden due to (propagated) errors.
                            if (this.forbiddenVertices.has(successor)) {
                                return false;
                            }
                            // Only allow computation when all predecessors are done.
                            // Otherwise we might end up skipping in line.
                            for (const edge of this.getIncoming(successor)) {
                                if (!this.computedVertices.has(edge.getSource())) {
                                    return false;
                                }
                            }
                            return true;
                        })
                        .map((successor) => this.executeFollowedBySuccessors(successor))
                );
            } catch (error: unknown) {
                LOG.message(Level.ERROR, errorMessage(error));
                this.markForbidden(vertex);
            }
        }
    }

    private markForbidden(vertex: V): void {
        if (!this.forbiddenVertices.has(vertex)) {
            this.forbiddenVertices.add(vertex);
            for (const edge of this.getOutgoing(vertex)) {
                this.markForbidden(edge.getDestination());
            }
        }
    }
}
