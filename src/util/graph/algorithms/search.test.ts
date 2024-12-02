import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
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

describe(relative(cwd(), __filename), async () => {
    const graph = new SimpleDirectedGraph<Vertex>();
    const v0 = graph.place(new Vertex(0));
    const v1 = graph.place(new Vertex(1));
    const v2 = graph.place(new Vertex(2));
    const v3 = graph.place(new Vertex(3));
    const v4 = graph.place(new Vertex(4));
    const v5 = graph.place(new Vertex(5));
    const v6 = graph.place(new Vertex(6));
    const v7 = graph.place(new Vertex(7));
    const v8 = graph.place(new Vertex(8));
    const v9 = graph.place(new Vertex(9));
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

    await describe(bfs.name, async () => {
        await it("finds vertices by reference", () => {
            assert.strictEqual(
                bfs(graph, {
                    destination: v9,
                    source: v1,
                }),
                true
            );
        });

        await it("does not find nonexistent vertices by reference", () => {
            assert.strictEqual(
                bfs(graph, {
                    destination: new Vertex(17),
                    source: v1,
                }),
                false
            );
        });

        await it("does not find unreachable vertices by reference", () => {
            assert.strictEqual(
                bfs(graph, {
                    destination: v0,
                    source: v1,
                }),
                false
            );
        });

        await it("finds vertices by filtering", () => {
            assert.strictEqual(
                bfs(graph, {
                    filter: (vertex: Vertex) => vertex.id() === 6,
                    source: v1,
                }),
                true
            );
        });

        await it("does not find nonexistent vertices by filtering", () => {
            assert.strictEqual(
                bfs(graph, {
                    filter: (vertex: Vertex) => vertex.id() === 17,
                    source: v1,
                }),
                false
            );
        });

        await it("does not find unreachable vertices by filtering", () => {
            assert.strictEqual(
                bfs(graph, {
                    filter: (vertex: Vertex) => vertex.id() === 0,
                    source: v1,
                }),
                false
            );
        });

        await it("finds vertices anywhere by reference", () => {
            assert.strictEqual(
                dfs(graph, {
                    destination: v0,
                }),
                true
            );
        });

        await it("finds vertices anywhere by filtering", () => {
            assert.strictEqual(
                dfs(graph, {
                    filter: (vertex: Vertex) => vertex.id() === 0,
                }),
                true
            );
        });

        await it("finds the starting vertex by reference", () => {
            assert.strictEqual(
                dfs(graph, {
                    destination: v0,
                    source: v0,
                }),
                true
            );
        });

        await it("finds the starting vertex by filtering", () => {
            assert.strictEqual(
                dfs(graph, {
                    filter: (vertex: Vertex) => vertex.id() === 0,
                    source: v0,
                }),
                true
            );
        });
    });

    await describe(dfs.name, async () => {
        await it("finds vertices by reference", () => {
            assert.strictEqual(
                dfs(graph, {
                    destination: v9,
                    source: v1,
                }),
                true
            );
        });

        await it("does not find nonexistent vertices by reference", () => {
            assert.strictEqual(
                dfs(graph, {
                    destination: new Vertex(17),
                    source: v1,
                }),
                false
            );
        });

        await it("does not find unreachable vertices by reference", () => {
            assert.strictEqual(
                dfs(graph, {
                    destination: v0,
                    source: v1,
                }),
                false
            );
        });

        await it("finds vertices by filtering", () => {
            assert.strictEqual(
                dfs(graph, {
                    filter: (vertex: Vertex) => vertex.id() === 6,
                    source: v1,
                }),
                true
            );
        });

        await it("does not find nonexistent vertices by filtering", () => {
            assert.strictEqual(
                dfs(graph, {
                    filter: (vertex: Vertex) => vertex.id() === 17,
                    source: v1,
                }),
                false
            );
        });

        await it("does not find unreachable vertices by filtering", () => {
            assert.strictEqual(
                dfs(graph, {
                    filter: (vertex: Vertex) => vertex.id() === 0,
                    source: v1,
                }),
                false
            );
        });

        await it("finds vertices anywhere by reference", () => {
            assert.strictEqual(
                dfs(graph, {
                    destination: v0,
                }),
                true
            );
        });

        await it("finds vertices anywhere by filtering", () => {
            assert.strictEqual(
                dfs(graph, {
                    filter: (vertex: Vertex) => vertex.id() === 0,
                }),
                true
            );
        });

        await it("finds the starting vertex by reference", () => {
            assert.strictEqual(
                dfs(graph, {
                    destination: v0,
                    source: v0,
                }),
                true
            );
        });

        await it("finds the starting vertex by filtering", () => {
            assert.strictEqual(
                dfs(graph, {
                    filter: (vertex: Vertex) => vertex.id() === 0,
                    source: v0,
                }),
                true
            );
        });
    });
});
