import { traverse } from "../../util/graph/algorithms/sort";
import { DirectedEdge, DirectedGraph } from "../../util/graph/graph";
import { Command } from "../command";
import { EditIssueFieldCommand } from "../util/commands/jira/edit-issue-field-command";
import { FieldValueMap } from "../util/commands/jira/get-field-values-command";
import { GetLabelValuesCommand } from "../util/commands/jira/get-label-values-command";
import { GetSummaryValuesCommand } from "../util/commands/jira/get-summary-values-command";
import { GetTestTypeValuesCommandServer } from "../util/commands/jira/get-test-type-values-command";
import { ImportExecutionCucumberCommand } from "../util/commands/xray/import-execution-cucumber-command";
import { ImportExecutionCypressCommand } from "../util/commands/xray/import-execution-cypress-command";
import { ImportFeatureCommand } from "../util/commands/xray/import-feature-command";
import { Optimiser } from "./optimisation";

type RelevantCommand =
    | GetLabelValuesCommand
    | GetSummaryValuesCommand
    | GetTestTypeValuesCommandServer;

interface AnalysedCommand {
    command: GetLabelValuesCommand | GetSummaryValuesCommand | GetTestTypeValuesCommandServer;
    state: "live" | "tainted";
}

type TaintedCommand =
    | EditIssueFieldCommand<keyof FieldValueMap>
    | ImportExecutionCucumberCommand
    | ImportExecutionCypressCommand
    | ImportFeatureCommand;

export class JiraSearchOptimisation extends Optimiser<
    Command,
    DirectedEdge<Command>,
    DirectedGraph<Command, DirectedEdge<Command>>
> {
    private static isRelevant(command: Command): command is RelevantCommand {
        return (
            command instanceof GetLabelValuesCommand ||
            command instanceof GetSummaryValuesCommand ||
            command instanceof GetTestTypeValuesCommandServer
        );
    }

    private static isTainted(command: Command): command is TaintedCommand {
        return (
            command instanceof EditIssueFieldCommand ||
            command instanceof ImportExecutionCucumberCommand ||
            command instanceof ImportExecutionCypressCommand ||
            command instanceof ImportFeatureCommand
        );
    }

    public optimise(): Promise<void> | void {
        if ([2].includes(2)) {
            for (const edge of [...this.graph.getEdges()]) {
                if (JiraSearchOptimisation.isTainted(edge.getDestination())) {
                    this.graph.remove(edge);
                }
            }
            return;
        }
        const relevantIn = new Map<Command, Set<AnalysedCommand>>();
        const relevantOut = new Map<Command, Set<AnalysedCommand>>();
        for (const command of traverse(this.graph, "top-down")) {
            const commandIn = new Set<AnalysedCommand>();
            const commandOut = new Set<AnalysedCommand>();
            for (const predecessor of this.graph.getPredecessors(command)) {
                const predecessorOut = relevantOut.get(predecessor);
                if (predecessorOut) {
                    predecessorOut.forEach((v) => {
                        commandIn.add(v);
                        if (!JiraSearchOptimisation.isTainted(command)) {
                            commandOut.add(v);
                        } else {
                            commandOut.add({ ...v, state: "tainted" });
                        }
                    });
                }
            }
            if (JiraSearchOptimisation.isRelevant(command)) {
                commandOut.add({ command: command, state: "live" });
            }
            relevantIn.set(command, commandIn);
            relevantOut.set(command, commandOut);
        }
        const splits = this.split(relevantIn);
        console.log(splits);
    }

    private split(relevantIn: Map<Command, Set<AnalysedCommand>>): Set<AnalysedCommand>[] {
        const candidates: Set<AnalysedCommand>[] = [];
        for (const [command, commandIn] of relevantIn.entries()) {
            if (JiraSearchOptimisation.isTainted(command)) {
                const liveCommands = [...commandIn].filter((v) => v.state === "live");
                const candidateSet = candidates.find((set) =>
                    liveCommands.every((v) => set.has(v))
                );
                if (candidateSet) {
                    liveCommands.forEach((v) => candidateSet.add(v));
                } else {
                    candidates.push(new Set(liveCommands));
                }
            }
        }
        return candidates;
    }
}
