import { Computable, isSkippedError } from "../../commands/command";
import { LOG, Level } from "../../logging/logging";
import { errorMessage } from "../errors";
import { DirectedEdge, SimpleDirectedEdge, SimpleDirectedGraph } from "../graph/graph";

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
     * Stores vertices which cannot/must not be computed anymore because of failures or skips.
     */
    private readonly forbiddenVertices = new Set<Computable<unknown>>();
    /**
     * Stores edges which are optional, i.e. that the destination vertex should still compute even
     * if the predecessor failed to compute its result.
     */
    private readonly optionalEdges = new Set<DirectedEdge<V>>();

    /**
     * Triggers the graph's execution.
     */
    public async execute(): Promise<void> {
        const roots = [...this.getVertices()].filter((vertex) => !this.hasIncoming(vertex));
        await Promise.all(roots.map((root) => this.executeFollowedBySuccessors(root)));
    }

    /**
     * Connects two vertices in the graph with an edge. If the graph does not yet contain the
     * vertices, they will automatically be inserted prior to the connection.
     *
     * @param source - the source vertex
     * @param destination - the destination vertex
     * @param optional - `true` to mark the edge optional, `false` otherwise
     * @returns the new edge
     * @throws if the connection would introduce a duplicate edge or a cycle
     */
    public connect(source: V, destination: V, optional = false): SimpleDirectedEdge<V> {
        const edge = super.connect(source, destination);
        if (optional) {
            this.optionalEdges.add(edge);
        }
        return edge;
    }

    private async executeFollowedBySuccessors(vertex: V): Promise<void> {
        if (!this.computedVertices.has(vertex) && !this.forbiddenVertices.has(vertex)) {
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
                                    if (
                                        this.forbiddenVertices.has(edge.getSource()) &&
                                        this.optionalEdges.has(edge)
                                    ) {
                                        continue;
                                    }
                                    return false;
                                }
                            }
                            return true;
                        })
                        .map((successor) => this.executeFollowedBySuccessors(successor))
                );
            } catch (error: unknown) {
                if (isSkippedError(error)) {
                    LOG.message(Level.WARNING, errorMessage(error));
                } else {
                    LOG.message(Level.ERROR, errorMessage(error));
                }
                this.markForbidden(vertex);
            }
        }
    }

    /**
     * Marks a vertex and its successors as potentially forbidden, meaning that both the vertex and
     * its successors might not be computed anymore.
     *
     * @param vertex - the vertex
     */
    private markForbidden(vertex: V): void {
        if (!this.forbiddenVertices.has(vertex)) {
            this.forbiddenVertices.add(vertex);
            for (const edge of this.getOutgoing(vertex)) {
                if (!this.optionalEdges.has(edge)) {
                    this.markForbidden(edge.getDestination());
                }
            }
        }
    }
}
