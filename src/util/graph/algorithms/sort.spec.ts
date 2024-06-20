import { expect } from "chai";
import path from "node:path";
import { SimpleDirectedGraph } from "../graph";
import { computeTopologicalOrder, traverse } from "./sort";

describe(path.relative(process.cwd(), __filename), () => {
    describe(computeTopologicalOrder.name, () => {
        it("computes the order for directed graphs", () => {
            const graph = new SimpleDirectedGraph<number>();
            graph.place(0);
            graph.place(1);
            graph.place(2);
            graph.place(3);
            graph.place(4);
            graph.place(5);
            graph.place(6);
            graph.place(7);
            graph.place(8);
            graph.place(9);
            graph.connect(1, 2);
            graph.connect(1, 5);
            graph.connect(1, 7);
            graph.connect(2, 5);
            graph.connect(3, 8);
            graph.connect(4, 5);
            graph.connect(4, 8);
            graph.connect(5, 6);
            graph.connect(8, 0);
            graph.connect(8, 6);
            graph.connect(8, 7);
            graph.connect(6, 9);
            graph.connect(9, 7);
            expect(computeTopologicalOrder(graph)).to.deep.eq(
                new Map([
                    [0, 2],
                    [1, 0],
                    [2, 1],
                    [3, 0],
                    [4, 0],
                    [5, 2],
                    [6, 3],
                    [7, 5],
                    [8, 1],
                    [9, 4],
                ])
            );
        });
    });

    describe(traverse.name, () => {
        it("traverses forests top-down", () => {
            const graph = new SimpleDirectedGraph<string>();
            graph.place("A");
            graph.place("B");
            graph.place("C");
            graph.place("D");
            graph.place("E");
            graph.place("F");
            graph.place("P");
            graph.place("Q");
            graph.place("X");
            graph.place("Y");
            graph.place("Z");
            graph.connect("A", "B");
            graph.connect("A", "D");
            graph.connect("B", "C");
            graph.connect("D", "E");
            graph.connect("D", "F");

            graph.connect("P", "Q");

            graph.connect("X", "Y");
            graph.connect("X", "Z");
            expect([...traverse(graph, "top-down")]).to.deep.eq([
                "A",
                "P",
                "X",
                "B",
                "D",
                "Q",
                "Y",
                "Z",
                "C",
                "E",
                "F",
            ]);
        });

        it("traverses forests bottom-up", () => {
            const graph = new SimpleDirectedGraph<string>();
            graph.place("A");
            graph.place("B");
            graph.place("C");
            graph.place("D");
            graph.place("E");
            graph.place("F");
            graph.place("P");
            graph.place("Q");
            graph.place("X");
            graph.place("Y");
            graph.place("Z");
            graph.connect("A", "B");
            graph.connect("A", "D");
            graph.connect("B", "C");
            graph.connect("D", "E");
            graph.connect("D", "F");

            graph.connect("P", "Q");

            graph.connect("X", "Y");
            graph.connect("X", "Z");
            expect([...traverse(graph, "bottom-up")]).to.deep.eq([
                "C",
                "E",
                "F",
                "Q",
                "Y",
                "Z",
                "B",
                "D",
                "D",
                "P",
                "X",
                "X",
                "A",
                "A",
                "A",
            ]);
        });
    });
});
