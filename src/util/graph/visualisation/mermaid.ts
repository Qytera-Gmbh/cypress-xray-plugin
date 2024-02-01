import { unknownToString } from "../../string";
import { DirectedEdge, DirectedGraph } from "../graph";

interface MermaidVertex {
    id: string;
    name: string;
    parameters: string;
    result: string;
    showContent: false;
    classDef?: string;
}

interface MermaidEdge {
    src: string;
    dst: string;
    style: "normal" | "dotted" | "thick";
}

interface MermaidJson {
    vertices: MermaidVertex[];
    edges: MermaidEdge[];
    classDefs: Record<string, string>;
}

export async function graphToMermaidJson<V, E extends DirectedEdge<V>>(
    graph: DirectedGraph<V, E>,
    getName: (vertex: V) => string | Promise<string>,
    getParameters: (vertex: V) => string | Promise<string>,
    getResults: (vertex: V) => string | Promise<string>,
    getClass: (vertex: V) => string | Promise<string>,
    getEdgeStyle: (edge: DirectedEdge<V>) => "normal" | "dotted" | "thick"
): Promise<MermaidJson> {
    const json: MermaidJson = {
        vertices: [],
        edges: [],
        classDefs: {},
    };
    const ids = new Map<V, string>();
    const cssClasses = new Map<string, Set<V>>();
    const cssClassIds = new Map<string, string>();
    for (const vertex of graph.getVertices()) {
        const vertexId = `v${ids.size}`;
        ids.set(vertex, vertexId);
        const vertexClass = await getClass(vertex);
        const vertices = cssClasses.get(vertexClass);
        if (vertices) {
            vertices.add(vertex);
        } else {
            const classId = `c${cssClassIds.size}`;
            cssClasses.set(vertexClass, new Set([vertex]));
            cssClassIds.set(vertexClass, classId);
            json.classDefs[classId] = vertexClass;
        }
        json.vertices.push({
            id: vertexId,
            name: await getName(vertex),
            parameters: await getParameters(vertex),
            result: await getResults(vertex),
            showContent: false,
            classDef: cssClassIds.get(vertexClass),
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
