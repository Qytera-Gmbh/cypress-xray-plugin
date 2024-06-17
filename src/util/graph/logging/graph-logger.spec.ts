import { expect } from "chai";
import { Failable } from "../../../hooks/command";
import { dedent } from "../../dedent";
import { SkippedError } from "../../errors";
import { CapturingLogger, Level } from "../../logging";
import { SimpleDirectedGraph } from "../graph";
import { logGraph } from "./graph-logger";

describe(__filename, () => {
    describe(logGraph.name, () => {
        it("logs correctly indented message chains", () => {
            const graph = new SimpleDirectedGraph<Failable>();
            const a = graph.place({ getFailure: () => new Error("A failed") });
            const b = graph.place({ getFailure: () => undefined });
            const c = graph.place({ getFailure: () => undefined });
            const d = graph.place({ getFailure: () => new Error("D failed") });
            const e = graph.place({ getFailure: () => undefined });
            const f = graph.place({ getFailure: () => new Error("F failed") });
            const p = graph.place({ getFailure: () => undefined });
            const q = graph.place({ getFailure: () => undefined });
            const x = graph.place({ getFailure: () => new Error("X failed") });
            const y = graph.place({ getFailure: () => undefined });
            const z = graph.place({ getFailure: () => new SkippedError("Z skipped") });
            graph.connect(a, b);
            graph.connect(a, d);
            graph.connect(b, c);
            graph.connect(d, e);
            graph.connect(d, f);

            graph.connect(p, q);

            graph.connect(x, y);
            graph.connect(x, z);
            const logger = new CapturingLogger();
            logGraph(graph, logger);
            expect(logger.getMessages()).to.deep.eq([
                [Level.ERROR, "F failed"],
                [Level.ERROR, "  D failed"],
                [Level.ERROR, "    A failed"],
                [Level.WARNING, "Z skipped"],
                [Level.ERROR, "  X failed"],
            ]);
        });

        it("logs correctly indented message chains in diamond form", () => {
            const graph = new SimpleDirectedGraph<Failable>();
            const a = graph.place({ getFailure: () => new Error("A failed") });
            const b = graph.place({ getFailure: () => undefined });
            const c = graph.place({ getFailure: () => undefined });
            const d = graph.place({ getFailure: () => new Error("D failed") });
            const e = graph.place({ getFailure: () => new SkippedError("E skipped") });
            const f = graph.place({ getFailure: () => new Error("F failed") });
            const g = graph.place({ getFailure: () => new Error("G failed") });
            const h = graph.place({ getFailure: () => new SkippedError("H skipped") });
            const i = graph.place({ getFailure: () => new SkippedError("I skipped") });
            graph.connect(a, b);
            graph.connect(a, d);
            graph.connect(b, c);
            graph.connect(d, e);
            graph.connect(d, f);
            graph.connect(e, g);
            graph.connect(f, g);
            graph.connect(g, h);
            graph.connect(g, i);

            const logger = new CapturingLogger();
            logGraph(graph, logger);
            expect(logger.getMessages()).to.deep.eq([
                [Level.WARNING, "H skipped"],
                [Level.ERROR, "  G failed"],
                [Level.WARNING, "    E skipped"],
                [Level.ERROR, "    F failed"],
                [Level.ERROR, "      D failed"],
                [Level.ERROR, "        A failed"],
                [Level.WARNING, "I skipped"],
                [Level.ERROR, "  G failed"],
                [Level.WARNING, "    E skipped"],
                [Level.ERROR, "    F failed"],
                [Level.ERROR, "      D failed"],
                [Level.ERROR, "        A failed"],
            ]);
        });

        it("does not log entirely successful forests", () => {
            const graph = new SimpleDirectedGraph<Failable>();
            const a = graph.place({ getFailure: () => undefined });
            const b = graph.place({ getFailure: () => undefined });
            const c = graph.place({ getFailure: () => undefined });
            const d = graph.place({ getFailure: () => undefined });
            const e = graph.place({ getFailure: () => undefined });
            const f = graph.place({ getFailure: () => undefined });
            const p = graph.place({ getFailure: () => undefined });
            const q = graph.place({ getFailure: () => undefined });
            const x = graph.place({ getFailure: () => undefined });
            const y = graph.place({ getFailure: () => undefined });
            const z = graph.place({ getFailure: () => undefined });
            graph.connect(a, b);
            graph.connect(a, d);
            graph.connect(b, c);
            graph.connect(d, e);
            graph.connect(d, f);

            graph.connect(p, q);

            graph.connect(x, y);
            graph.connect(x, z);
            const logger = new CapturingLogger();
            logGraph(graph, logger);
            expect(logger.getMessages()).to.deep.eq([]);
        });

        it("logs correctly indented multiline chains", () => {
            const graph = new SimpleDirectedGraph<Failable>();
            const a = graph.place({
                getFailure: () =>
                    new Error(
                        dedent(`
                            A failed

                            for some reason
                        `)
                    ),
            });
            const b = graph.place({ getFailure: () => undefined });
            const c = graph.place({ getFailure: () => undefined });
            const d = graph.place({
                getFailure: () =>
                    new SkippedError(
                        dedent(`
                            D skipped

                            because A failed
                        `)
                    ),
            });
            const e = graph.place({ getFailure: () => undefined });
            const f = graph.place({ getFailure: () => new SkippedError("F skipped") });
            graph.connect(a, b);
            graph.connect(a, d);
            graph.connect(b, c);
            graph.connect(d, e);
            graph.connect(d, f);
            const logger = new CapturingLogger();
            logGraph(graph, logger);
            expect(logger.getMessages()).to.deep.eq([
                [Level.WARNING, "F skipped"],
                [Level.WARNING, "  D skipped\n  \n  because A failed"],
                [Level.ERROR, "    A failed\n    \n    for some reason"],
            ]);
        });
    });
});
