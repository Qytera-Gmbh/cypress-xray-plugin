import { Queue } from "../../queue/queue";
import { DirectedEdge, DirectedGraph } from "../graph";

/**
 * Computes a topological order for all vertices contained in a directed graph.
 *
 * The computed order is not guaranteed to be stable, i.e. two vertices with the same topological
 * depth may share the same index.
 *
 * @param graph - the graph
 * @returns a mapping of vertices to their index in the computed order
 */
export function computeTopologicalOrder<V, E extends DirectedEdge<V>>(
    graph: DirectedGraph<V, E>
): Map<V, number> {
    const distances = new Map<V, number>();
    const queue = new Queue<V>();
    for (const vertex of graph.getVertices()) {
        if (!graph.hasIncoming(vertex)) {
            queue.enqueue(vertex);
        }
    }
    while (!queue.isEmpty()) {
        const source = queue.dequeue();
        let sourceDistance = distances.get(source);
        if (sourceDistance === undefined) {
            sourceDistance = 0;
            distances.set(source, sourceDistance);
        }
        for (const outgoingEdge of graph.getOutgoing(source)) {
            const destination = outgoingEdge.getDestination();
            const destinationDistance = distances.get(outgoingEdge.getDestination());
            if (!destinationDistance || destinationDistance < sourceDistance + 1) {
                if (!queue.has(destination)) {
                    queue.enqueue(destination);
                }
                distances.set(destination, sourceDistance + 1);
            }
        }
    }
    return distances;
}
