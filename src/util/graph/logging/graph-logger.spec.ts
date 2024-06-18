import { expect } from "chai";
import path from "node:path";
import { Failable } from "../../../hooks/command";
import { dedent } from "../../dedent";
import { SkippedError } from "../../errors";
import { CapturingLogger, Level } from "../../logging";
import { SimpleDirectedGraph } from "../graph";
import { ChainingGraphLogger } from "./graph-logger";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ChainingGraphLogger.name, () => {
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
            new ChainingGraphLogger(logger).logGraph(graph);
            expect(logger.getMessages()).to.deep.eq([
                [
                    Level.ERROR,
                    dedent(`
                        F failed

                          Caused by: D failed

                            Caused by: A failed
                    `),
                ],
                [
                    Level.ERROR,
                    dedent(`
                        Z skipped

                          Caused by: X failed
                    `),
                ],
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
            new ChainingGraphLogger(logger).logGraph(graph);
            expect(logger.getMessages()).to.deep.eq([
                [
                    Level.ERROR,
                    dedent(`
                        H skipped

                          Caused by: G failed

                            Caused by: E skipped

                            Caused by: F failed

                              Caused by: D failed

                                Caused by: A failed
                    `),
                ],
                [
                    Level.ERROR,
                    dedent(`
                        I skipped

                          Caused by: G failed

                            Caused by: E skipped

                            Caused by: F failed

                              Caused by: D failed

                                Caused by: A failed
                    `),
                ],
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
            new ChainingGraphLogger(logger).logGraph(graph);
            expect(logger.getMessages()).to.deep.eq([]);
        });

        it("logs correctly indented multiline chains", () => {
            const graph = new SimpleDirectedGraph<Failable>();
            const a = graph.place({
                getFailure: () =>
                    new SkippedError(
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
            new ChainingGraphLogger(logger).logGraph(graph);
            expect(logger.getMessages()).to.deep.eq([
                [
                    Level.WARNING,
                    dedent(`
                        F skipped

                          Caused by: D skipped

                          because A failed

                            Caused by: A failed

                            for some reason
                    `),
                ],
            ]);
        });
    });
});
