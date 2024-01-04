import { Computable } from "../../hooks/command";
import { errorMessage, isSkippedError } from "../errors";
import { LOG, Level } from "../logging";
import { DirectedEdge, SimpleDirectedEdge, SimpleDirectedGraph } from "./graph";

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
export class ExecutableGraph<V extends Computable<unknown>> extends SimpleDirectedGraph<V> {
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
    public connect(source: V, destination: V, optional = false): SimpleDirectedEdge<V> {
        const edge = super.connect(source, destination);
        if (optional) {
            this.optionalEdges.add(edge);
        }
        return edge;
    }

    private async executeFollowedBySuccessors(vertex: V): Promise<void> {
        try {
            await vertex.compute();
            this.states.set(vertex, VertexState.COMPUTED);
        } catch (error: unknown) {
            if (isSkippedError(error)) {
                LOG.message(Level.WARNING, errorMessage(error));
            } else {
                LOG.message(Level.ERROR, errorMessage(error));
            }
            this.markForbidden(vertex);
        } finally {
            const successorPromises: Promise<void>[] = [];
            for (const edge of this.getOutgoing(vertex)) {
                const destination = edge.getDestination();
                if (this.canQueueVertex(destination)) {
                    this.states.set(destination, VertexState.PENDING);
                    successorPromises.push(this.executeFollowedBySuccessors(destination));
                }
            }
            await Promise.all(successorPromises);
        }
    }

    private markForbidden(vertex: V): void {
        if (this.states.get(vertex) !== VertexState.FORBIDDEN) {
            this.states.set(vertex, VertexState.FORBIDDEN);
            for (const edge of this.getOutgoing(vertex)) {
                if (!this.optionalEdges.has(edge)) {
                    this.markForbidden(edge.getDestination());
                }
            }
        }
    }

    private canQueueVertex(vertex: V): boolean {
        if (this.states.has(vertex)) {
            return false;
        }
        // Only allow computation when all predecessors are done.
        // Otherwise we might end up skipping in line.
        // An precedessor edge is:
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
