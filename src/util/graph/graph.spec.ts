import { expect } from "chai";
import path from "path";
import { SimpleDirectedEdge, SimpleDirectedGraph } from "./graph";

describe(path.relative(process.cwd(), __filename), () => {
    describe(SimpleDirectedGraph.name, () => {
        let graph: SimpleDirectedGraph<number> = new SimpleDirectedGraph<number>();

        beforeEach(() => {
            graph = new SimpleDirectedGraph<number>();
            graph.connect(0, 1);
            graph.connect(0, 2);
            graph.connect(0, 3);
            graph.connect(2, 4);
        });

        describe(graph.place.name, () => {
            it("adds vertices", () => {
                graph.place(7);
                expect([...graph.getVertices()]).to.deep.eq([0, 1, 2, 3, 4, 7]);
            });

            it("detects duplicates", () => {
                graph.place(5);
                expect(() => {
                    graph.place(5);
                }).to.throw("Duplicate vertex detected: 5");
            });
        });

        describe(graph.connect.name, () => {
            it("adds new edges", () => {
                graph.connect(5, 6);
                expect([...graph.getOutgoing(5)]).to.deep.eq([new SimpleDirectedEdge(5, 6)]);
            });

            it("connects to existing vertices", () => {
                graph.connect(0, 5);
                expect([...graph.getOutgoing(0)]).to.deep.eq([
                    new SimpleDirectedEdge(0, 1),
                    new SimpleDirectedEdge(0, 2),
                    new SimpleDirectedEdge(0, 3),
                    new SimpleDirectedEdge(0, 5),
                ]);
            });

            it("detects cycles", () => {
                expect(() => {
                    graph.connect(4, 2);
                }).to.throw("Failed to connect vertices 4 -> 2: cycle detected");
            });

            it("detects duplicates", () => {
                graph.connect(0, 8);
                expect(() => {
                    graph.connect(0, 8);
                }).to.throw("Failed to connect vertices 0 -> 8: duplicate edge detected");
            });
        });

        describe(graph.find.name, () => {
            it("finds vertices", () => {
                expect(graph.find((vertex: number) => vertex === 3)).to.eq(3);
            });

            it("does not find nonexistent vertices", () => {
                expect(graph.find((vertex: number) => vertex === 6)).to.be.null;
            });
        });

        describe(graph.getVertices.name, () => {
            it("returns all vertices", () => {
                expect([...graph.getVertices()]).to.deep.eq([0, 1, 2, 3, 4]);
            });
        });

        describe(graph.getEdges.name, () => {
            it("returns all edges", () => {
                expect([...graph.getEdges()]).to.deep.eq([
                    new SimpleDirectedEdge(0, 1),
                    new SimpleDirectedEdge(0, 2),
                    new SimpleDirectedEdge(0, 3),
                    new SimpleDirectedEdge(2, 4),
                ]);
            });
        });

        describe(graph.size.name, () => {
            it("returns the vertex set cardinality", () => {
                expect(graph.size("vertices")).to.eq(5);
            });

            it("returns the edge set cardinality", () => {
                expect(graph.size("edges")).to.eq(4);
            });
        });

        describe(graph.getOutgoing.name, () => {
            it("returns the outgoing edges of a vertex", () => {
                expect([...graph.getOutgoing(0)]).to.deep.eq([
                    new SimpleDirectedEdge(0, 1),
                    new SimpleDirectedEdge(0, 2),
                    new SimpleDirectedEdge(0, 3),
                ]);
            });

            it("returns empty arrays for leaf nodes", () => {
                expect([...graph.getOutgoing(4)]).to.deep.eq([]);
            });

            it("throws for nonexistent nodes", () => {
                expect(() => [...graph.getOutgoing(10)]).to.throw("Unknown vertex: 10");
            });
        });

        describe(graph.getIncoming.name, () => {
            it("returns the incoming edges of a vertex", () => {
                expect([...graph.getIncoming(3)]).to.deep.eq([new SimpleDirectedEdge(0, 3)]);
            });

            it("returns empty arrays for root nodes", () => {
                expect([...graph.getIncoming(0)]).to.deep.eq([]);
            });

            it("throws for nonexistent nodes", () => {
                expect(() => [...graph.getIncoming(10)]).to.throw("Unknown vertex: 10");
            });
        });

        describe(graph.hasOutgoing.name, () => {
            it("returns true for vertices with outgoing edges", () => {
                expect(graph.hasOutgoing(0)).to.be.true;
            });

            it("returns false for vertices without outgoing edges", () => {
                expect(graph.hasOutgoing(4)).to.be.false;
            });

            it("throws for nonexistent nodes", () => {
                expect(() => graph.hasOutgoing(10)).to.throw("Unknown vertex: 10");
            });
        });

        describe(graph.hasIncoming.name, () => {
            it("returns true for vertices with incoming edges", () => {
                expect(graph.hasIncoming(1)).to.be.true;
            });

            it("returns false for vertices without incoming edges", () => {
                expect(graph.hasIncoming(0)).to.be.false;
            });

            it("throws for nonexistent nodes", () => {
                expect(() => graph.hasIncoming(10)).to.throw("Unknown vertex: 10");
            });
        });
    });

    describe("edge", () => {
        const edge: SimpleDirectedEdge<string> = new SimpleDirectedEdge<string>("abc", "def");

        describe(edge.getSource.name, () => {
            it("returns the source vertex", () => {
                expect(edge.getSource()).to.eq("abc");
            });
        });

        describe(edge.getDestination.name, () => {
            it("returns the destination vertex", () => {
                expect(edge.getDestination()).to.eq("def");
            });
        });
    });
});
