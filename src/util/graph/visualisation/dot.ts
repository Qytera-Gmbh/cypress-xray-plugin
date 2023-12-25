import { ConstantCommand } from "../../../commands/constantCommand";
import { ExtractFeatureFileTagsCommand } from "../../../commands/cucumber/extractFeatureFileIssuesCommand";
import { ParseFeatureFileCommand } from "../../../commands/cucumber/parseFeatureFileCommand";
import { ExtractFieldIdCommand } from "../../../commands/jira/fields/extractFieldIdCommand";
import { GetFieldValuesCommand } from "../../../commands/jira/fields/getFieldValuesCommand";
import { ReduceCommand } from "../../../commands/reduceCommand";
import { ImportFeatureCommand } from "../../../commands/xray/importFeatureCommand";
import { Command, CommandState } from "../../command/command";
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
        vertexDataRows = dedent(`
            <TR>
              <TD ALIGN="RIGHT" VALIGN="TOP">Project key</TD><TD ALIGN="LEFT">${command.getProjectKey()}</TD>
            </TR>
            <TR>
              <TD ALIGN="RIGHT" VALIGN="TOP">Prefixes</TD><TD ALIGN="LEFT">${JSON.stringify(
                  command.getPrefixes()
              )}</TD>
            </TR>
        `);
    } else if (command instanceof ParseFeatureFileCommand) {
        vertexDataRows = dedent(`
            <TR>
              <TD ALIGN="RIGHT" VALIGN="TOP">File path</TD><TD ALIGN="LEFT">${command.getFilePath()}</TD>
            </TR>
        `);
    } else if (command instanceof ExtractFieldIdCommand) {
        vertexDataRows = dedent(`
            <TR>
              <TD ALIGN="RIGHT" VALIGN="TOP">Field</TD><TD ALIGN="LEFT">${command.getField()}</TD>
            </TR>
        `);
    } else if (command instanceof GetFieldValuesCommand) {
        vertexDataRows = dedent(`
            <TR>
              <TD ALIGN="RIGHT" VALIGN="TOP">Field</TD><TD ALIGN="LEFT">${command.getField()}</TD>
            </TR>
        `);
    } else if (command instanceof ImportFeatureCommand) {
        vertexDataRows = dedent(`
            <TR>
              <TD ALIGN="RIGHT" VALIGN="TOP">File path</TD><TD ALIGN="LEFT">${command.getFilePath()}</TD>
            </TR>
            <TR>
              <TD ALIGN="RIGHT" VALIGN="TOP">Project key</TD><TD ALIGN="LEFT">${command.getProjectKey()}</TD>
            </TR>
            <TR>
              <TD ALIGN="RIGHT" VALIGN="TOP">Project ID</TD><TD ALIGN="LEFT">${command.getProjectId()}</TD>
            </TR>
            <TR>
              <TD ALIGN="RIGHT" VALIGN="TOP">Source</TD><TD ALIGN="LEFT">${command.getSource()}</TD>
            </TR>
        `);
    } else if (command instanceof ConstantCommand) {
        vertexDataRows = dedent(`
            <TR>
              <TD ALIGN="RIGHT" VALIGN="TOP">Value</TD><TD ALIGN="LEFT">${command.getValue()}</TD>
            </TR>
        `);
    } else if (command instanceof ReduceCommand) {
        vertexDataRows = dedent(`
            <TR>
              <TD ALIGN="RIGHT" VALIGN="TOP">Initial value</TD><TD ALIGN="LEFT">${command.getInitialValue()}</TD>
            </TR>
        `);
    }
    let result = "pending";
    let color = "khaki";
    if (command.getState() === CommandState.RESOLVED) {
        result = unknownToString(await command.getResult(), true)
            .concat("\n")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll(" ", "&nbsp;")
            .replaceAll("[", "&#91;")
            .replaceAll("]", "&#93;")
            .replaceAll("\n", '<BR ALIGN="LEFT"/>');
        color = "darkolivegreen3";
    } else if (command.getState() === CommandState.REJECTED) {
        result = errorMessage(command.getFailure());
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
                  <TD ALIGN="RIGHT" VALIGN="TOP">Result</TD><TD ALIGN="LEFT">${result}</TD>
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
              <TD ALIGN="RIGHT" VALIGN="TOP">Result</TD><TD ALIGN="LEFT">${result}</TD>
            </TR>
          </TABLE>
        >
    `);
}
