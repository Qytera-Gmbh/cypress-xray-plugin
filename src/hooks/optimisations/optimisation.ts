import { DirectedEdge, DirectedGraph } from "../../util/graph/graph";

export abstract class Optimiser<V, E extends DirectedEdge<V>, G extends DirectedGraph<V, E>> {
    protected readonly graph: G;

    constructor(graph: G) {
        this.graph = graph;
    }

    public abstract optimise(): Promise<void> | void;
}
