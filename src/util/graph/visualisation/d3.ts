import { unknownToString } from "../../string";
import { DirectedEdge, DirectedGraph } from "../graph";

interface D3Vertex {
    id: string;
    name: string;
    parameters: string;
    result: string;
    state: string;
}

interface D3Edge {
    src: string;
    dst: string;
    style: "normal" | "dotted";
}

interface D3Json {
    vertices: D3Vertex[];
    edges: D3Edge[];
}

export async function graphToD3Json<V, E extends DirectedEdge<V>>(
    graph: DirectedGraph<V, E>,
    getName: (vertex: V) => string | Promise<string>,
    getParameters: (vertex: V) => string | Promise<string>,
    getResults: (vertex: V) => string | Promise<string>,
    getState: (vertex: V) => string | Promise<string>,
    getEdgeStyle: (edge: DirectedEdge<V>) => "normal" | "dotted"
): Promise<D3Json> {
    const json: D3Json = {
        vertices: [],
        edges: [],
    };
    const ids = new Map<V, string>();
    const cssClasses = new Map<string, Set<V>>();
    const cssClassIds = new Map<string, string>();
    for (const vertex of graph.getVertices()) {
        const vertexId = `v${ids.size}`;
        ids.set(vertex, vertexId);
        const vertexState = await getState(vertex);
        const vertices = cssClasses.get(vertexState);
        if (vertices) {
            vertices.add(vertex);
        } else {
            const classId = `c${cssClassIds.size}`;
            cssClasses.set(vertexState, new Set([vertex]));
            cssClassIds.set(vertexState, classId);
        }
        json.vertices.push({
            id: vertexId,
            name: await getName(vertex),
            parameters: await getParameters(vertex),
            result: await getResults(vertex),
            state: vertexState,
        });
    }
    for (const edge of graph.getEdges()) {
        const src = ids.get(edge.getSource());
        if (!src) {
            throw new Error(`Vertex ID unknown: ${unknownToString(edge.getSource())}`);
        }
        const dst = ids.get(edge.getDestination());
        if (!dst) {
            throw new Error(`Vertex ID unknown: ${unknownToString(edge.getDestination())}`);
        }
        json.edges.push({ src: src, dst: dst, style: getEdgeStyle(edge) });
    }
    return json;
}
