import { Command, ComputableState } from "../../../hooks/command";
import { dedent } from "../../dedent";
import { errorMessage } from "../../errors";
import { unknownToString } from "../../string";
import { computeTopologicalOrder } from "../algorithms/sort";
import { DirectedEdge, DirectedGraph } from "../graph";

export async function graphToDot<V, E extends DirectedEdge<V>>(
    graph: DirectedGraph<V, E>,
    labeller: (vertex: V) => string | Promise<string>,
    edgeStyler: (edge: E) => "bold" | "dashed"
): Promise<string> {
    let i = 0;
    const ids = new Map<V, string>();
    const vertexLabels = new Map<V, string>();
    for (const vertex of graph.getVertices()) {
        const id = `v${i++}`;
        ids.set(vertex, id);
        vertexLabels.set(vertex, await labeller(vertex));
    }
    const sameRanks: Record<number, string[]> = {};
    for (const [vertex, depth] of computeTopologicalOrder(graph).entries()) {
        if (!(depth in sameRanks)) {
            sameRanks[depth] = [];
        }
        const id = ids.get(vertex);
        if (id) {
            sameRanks[depth].push(id);
        }
    }
    return dedent(`
        digraph "Plugin Execution Graph" {
          rankdir=TD;
          node[shape=none];
          ${[...graph.getVertices()]
              .map((vertex) => `${ids.get(vertex)}[label=${vertexLabels.get(vertex)}];`)
              .join("\n")}
          ${[...graph.getEdges()]
              .map(
                  (edge) =>
                      `${ids.get(edge.getSource())} -> ${ids.get(
                          edge.getDestination()
                      )}[arrowhead="vee",arrowsize="0.75",style=${edgeStyler(edge)}];`
              )
              .join("\n")}
          ${Object.values(sameRanks)
              .map((vertices) => `{ rank=same; ${vertices.join("; ")}; }`)
              .join("\n")}
        }
    `);
}

export async function commandToDot<R>(command: Command<R>): Promise<string> {
    let vertexDataRows: string | null = null;
    const parameters = escapeHtmlLabel(unknownToString(command.getParameters(), true));
    vertexDataRows = dedent(`
        <TR>
          ${td("Parameters", "right")}${td(parameters, "left")}
        </TR>
    `);
    let result = "pending";
    let color = "#aaaaaa";
    if (command.getState() === ComputableState.SUCCEEDED) {
        result = escapeHtmlLabel(unknownToString(await command.compute(), true));
        color = "#7abf69";
    } else if (command.getState() === ComputableState.SKIPPED) {
        if (command.getFailureOrSkipReason()) {
            result = escapeHtmlLabel(errorMessage(command.getFailureOrSkipReason()));
        } else {
            result = "skipped";
        }
        color = "#c8b77e";
    } else if (command.getState() === ComputableState.FAILED) {
        if (command.getFailureOrSkipReason()) {
            result = escapeHtmlLabel(errorMessage(command.getFailureOrSkipReason()));
        } else {
            result = "failed";
        }
        color = "#d8796f";
    }
    if (vertexDataRows) {
        return dedent(`
            <
              <TABLE BORDER="0" CELLSPACING="0" CELLBORDER="1" BGCOLOR="${color}">
                <TR>
                  <TD COLSPAN="2" ALIGN="LEFT">${command.constructor.name}</TD>
                </TR>
                ${vertexDataRows}
                <TR>
                  ${td("Result", "right")}${td(result, "left")}
                </TR>
              </TABLE>
            >
        `);
    }
    return dedent(`
        <
          <TABLE BORDER="0" CELLSPACING="0" CELLBORDER="1" BGCOLOR="${color}">
            <TR>
              <TD COLSPAN="2" ALIGN="LEFT">${command.constructor.name}</TD>
            </TR>
            <TR>
              ${td("Result", "right")}${td(result, "left")}
            </TR>
          </TABLE>
        >
    `);
}

function td(
    content: string,
    alignHorizontal: "left" | "right",
    alignVertical: "top" | "middle" = "top"
): string {
    return `<TD ALIGN="${alignHorizontal.toUpperCase()}" VALIGN="${alignVertical.toUpperCase()}">${content}</TD>`;
}

function escapeHtmlLabel(value: string, alignHorizontal: "left" | "right" = "left"): string {
    return value
        .split("\n")
        .map((line) => {
            if (line.length >= 200) {
                return `${line.substring(0, 196)} [...]`;
            }
            return line;
        })
        .join("\n")
        .concat("\n")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll(" ", "&nbsp;")
        .replaceAll("[", "&#91;")
        .replaceAll("]", "&#93;")
        .replaceAll("\n", `<BR ALIGN="${alignHorizontal.toUpperCase()}"/>`);
}