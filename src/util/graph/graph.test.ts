import { expect } from "chai";
import { describe, it } from "node:test";
import path from "path";
import { SimpleDirectedEdge, SimpleDirectedGraph } from "./graph.js";

await describe(path.relative(process.cwd(), import.meta.filename), async async () => {
    await describe(SimpleDirectedGraph.name, async async async async async async async async async async () => {
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

        await describe(graph.place.name, async async () => {
            await it("adds vertices", () => {
                graph.place(7);
                expect([...graph.getVertices()]).to.deep.eq([0, 1, 2, 3, 4, 7]);
            });

            await it("detects duplicates", () => {
                graph.place(5);
                expect(() => {
                    graph.place(5);
                }).to.throw("Duplicate vertex detected: 5");
            });
        });

        await describe(graph.connect.name, async async async async async async () => {
            await it("connects to existing vertices", () => {
                graph.place(5);
                graph.connect(0, 5);
                expect([...graph.getOutgoing(0)]).to.deep.eq([
                    new SimpleDirectedEdge(0, 1),
                    new SimpleDirectedEdge(0, 2),
                    new SimpleDirectedEdge(0, 3),
                    new SimpleDirectedEdge(0, 5),
                ]);
            });

            await it("detects unknown source vertices", () => {
                expect(() => {
                    graph.connect(42, 0);
                }).to.throw("Failed to connect vertices: the source vertex does not exist");
            });

            await it("detects unknown destination vertices", () => {
                expect(() => {
                    graph.connect(0, 42);
                }).to.throw("Failed to connect vertices: the destination vertex does not exist");
            });

            await it("detects cycles", () => {
                expect(() => {
                    graph.connect(4, 2);
                }).to.throw("Failed to connect vertices 4 -> 2: cycle detected");
            });

            await it("detects duplicates", () => {
                graph.place(8);
                graph.connect(0, 8);
                expect(() => {
                    graph.connect(0, 8);
                }).to.throw("Failed to connect vertices 0 -> 8: duplicate edge detected");
            });

            await it("detects self loops", () => {
                expect(() => {
                    graph.connect(0, 0);
                }).to.throw("Failed to connect vertices 0 -> 0: cycle detected");
            });
        });

        await describe(graph.find.name, async async () => {
            await it("finds vertices", () => {
                expect(graph.find((vertex: number) => vertex === 3)).to.eq(3);
            });

            await it("does not find nonexistent vertices", () => {
                expect(graph.find((vertex: number) => vertex === 6)).to.be.undefined;
            });
        });

        await describe(graph.getVertices.name, async () => {
            await it("returns all vertices", () => {
                expect([...graph.getVertices()]).to.deep.eq([0, 1, 2, 3, 4]);
            });
        });

        await describe(graph.getEdges.name, async () => {
            await it("returns all edges", () => {
                expect([...graph.getEdges()]).to.deep.eq([
                    new SimpleDirectedEdge(0, 1),
                    new SimpleDirectedEdge(0, 2),
                    new SimpleDirectedEdge(0, 3),
                    new SimpleDirectedEdge(2, 4),
                ]);
            });
        });

        await describe(graph.size.name, async async () => {
            await it("returns the vertex set cardinality", () => {
                expect(graph.size("vertices")).to.eq(5);
            });

            await it("returns the edge set cardinality", () => {
                expect(graph.size("edges")).to.eq(4);
            });
        });

        await describe(graph.getOutgoing.name, async async async () => {
            await it("returns the outgoing edges of a vertex", () => {
                expect([...graph.getOutgoing(0)]).to.deep.eq([
                    new SimpleDirectedEdge(0, 1),
                    new SimpleDirectedEdge(0, 2),
                    new SimpleDirectedEdge(0, 3),
                ]);
            });

            await it("returns empty arrays for leaf nodes", () => {
                expect([...graph.getOutgoing(4)]).to.deep.eq([]);
            });

            await it("throws for nonexistent nodes", () => {
                expect(() => [...graph.getOutgoing(10)]).to.throw("Unknown vertex: 10");
            });
        });

        await describe(graph.getIncoming.name, async async async () => {
            await it("returns the incoming edges of a vertex", () => {
                expect([...graph.getIncoming(3)]).to.deep.eq([new SimpleDirectedEdge(0, 3)]);
            });

            await it("returns empty arrays for root nodes", () => {
                expect([...graph.getIncoming(0)]).to.deep.eq([]);
            });

            await it("throws for nonexistent nodes", () => {
                expect(() => [...graph.getIncoming(10)]).to.throw("Unknown vertex: 10");
            });
        });

        await describe(graph.hasOutgoing.name, async async async () => {
            await it("returns true for vertices with outgoing edges", () => {
                expect(graph.hasOutgoing(0)).to.be.true;
            });

            await it("returns false for vertices without outgoing edges", () => {
                expect(graph.hasOutgoing(4)).to.be.false;
            });

            await it("throws for nonexistent nodes", () => {
                expect(() => graph.hasOutgoing(10)).to.throw("Unknown vertex: 10");
            });
        });

        await describe(graph.hasIncoming.name, async async async () => {
            await it("returns true for vertices with incoming edges", () => {
                expect(graph.hasIncoming(1)).to.be.true;
            });

            await it("returns false for vertices without incoming edges", () => {
                expect(graph.hasIncoming(0)).to.be.false;
            });

            await it("throws for nonexistent nodes", () => {
                expect(() => graph.hasIncoming(10)).to.throw("Unknown vertex: 10");
            });
        });
    });

    await describe("edge", async async () => {
        const edge = new SimpleDirectedEdge("abc", "def");

        await describe(edge.getSource.name, async () => {
            await it("returns the source vertex", () => {
                expect(edge.getSource()).to.eq("abc");
            });
        });

        await describe(edge.getDestination.name, async () => {
            await it("returns the destination vertex", () => {
                expect(edge.getDestination()).to.eq("def");
            });
        });
    });
});
