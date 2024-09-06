import { Command, ComputableState, Failable } from "../../../hooks/command";
import { ImportExecutionCucumberCommand } from "../../../hooks/util/commands/xray/import-execution-cucumber-command";
import { ImportExecutionCypressCommand } from "../../../hooks/util/commands/xray/import-execution-cypress-command";
import { ImportFeatureCommand } from "../../../hooks/util/commands/xray/import-feature-command";
import { dedent } from "../../dedent";
import { isSkippedError } from "../../errors";
import { Level, Logger } from "../../logging";
import { Queue } from "../../queue/queue";
import { traverse } from "../algorithms/sort";
import { DirectedEdge, DirectedGraph, SimpleDirectedEdge } from "../graph";

interface IndentedLogMessage<V extends Failable> {
    indent: number;
    level: Level.ERROR | Level.WARNING;
    text: string;
    vertex: V;
}

type UnfinishedLogMessage<V extends Failable> = Pick<IndentedLogMessage<V>, "level" | "text"> & {
    includePredecessors: boolean;
};

export class ChainingGraphLogger<V extends Failable, E extends DirectedEdge<V>> {
    private readonly logger: Logger;
    private readonly hasPriority: (vertex: V) => boolean;

    constructor(logger: Logger, hasPriority: (vertex: V) => boolean = () => false) {
        this.logger = logger;
        this.hasPriority = hasPriority;
    }

    public logGraph(graph: DirectedGraph<V, E>): void {
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

    protected getLogMessage(vertex: V): undefined | UnfinishedLogMessage<V> {
        const error = vertex.getFailure();
        if (error) {
            return {
                includePredecessors: false,
                level: isSkippedError(error) ? Level.WARNING : Level.ERROR,
                text: error.message,
            };
        }
    }

    private computeLogMessageChain(vertex: V, graph: DirectedGraph<V, E>): IndentedLogMessage<V>[] {
        const chain: IndentedLogMessage<V>[] = [];
        const queue = new Queue<[V, number, boolean]>();
        queue.enqueue([vertex, 0, false]);
        while (!queue.isEmpty()) {
            const [currentVertex, indent, includePredecessors] = queue.dequeue();
            const message = this.getLogMessage(currentVertex);
            if (message) {
                chain.push({
                    ...message,
                    indent: indent,
                    vertex: currentVertex,
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
        return chain;
    }

    private logMessageChain(chain: IndentedLogMessage<V>[]): Set<V> {
        const loggedVertices = new Set<V>();
        if (chain.length === 0) {
            return loggedVertices;
        }
        chain.sort((a, b) => a.indent - b.indent);
        let logMessage = "";
        for (let i = chain.length - 1; i >= 0; i--) {
            if (i === chain.length - 1) {
                logMessage = chain[i].text;
            } else {
                if (chain[i + 1].indent > chain[i].indent) {
                    logMessage = dedent(`
                        ${chain[i].text}

                          Caused by: ${logMessage}
                    `);
                } else {
                    logMessage = dedent(`
                        ${chain[i].text}

                        Caused by: ${logMessage}
                    `);
                }
            }
        }
        for (const message of chain) {
            loggedVertices.add(message.vertex);
        }
        const level = chain
            .map((message) => message.level)
            .reduce((previous, current) => {
                if (previous === Level.ERROR || current === Level.ERROR) {
                    return Level.ERROR;
                }
                return previous;
            }, chain[0].level);
        this.logger.message(level, logMessage);
        return loggedVertices;
    }
}

export class ChainingCommandGraphLogger extends ChainingGraphLogger<
    Command,
    SimpleDirectedEdge<Command>
> {
    constructor(logger: Logger) {
        super(logger, (command) => {
            return (
                command instanceof ImportExecutionCypressCommand ||
                command instanceof ImportExecutionCucumberCommand ||
                command instanceof ImportFeatureCommand
            );
        });
    }

    protected getLogMessage(vertex: Command): undefined | UnfinishedLogMessage<Command> {
        const message = super.getLogMessage(vertex);
        if (message) {
            return message;
        }
        if (vertex.getState() === ComputableState.SKIPPED) {
            if (vertex instanceof ImportExecutionCypressCommand) {
                return {
                    includePredecessors: true,
                    level: Level.ERROR,
                    text: "Failed to upload Cypress execution results.",
                };
            }
            if (vertex instanceof ImportExecutionCucumberCommand) {
                return {
                    includePredecessors: true,
                    level: Level.ERROR,
                    text: "Failed to upload Cucumber execution results.",
                };
            }
            if (vertex instanceof ImportFeatureCommand) {
                return {
                    includePredecessors: true,
                    level: Level.ERROR,
                    text: dedent(`
                        ${vertex.getParameters().filePath}

                          Failed to import feature file.
                    `),
                };
            }
        }
    }
}
