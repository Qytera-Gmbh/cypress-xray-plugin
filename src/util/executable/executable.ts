import { Executable } from "../../types/executable";
import { computeTopologicalOrder } from "../graph/algorithms/sort";
import { SimpleDirectedGraph } from "../graph/graph";
import { unknownToString } from "../string";

/**
 * Models a graph which can be executed in a top-down fashion, i.e. starting at vertices without
 * incoming edges and progressing towards leaf vertices without outgoing edges.
 */
export class ExecutableGraph<V extends Executable>
    extends SimpleDirectedGraph<V>
    implements Executable
{
    public async execute(): Promise<void> {
        // Post-order is achieved using the vertices' distances from leaves (topological sort).
        const distances: Map<V, number> = computeTopologicalOrder(this);
        const vertices = [...distances.keys()];
        vertices.sort((a: V, b: V) => {
            const d1 = distances.get(a);
            if (d1 === undefined) {
                throw new Error(`Encountered vertex with unknown distance: ${unknownToString(a)}`);
            }
            const d2 = distances.get(b);
            if (d2 === undefined) {
                throw new Error(`Encountered vertex with unknown distance: ${unknownToString(b)}`);
            }
            if (d1 < d2) {
                return -1;
            } else if (d1 > d2) {
                return 1;
            }
            return 0;
        });
        await Promise.all(vertices.map((vertex) => vertex.execute()));
    }
}
