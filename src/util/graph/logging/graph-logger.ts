import { Command, ComputableState, Failable } from "../../../hooks/command";
import { ImportExecutionCucumberCommand } from "../../../hooks/util/commands/xray/import-execution-cucumber-command";
import { ImportExecutionCypressCommand } from "../../../hooks/util/commands/xray/import-execution-cypress-command";
import { ImportFeatureCommand } from "../../../hooks/util/commands/xray/import-feature-command";
import { dedent } from "../../dedent";
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

type UnfinishedLogMessage<V extends Failable> = Pick<IndentedLogMessage<V>, "text" | "level"> & {
    includePredecessors: boolean;
};

export class ChainingGraphLogger<V extends Failable> {
    private readonly logger: Logger;
    private readonly hasPriority: (vertex: V) => boolean;

    constructor(logger: Logger, hasPriority: (vertex: V) => boolean = () => false) {
        this.logger = logger;
        this.hasPriority = hasPriority;
    }

    public logGraph(graph: DirectedGraph<V, DirectedEdge<V>>): void {
        const loggedVertices = new Set<V>();
        const prioritizedVertices: V[] = [];
        for (const vertex of graph.getVertices()) {
            if (this.hasPriority(vertex)) {
                prioritizedVertices.push(vertex);
            }
        }
        prioritizedVertices.sort((a, b) => a.constructor.name.localeCompare(b.constructor.name));
        for (const vertex of prioritizedVertices) {
            const messageChain = this.computeLogMessageChain(vertex, graph);
            this.logMessageChain(messageChain).forEach((loggedVertex) =>
                loggedVertices.add(loggedVertex)
            );
        }
        for (const vertex of traverse(graph, "bottom-up")) {
            if (loggedVertices.has(vertex)) {
                continue;
            }
            const messageChain = this.computeLogMessageChain(vertex, graph);
            this.logMessageChain(messageChain).forEach((loggedVertex) =>
                loggedVertices.add(loggedVertex)
            );
        }
    }

    protected getLogMessage(vertex: V): UnfinishedLogMessage<V> | undefined {
        const error = vertex.getFailure();
        if (error) {
            return {
                text: error.message,
                level: isSkippedError(error) ? Level.WARNING : Level.ERROR,
                includePredecessors: false,
            };
        }
    }

    private computeLogMessageChain(
        vertex: V,
        graph: DirectedGraph<V, DirectedEdge<V>>
    ): IndentedLogMessage<V>[] {
        const messageTree: IndentedLogMessage<V>[] = [];
        const queue = new Queue<[V, number, boolean]>();
        queue.enqueue([vertex, 0, false]);
        while (!queue.isEmpty()) {
            const [currentVertex, indent, includePredecessors] = queue.dequeue();
            const message = this.getLogMessage(currentVertex);
            if (message) {
                messageTree.push({
                    ...message,
                    vertex: currentVertex,
                    indent: indent,
                });
                for (const predecessor of graph.getPredecessors(currentVertex)) {
                    if (!queue.find(([v]) => v === predecessor)) {
                        queue.enqueue([predecessor, indent + 1, message.includePredecessors]);
                    }
                }
            } else if (includePredecessors) {
                for (const predecessor of graph.getPredecessors(currentVertex)) {
                    if (!queue.find(([v]) => v === predecessor)) {
                        queue.enqueue([predecessor, indent, true]);
                    }
                }
            }
        }
        return messageTree;
    }

    private logMessageChain(messageChain: IndentedLogMessage<V>[]): Set<V> {
        const loggedVertices = new Set<V>();
        messageChain.sort((a, b) => a.indent - b.indent);
        for (const message of messageChain) {
            loggedVertices.add(message.vertex);
            this.logger.message(
                message.level,
                message.text.replace(/^/gm, "  ".repeat(message.indent))
            );
        }
        return loggedVertices;
    }
}

export class ChainingCommandGraphLogger extends ChainingGraphLogger<Command> {
    constructor(logger: Logger) {
        super(logger, (command) => {
            return (
                command instanceof ImportExecutionCypressCommand ||
                command instanceof ImportExecutionCucumberCommand ||
                command instanceof ImportFeatureCommand
            );
        });
    }

    protected getLogMessage(vertex: Command): UnfinishedLogMessage<Command> | undefined {
        const message = super.getLogMessage(vertex);
        if (message) {
            return message;
        }
        if (vertex.getState() === ComputableState.SKIPPED) {
            if (vertex instanceof ImportExecutionCypressCommand) {
                return {
                    text: "Failed to upload Cypress execution results.",
                    level: Level.ERROR,
                    includePredecessors: true,
                };
            }
            if (vertex instanceof ImportExecutionCucumberCommand) {
                return {
                    text: "Failed to upload Cucumber execution results.",
                    level: Level.ERROR,
                    includePredecessors: true,
                };
            }
            if (vertex instanceof ImportFeatureCommand) {
                return {
                    text: dedent(`
                        ${vertex.getParameters().filePath}

                          Failed to import feature file.
                    `),
                    level: Level.ERROR,
                    includePredecessors: true,
                };
            }
        }
    }
}
