import { Command, ComputableState } from "../../../hooks/command";
import { dedent } from "../../dedent";
import { errorMessage } from "../../errors";
import { unknownToString } from "../../string";
import { DirectedEdge, DirectedGraph } from "../graph";

export async function graphToMermaid<V, E extends DirectedEdge<V>>(
    graph: DirectedGraph<V, E>,
    labeller: (vertex: V) => string | Promise<string>,
    getVertexClass: (vertex: V) => string | Promise<string>,
    edgeStyle: (edge: DirectedEdge<V>) => "normal" | "dotted" | "thick"
): Promise<string> {
    let i = 0;
    const ids = new Map<V, string>();
    const vertexLabels = new Map<V, string>();
    for (const vertex of graph.getVertices()) {
        const id = `v${i++}`;
        ids.set(vertex, id);
        vertexLabels.set(vertex, await labeller(vertex));
    }
    const cssClasses = new Map<string, Set<V>>();
    const cssClassIds = new Map<string, string>();
    for (const vertex of graph.getVertices()) {
        const vertexClass = await getVertexClass(vertex);
        const vertices = cssClasses.get(vertexClass);
        if (vertices) {
            vertices.add(vertex);
        } else {
            const id = cssClassIds.size;
            cssClasses.set(vertexClass, new Set([vertex]));
            cssClassIds.set(vertexClass, `c${id}`);
        }
    }
    return dedent(`
        %%{ init: { 'flowchart': { 'curve': 'monotoneY' } } }%%
        flowchart TD
          ${[...cssClasses.keys()]
              .map((cssClass) => `classDef ${cssClassIds.get(cssClass)} ${cssClass};`)
              .join("\n")}
          ${[...graph.getVertices()]
              .map((vertex) => `${ids.get(vertex)}[${vertexLabels.get(vertex)}];`)
              .join("\n")}
          ${[...graph.getEdges()]
              .map((edge): string => {
                  const src = ids.get(edge.getSource());
                  const dst = ids.get(edge.getDestination());
                  switch (edgeStyle(edge)) {
                      case "normal":
                          return `${src} ---> ${dst};`;
                      case "dotted":
                          return `${src} -.-> ${dst};`;
                      case "thick":
                          return `${src} ===> ${dst};`;
                  }
              })
              .join("\n")}
          ${[...cssClasses.entries()]
              .map(
                  ([css, vertices]) =>
                      `class ${[...vertices]
                          .map((vertex) => ids.get(vertex))
                          .join(",")} ${cssClassIds.get(css)};`
              )
              .join("\n")}
    `);
}

export async function commandToMermaid<R>(command: Command<R>): Promise<string> {
    const parameters = command.getParameters()
        ? escapeHtmlLabel(unknownToString(command.getParameters(), true))
        : undefined;
    let result = "pending";
    if (command.getState() === ComputableState.SUCCEEDED) {
        result = escapeHtmlLabel(unknownToString(await command.compute(), true));
    } else if (command.getState() === ComputableState.SKIPPED) {
        if (command.getFailureOrSkipReason()) {
            result = escapeHtmlLabel(errorMessage(command.getFailureOrSkipReason()));
        } else {
            result = "skipped";
        }
    } else if (command.getState() === ComputableState.FAILED) {
        if (command.getFailureOrSkipReason()) {
            result = escapeHtmlLabel(errorMessage(command.getFailureOrSkipReason()));
        } else {
            result = "failed";
        }
    }
    if (parameters) {
        return dedent(`
            "
              <b>${command.constructor.name}</b>
              <hr/>
              Parameters
              <hr/>
              ${parameters}
              <hr/>
              Result
              ${result}
            "
        `);
    }
    return dedent(`
        "
          ${command.constructor.name}
          <hr/>
          Result
          ${result}
        "
    `);
}

function escapeHtmlLabel(value: string): string {
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
        .replaceAll('"', "&quot;")
        .replaceAll(" ", "&nbsp;")
        .replaceAll("\n", "<br/>");
}
