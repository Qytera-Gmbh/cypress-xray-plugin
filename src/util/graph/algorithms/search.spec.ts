import { expect } from "chai";
import { SimpleDirectedGraph } from "../graph";
import { bfs, dfs } from "./search";

class Vertex {
    private readonly vertexId: number;

    constructor(id: number) {
        this.vertexId = id;
    }

    public id(): number {
        return this.vertexId;
    }
}

describe("search", () => {
    const graph = new SimpleDirectedGraph<Vertex>();
    const v0 = new Vertex(0);
    const v1 = new Vertex(1);
    const v2 = new Vertex(2);
    const v3 = new Vertex(3);
    const v4 = new Vertex(4);
    const v5 = new Vertex(5);
    const v6 = new Vertex(6);
    const v7 = new Vertex(7);
    const v8 = new Vertex(8);
    const v9 = new Vertex(9);
    graph.connect(v1, v2);
    graph.connect(v1, v5);
    graph.connect(v1, v7);
    graph.connect(v2, v5);
    graph.connect(v3, v8);
    graph.connect(v4, v5);
    graph.connect(v4, v8);
    graph.connect(v5, v6);
    graph.connect(v8, v0);
    graph.connect(v8, v6);
    graph.connect(v8, v7);
    graph.connect(v6, v9);
    graph.connect(v9, v7);

    describe(bfs.name, () => {
        it("finds vertices by reference", () => {
            expect(
                bfs(graph, {
                    source: v1,
                    destination: v9,
                })
            ).to.be.true;
        });

        it("does not find nonexistent vertices by reference", () => {
            expect(
                bfs(graph, {
                    source: v1,
                    destination: new Vertex(17),
                })
            ).to.be.false;
        });

        it("does not find unreachable vertices by reference", () => {
            expect(
                bfs(graph, {
                    source: v1,
                    destination: v0,
                })
            ).to.be.false;
        });

        it("finds vertices by filtering", () => {
            expect(
                bfs(graph, {
                    source: v1,
                    filter: (vertex: Vertex) => vertex.id() === 6,
                })
            ).to.be.true;
        });

        it("does not find nonexistent vertices by filtering", () => {
            expect(
                bfs(graph, {
                    source: v1,
                    filter: (vertex: Vertex) => vertex.id() === 17,
                })
            ).to.be.false;
        });

        it("does not find unreachable vertices by filtering", () => {
            expect(
                bfs(graph, {
                    source: v1,
                    filter: (vertex: Vertex) => vertex.id() === 0,
                })
            ).to.be.false;
        });

        it("finds vertices anywhere by reference", () => {
            expect(
                dfs(graph, {
                    destination: v0,
                })
            ).to.be.true;
        });

        it("finds vertices anywhere by filtering", () => {
            expect(
                dfs(graph, {
                    filter: (vertex: Vertex) => vertex.id() === 0,
                })
            ).to.be.true;
        });

        it("finds the starting vertex by reference", () => {
            expect(
                dfs(graph, {
                    source: v0,
                    destination: v0,
                })
            ).to.be.true;
        });

        it("finds the starting vertex by filtering", () => {
            expect(
                dfs(graph, {
                    source: v0,
                    filter: (vertex: Vertex) => vertex.id() === 0,
                })
            ).to.be.true;
        });
    });

    describe(dfs.name, () => {
        it("finds vertices by reference", () => {
            expect(
                dfs(graph, {
                    source: v1,
                    destination: v9,
                })
            ).to.be.true;
        });

        it("does not find nonexistent vertices by reference", () => {
            expect(
                dfs(graph, {
                    source: v1,
                    destination: new Vertex(17),
                })
            ).to.be.false;
        });

        it("does not find unreachable vertices by reference", () => {
            expect(
                dfs(graph, {
                    source: v1,
                    destination: v0,
                })
            ).to.be.false;
        });

        it("finds vertices by filtering", () => {
            expect(
                dfs(graph, {
                    source: v1,
                    filter: (vertex: Vertex) => vertex.id() === 6,
                })
            ).to.be.true;
        });

        it("does not find nonexistent vertices by filtering", () => {
            expect(
                dfs(graph, {
                    source: v1,
                    filter: (vertex: Vertex) => vertex.id() === 17,
                })
            ).to.be.false;
        });

        it("does not find unreachable vertices by filtering", () => {
            expect(
                dfs(graph, {
                    source: v1,
                    filter: (vertex: Vertex) => vertex.id() === 0,
                })
            ).to.be.false;
        });

        it("finds vertices anywhere by reference", () => {
            expect(
                dfs(graph, {
                    destination: v0,
                })
            ).to.be.true;
        });

        it("finds vertices anywhere by filtering", () => {
            expect(
                dfs(graph, {
                    filter: (vertex: Vertex) => vertex.id() === 0,
                })
            ).to.be.true;
        });

        it("finds the starting vertex by reference", () => {
            expect(
                dfs(graph, {
                    source: v0,
                    destination: v0,
                })
            ).to.be.true;
        });

        it("finds the starting vertex by filtering", () => {
            expect(
                dfs(graph, {
                    source: v0,
                    filter: (vertex: Vertex) => vertex.id() === 0,
                })
            ).to.be.true;
        });
    });
});
