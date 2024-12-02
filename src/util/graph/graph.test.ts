import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import { SimpleDirectedEdge, SimpleDirectedGraph } from "./graph";

describe(relative(cwd(), __filename), async () => {
    await describe(SimpleDirectedGraph.name, async () => {
        let graph: SimpleDirectedGraph<number> = new SimpleDirectedGraph<number>();

        beforeEach(() => {
            graph = new SimpleDirectedGraph<number>();
            graph.place(0);
            graph.place(1);
            graph.place(2);
            graph.place(3);
            graph.place(4);
            graph.connect(0, 1);
            graph.connect(0, 2);
            graph.connect(0, 3);
            graph.connect(2, 4);
        });

        await describe(graph.place.name, async () => {
            await it("adds vertices", () => {
                graph.place(7);
                assert.deepStrictEqual([...graph.getVertices()], [0, 1, 2, 3, 4, 7]);
            });

            await it("detects duplicates", () => {
                graph.place(5);
                assert.throws(
                    () => {
                        graph.place(5);
                    },
                    { message: "Duplicate vertex detected: 5" }
                );
            });
        });

        await describe(graph.connect.name, async () => {
            await it("connects to existing vertices", () => {
                graph.place(5);
                graph.connect(0, 5);
                assert.deepStrictEqual(
                    [...graph.getOutgoing(0)],
                    [
                        new SimpleDirectedEdge(0, 1),
                        new SimpleDirectedEdge(0, 2),
                        new SimpleDirectedEdge(0, 3),
                        new SimpleDirectedEdge(0, 5),
                    ]
                );
            });

            await it("detects unknown source vertices", () => {
                assert.throws(
                    () => {
                        graph.connect(42, 0);
                    },
                    { message: "Failed to connect vertices: the source vertex does not exist" }
                );
            });

            await it("detects unknown destination vertices", () => {
                assert.throws(
                    () => {
                        graph.connect(0, 42);
                    },
                    { message: "Failed to connect vertices: the destination vertex does not exist" }
                );
            });

            await it("detects cycles", () => {
                assert.throws(
                    () => {
                        graph.connect(4, 2);
                    },
                    { message: "Failed to connect vertices 4 -> 2: cycle detected" }
                );
            });

            await it("detects duplicates", () => {
                graph.place(8);
                graph.connect(0, 8);
                assert.throws(
                    () => {
                        graph.connect(0, 8);
                    },
                    { message: "Failed to connect vertices 0 -> 8: duplicate edge detected" }
                );
            });

            await it("detects self loops", () => {
                assert.throws(
                    () => {
                        graph.connect(0, 0);
                    },
                    { message: "Failed to connect vertices 0 -> 0: cycle detected" }
                );
            });
        });

        await describe(graph.find.name, async () => {
            await it("finds vertices", () => {
                assert.strictEqual(
                    graph.find((vertex: number) => vertex === 3),
                    3
                );
            });

            await it("does not find nonexistent vertices", () => {
                assert.strictEqual(
                    graph.find((vertex: number) => vertex === 6),
                    undefined
                );
            });
        });

        await describe(graph.getVertices.name, async () => {
            await it("returns all vertices", () => {
                assert.deepStrictEqual([...graph.getVertices()], [0, 1, 2, 3, 4]);
            });
        });

        await describe(graph.getEdges.name, async () => {
            await it("returns all edges", () => {
                assert.deepStrictEqual(
                    [...graph.getEdges()],
                    [
                        new SimpleDirectedEdge(0, 1),
                        new SimpleDirectedEdge(0, 2),
                        new SimpleDirectedEdge(0, 3),
                        new SimpleDirectedEdge(2, 4),
                    ]
                );
            });
        });

        await describe(graph.size.name, async () => {
            await it("returns the vertex set cardinality", () => {
                assert.strictEqual(graph.size("vertices"), 5);
            });

            await it("returns the edge set cardinality", () => {
                assert.strictEqual(graph.size("edges"), 4);
            });
        });

        await describe(graph.getOutgoing.name, async () => {
            await it("returns the outgoing edges of a vertex", () => {
                assert.deepStrictEqual(
                    [...graph.getOutgoing(0)],
                    [
                        new SimpleDirectedEdge(0, 1),
                        new SimpleDirectedEdge(0, 2),
                        new SimpleDirectedEdge(0, 3),
                    ]
                );
            });

            await it("returns empty arrays for leaf nodes", () => {
                assert.deepStrictEqual([...graph.getOutgoing(4)], []);
            });

            await it("throws for nonexistent nodes", () => {
                assert.throws(() => [...graph.getOutgoing(10)], { message: "Unknown vertex: 10" });
            });
        });

        await describe(graph.getIncoming.name, async () => {
            await it("returns the incoming edges of a vertex", () => {
                assert.deepStrictEqual([...graph.getIncoming(3)], [new SimpleDirectedEdge(0, 3)]);
            });

            await it("returns empty arrays for root nodes", () => {
                assert.deepStrictEqual([...graph.getIncoming(0)], []);
            });

            await it("throws for nonexistent nodes", () => {
                assert.throws(() => [...graph.getIncoming(10)], { message: "Unknown vertex: 10" });
            });
        });

        await describe(graph.hasOutgoing.name, async () => {
            await it("returns true for vertices with outgoing edges", () => {
                assert.strictEqual(graph.hasOutgoing(0), true);
            });

            await it("returns false for vertices without outgoing edges", () => {
                assert.strictEqual(graph.hasOutgoing(4), false);
            });

            await it("throws for nonexistent nodes", () => {
                assert.throws(() => graph.hasOutgoing(10), { message: "Unknown vertex: 10" });
            });
        });

        await describe(graph.hasIncoming.name, async () => {
            await it("returns true for vertices with incoming edges", () => {
                assert.strictEqual(graph.hasIncoming(1), true);
            });

            await it("returns false for vertices without incoming edges", () => {
                assert.strictEqual(graph.hasIncoming(0), false);
            });

            await it("throws for nonexistent nodes", () => {
                assert.throws(() => graph.hasIncoming(10), { message: "Unknown vertex: 10" });
            });
        });
    });

    await describe("edge", async () => {
        const edge = new SimpleDirectedEdge("abc", "def");

        await describe(edge.getSource.name, async () => {
            await it("returns the source vertex", () => {
                assert.strictEqual(edge.getSource(), "abc");
            });
        });

        await describe(edge.getDestination.name, async () => {
            await it("returns the destination vertex", () => {
                assert.strictEqual(edge.getDestination(), "def");
            });
        });
    });
});
