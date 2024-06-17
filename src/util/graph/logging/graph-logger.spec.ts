import { expect } from "chai";
import { SimpleDirectedGraph } from "../graph";
import { logGraph } from "./graph-logger";

describe(__filename, () => {
    describe(logGraph.name, () => {
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
            expect(true).to.deep.eq(
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
});
