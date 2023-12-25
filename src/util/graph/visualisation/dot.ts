import { Command, CommandState } from "../../../commands/command";
import { ExtractFeatureFileTagsCommand } from "../../../commands/cucumber/extractFeatureFileIssuesCommand";
import { ParseFeatureFileCommand } from "../../../commands/cucumber/parseFeatureFileCommand";
import { ExtractFieldIdCommand } from "../../../commands/jira/fields/extractFieldIdCommand";
import { ImportFeatureCommand } from "../../../commands/xray/importFeatureCommand";
import { dedent } from "../../dedent";
import { errorMessage } from "../../errors";
import { unknownToString } from "../../string";
import { DirectedEdge, DirectedGraph } from "../graph";

export async function graphToDot<V>(
    graph: DirectedGraph<V, DirectedEdge<V>>,
    labeller: (vertex: V) => string | Promise<string>
): Promise<string> {
    let i = 0;
    const ids = new Map<V, string>();
    const vertexLabels = new Map<V, string>();
    for (const vertex of graph.getVertices()) {
        const id = `v${i++}`;
        ids.set(vertex, id);
        vertexLabels.set(vertex, await labeller(vertex));
    }
    return dedent(`
        digraph PluginExecutionGraph {
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
                      )}[arrowhead="vee",arrowsize="0.75"];`
              )
              .join("\n")}
        }
    `);
}

export async function commandToDot<R>(command: Command<R>): Promise<string> {
    let vertexDataRows: string | null = null;
    if (command instanceof ExtractFeatureFileTagsCommand) {
        const prefixes = escapeHtmlLabel(unknownToString(command.getPrefixes(), true));
        vertexDataRows = dedent(`
            <TR>
              ${td("Project key", "right")}${td(command.getProjectKey(), "left")}
            </TR>
            <TR>
              ${td("Prefixes", "right")}${td(prefixes, "left")}
            </TR>
        `);
    } else if (command instanceof ParseFeatureFileCommand) {
        vertexDataRows = dedent(`
            <TR>
              ${td("File path", "right")}${td(command.getFilePath(), "left")}
            </TR>
        `);
    } else if (command instanceof ExtractFieldIdCommand) {
        vertexDataRows = dedent(`
            <TR>
              ${td("Field", "right")}${td(command.getField(), "left")}
            </TR>
        `);
    } else if (command instanceof ImportFeatureCommand) {
        vertexDataRows = dedent(`
            <TR>
              ${td("File path", "right")}${td(command.getFilePath(), "left")}
            </TR>
            <TR>
              ${td("Project key", "right")}${td(unknownToString(command.getProjectKey()), "left")}
            </TR>
            <TR>
              ${td("Project ID", "right")}${td(unknownToString(command.getProjectId()), "left")}
            </TR>
            <TR>
              ${td("Source", "right")}${td(unknownToString(command.getSource()), "left")}
            </TR>
        `);
    }
    let result = "pending";
    let color = "khaki";
    if (command.getState() === CommandState.RESOLVED) {
        result = escapeHtmlLabel(unknownToString(await command.compute(), true));
        color = "darkolivegreen3";
    } else if (command.getState() === CommandState.REJECTED) {
        result = escapeHtmlLabel(errorMessage(command.getFailure()));
        color = "salmon";
    }
    if (vertexDataRows) {
        return dedent(`
            <
              <TABLE BORDER="0" CELLSPACING="0" CELLBORDER="1" BGCOLOR="${color}">
                <TR>
                  <TD COLSPAN="2">${command.constructor.name}</TD>
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
              <TD COLSPAN="2">${command.constructor.name}</TD>
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
