import { Queue } from "../../queue/queue";
import { Stack } from "../../stack/stack";
import type { DirectedGraph } from "../graph";

/**
 * Models search parameters for when the destination vertex is known.
 */
interface KnownDestinationParameters<V> {
    /**
     * The destination vertex.
     */
    destination: V;
    /**
     * The starting vertex. If left `undefined`, the search will be performed for every vertex in
     * the graph which does not have any incoming edges.
     */
    source?: V;
}

/**
 * Models search parameters for when the destination vertex is unknown.
 */
interface UnknownDestinationParameters<V> {
    /**
     * A filter describing the destination vertex.
     *
     * @returns `true` for vertices which are considered the destination, `false` otherwise
     */
    filter: (vertex: V) => boolean;
    /**
     * The starting vertex. If left `undefined`, the search will be performed for every vertex in
     * the graph which does not have any incoming edges.
     */
    source?: V;
}

/**
 * Performs a depth-first search in a graph.
 *
 * @param graph - the graph
 * @param parameters - the search parameters
 * @returns `true` if the vertex described by the parameters can be reached, otherwise `false`
 */
export function dfs<V>(
    graph: DirectedGraph<V>,
    parameters: KnownDestinationParameters<V> | UnknownDestinationParameters<V>
): boolean {
    const stack = new Stack<V>();
    return search(graph, parameters, {
        isEmpty: stack.isEmpty.bind(stack),
        pop: stack.pop.bind(stack),
        push: stack.push.bind(stack),
    });
}

/**
 * Performs a breadth-first search in a graph.
 *
 * @param graph - the graph
 * @param parameters - the search parameters
 * @returns `true` if the vertex described by the parameters can be reached, otherwise `false`
 */
export function bfs<V>(
    graph: DirectedGraph<V>,
    parameters: KnownDestinationParameters<V> | UnknownDestinationParameters<V>
): boolean {
    const queue = new Queue<V>();
    return search(graph, parameters, {
        isEmpty: queue.isEmpty.bind(queue),
        pop: queue.dequeue.bind(queue),
        push: queue.enqueue.bind(queue),
    });
}

interface VertexWorklist<V> {
    isEmpty: () => boolean;
    pop: () => V;
    push: (vertex: V) => unknown;
}

function search<V>(
    graph: DirectedGraph<V>,
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
    const discoveredVertices = new Set<V>();
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
