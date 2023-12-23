import { Queue } from "../../queue/queue";
import { Stack } from "../../stack/stack";
import { DirectedEdge, DirectedGraph } from "../graph";

/**
 * Models search parameters for when the destination vertex is known.
 */
export interface KnownDestinationParameters<V> {
    /**
     * The starting vertex. If left `undefined`, the search will be performed for every vertex in
     * the graph which does not have any incoming edges.
     */
    source?: V;
    /**
     * The destination vertex.
     */
    destination: V;
}

/**
 * Models search parameters for when the destination vertex is unknown.
 */
export interface UnknownDestinationParameters<V> {
    /**
     * The starting vertex. If left `undefined`, the search will be performed for every vertex in
     * the graph which does not have any incoming edges.
     */
    source?: V;
    /**
     * A filter describing the destination vertex.
     *
     * @returns `true` for vertices which are considered the destination, `false` otherwise
     */
    filter: (vertex: V) => boolean;
}

/**
 * Performs a depth-first search in a graph.
 *
 * @param graph - the graph
 * @param parameters - the search parameters
 * @returns `true` if the vertex described by the parameters can be reached, otherwise `false`
 */
export function dfs<V, E extends DirectedEdge<V>>(
    graph: DirectedGraph<V, E>,
    parameters: KnownDestinationParameters<V>
): boolean;
export function dfs<V, E extends DirectedEdge<V>>(
    graph: DirectedGraph<V, E>,
    parameters: UnknownDestinationParameters<V>
): boolean;
export function dfs<V, E extends DirectedEdge<V>>(
    graph: DirectedGraph<V, E>,
    parameters: KnownDestinationParameters<V> | UnknownDestinationParameters<V>
): boolean {
    const stack: Stack<V> = new Stack();
    return search(graph, parameters, {
        push: stack.push.bind(stack),
        pop: stack.pop.bind(stack),
        isEmpty: stack.isEmpty.bind(stack),
    });
}

/**
 * Performs a breadth-first search in a graph.
 *
 * @param graph - the graph
 * @param parameters - the search parameters
 * @returns `true` if the vertex described by the parameters can be reached, otherwise `false`
 */
export function bfs<V, E extends DirectedEdge<V>>(
    graph: DirectedGraph<V, E>,
    parameters: KnownDestinationParameters<V>
): boolean;
export function bfs<V, E extends DirectedEdge<V>>(
    graph: DirectedGraph<V, E>,
    parameters: UnknownDestinationParameters<V>
): boolean;
export function bfs<V, E extends DirectedEdge<V>>(
    graph: DirectedGraph<V, E>,
    parameters: KnownDestinationParameters<V> | UnknownDestinationParameters<V>
): boolean {
    const queue: Queue<V> = new Queue();
    return search(graph, parameters, {
        push: queue.enqueue.bind(queue),
        pop: queue.dequeue.bind(queue),
        isEmpty: queue.isEmpty.bind(queue),
    });
}

interface VertexWorklist<V> {
    push: (vertex: V) => unknown;
    pop: () => V;
    isEmpty: () => boolean;
}

function search<V, E extends DirectedEdge<V>>(
    graph: DirectedGraph<V, E>,
    parameters: KnownDestinationParameters<V> | UnknownDestinationParameters<V>,
    worklist: VertexWorklist<V>
): boolean {
    const isDestination = (vertex: V) => {
        if ("destination" in parameters) {
            if (vertex === parameters.destination) {
                return true;
            }
        } else if (parameters.filter(vertex)) {
            return true;
        }
        return false;
    };
    if (parameters.source !== undefined) {
        if (isDestination(parameters.source)) {
            return true;
        }
        worklist.push(parameters.source);
    } else {
        for (const vertex of graph.getVertices()) {
            if (!graph.hasIncoming(vertex)) {
                worklist.push(vertex);
            }
        }
    }
    const discoveredVertices: Set<V> = new Set();
    while (!worklist.isEmpty()) {
        const currentVertex = worklist.pop();
        discoveredVertices.add(currentVertex);
        for (const edge of graph.getOutgoing(currentVertex)) {
            const edgeDestination = edge.getDestination();
            if (isDestination(edgeDestination)) {
                return true;
            }
            if (!discoveredVertices.has(edgeDestination)) {
                worklist.push(edgeDestination);
            }
        }
    }
    return false;
}
