import { Failable } from "../../../hooks/command";
import { isSkippedError } from "../../errors";
import { Level, Logger } from "../../logging";
import { Queue } from "../../queue/queue";
import { traverse } from "../algorithms/sort";
import { DirectedEdge, DirectedGraph } from "../graph";

interface IndentedLogMessage<V extends Failable> {
    vertex: V;
    text: string;
    level: Level;
    indent: number;
}

export function logGraph<V extends Failable>(
    graph: DirectedGraph<V, DirectedEdge<V>>,
    logger: Logger
): void {
    const loggedVertices = new Set<V>();
    for (const vertex of traverse(graph, "bottom-up")) {
        if (loggedVertices.has(vertex)) {
            continue;
        }
        const messageTree = computeLogMessageTree(vertex, graph);
        loggedVertices.add(vertex);
        for (const message of messageTree) {
            loggedVertices.add(message.vertex);
            logger.message(message.level, message.text.replace(/^/gm, "  ".repeat(message.indent)));
        }
    }
}

function computeLogMessageTree<V extends Failable>(
    vertex: V,
    graph: DirectedGraph<V, DirectedEdge<V>>
): IndentedLogMessage<V>[] {
    const messageTree: IndentedLogMessage<V>[] = [];
    const queue = new Queue<[V, number]>();
    queue.enqueue([vertex, 0]);
    while (!queue.isEmpty()) {
        const [currentVertex, indent] = queue.dequeue();
        const message = getLogMessage(currentVertex, indent);
        if (message) {
            messageTree.push(message);
            for (const predecessor of graph.getPredecessors(currentVertex)) {
                if (messageTree.some((m) => m.vertex === predecessor)) {
                    continue;
                }
                if (!queue.find(([c]) => c === predecessor)) {
                    queue.enqueue([predecessor, indent + 1]);
                }
            }
        }
    }
    return messageTree;
}

function getLogMessage<V extends Failable>(
    vertex: V,
    indent: number
): IndentedLogMessage<V> | undefined {
    const error = vertex.getFailure();
    if (error) {
        return {
            vertex: vertex,
            text: error.message,
            level: isSkippedError(error) ? Level.WARNING : Level.ERROR,
            indent: indent,
        };
    }
}
