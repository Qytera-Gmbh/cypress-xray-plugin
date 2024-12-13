import type { Computable, Stateful } from "../../hooks/command";
import { ComputableState } from "../../hooks/command";
import type { DirectedEdge, SimpleDirectedEdge } from "./graph";
import { SimpleDirectedGraph } from "./graph";

enum VertexState {
    /**
     * The vertex has been queued and is pending computation.
     */
    PENDING,
    /**
     * The vertex successfully computed its result.
     */
    COMPUTED,
    /**
     * The vertex failed computing its result.
     */
    FORBIDDEN,
}

/**
 * Models a graph which can be executed in a top-down fashion, i.e. starting at vertices without
 * incoming edges and progressing towards leaf vertices without outgoing edges.
 */
export class ExecutableGraph<
    V extends Computable<unknown> & Stateful<ComputableState>,
> extends SimpleDirectedGraph<V> {
    /**
     * Maps vertices to their execution states.
     */
    private readonly states = new Map<Computable<unknown>, VertexState>();
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
        await Promise.all(
            roots.map((root) => {
                this.states.set(root, VertexState.PENDING);
                return this.executeFollowedBySuccessors(root);
            })
        );
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
    public connect<S extends V, D extends V>(
        source: S,
        destination: D,
        optional = false
    ): SimpleDirectedEdge<S, D> {
        const edge = super.connect(source, destination);
        if (optional) {
            this.optionalEdges.add(edge);
        }
        return edge;
    }

    /**
     * Returns whether an edge is an optional edge.
     *
     * @param edge - the edge
     * @returns `true` if the edge is optional, `false` otherwise
     */
    public isOptional(edge: DirectedEdge<V>): boolean {
        return this.optionalEdges.has(edge);
    }

    private async executeFollowedBySuccessors(vertex: V): Promise<void> {
        const successors = new Set<V>(this.getSuccessors(vertex));
        try {
            await vertex.compute();
            this.states.set(vertex, VertexState.COMPUTED);
            // Errors are logged by the computables themselves.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error: unknown) {
            const nextRoots = this.markForbidden(vertex);
            nextRoots.forEach((root) => successors.add(root));
        } finally {
            const successorPromises: Promise<void>[] = [];
            for (const successor of successors) {
                if (this.canQueueVertex(successor)) {
                    this.states.set(successor, VertexState.PENDING);
                    successorPromises.push(this.executeFollowedBySuccessors(successor));
                }
            }
            await Promise.all(successorPromises);
        }
    }

    private markForbidden(vertex: V): Set<V> {
        // It might be possible to encounter a vertex deep down the tree which has all inputs marked
        // optional and could thus still be executed. These need to be collected.
        const nextRoots = new Set<V>();
        if (this.states.get(vertex) !== VertexState.FORBIDDEN) {
            this.states.set(vertex, VertexState.FORBIDDEN);
            for (const edge of this.getOutgoing(vertex)) {
                // All non-optional destinations must also be marked forbidden since they now need
                // to be skipped entirely.
                if (!this.optionalEdges.has(edge)) {
                    this.markForbidden(edge.getDestination()).forEach((root) =>
                        nextRoots.add(root)
                    );
                    edge.getDestination().setState(ComputableState.SKIPPED);
                } else {
                    nextRoots.add(edge.getDestination());
                }
            }
        }
        return nextRoots;
    }

    private canQueueVertex(vertex: V): boolean {
        if (this.states.has(vertex)) {
            return false;
        }
        // Only allow computation when all predecessors are done.
        // Otherwise we might end up skipping in line.
        // A precedessor edge is:
        // - ok iff:        success ||  (failed && optional)
        // - not okay iff: !success && !(failed && optional)
        for (const incomingEdge of this.getIncoming(vertex)) {
            if (
                this.states.get(incomingEdge.getSource()) !== VertexState.COMPUTED &&
                !(
                    this.states.get(incomingEdge.getSource()) === VertexState.FORBIDDEN &&
                    this.optionalEdges.has(incomingEdge)
                )
            ) {
                return false;
            }
        }
        return true;
    }
}
