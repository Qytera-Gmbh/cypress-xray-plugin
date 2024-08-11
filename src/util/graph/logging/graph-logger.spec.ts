import { expect } from "chai";
import path from "node:path";
import { getMockedXrayClient } from "../../../../test/mocks";
import { Command, ComputableState, Failable } from "../../../hooks/command";
import { ImportExecutionCucumberCommand } from "../../../hooks/util/commands/xray/import-execution-cucumber-command";
import { ImportExecutionCypressCommand } from "../../../hooks/util/commands/xray/import-execution-cypress-command";
import { ImportFeatureCommand } from "../../../hooks/util/commands/xray/import-feature-command";
import { XrayTestExecutionResults } from "../../../types/xray/import-test-execution-results";
import { CucumberMultipart } from "../../../types/xray/requests/import-execution-cucumber-multipart";
import { MultipartInfo } from "../../../types/xray/requests/import-execution-multipart-info";
import { dedent } from "../../dedent";
import { SkippedError } from "../../errors";
import { CapturingLogger, Level } from "../../logging";
import { SimpleDirectedGraph } from "../graph";
import { ChainingCommandGraphLogger, ChainingGraphLogger } from "./graph-logger";

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

        it("logs vertices with priority first", () => {
            const graph = new SimpleDirectedGraph<Failable>();
            const a = graph.place({ getFailure: () => new Error("A failed") });
            const b = graph.place({ getFailure: () => new SkippedError("B skipped") });
            const c = graph.place({ getFailure: () => undefined });
            const d = graph.place({ getFailure: () => undefined });
            const e = graph.place({ getFailure: () => new Error("E failed") });
            const f = graph.place({ getFailure: () => new SkippedError("F skipped") });
            graph.connect(a, b);
            graph.connect(a, d);
            graph.connect(b, c);
            graph.connect(d, e);
            graph.connect(d, f);
            const logger = new CapturingLogger();
            new ChainingGraphLogger(logger, (vertex) => vertex === f || vertex === e).logGraph(
                graph
            );
            expect(logger.getMessages()).to.deep.eq([
                [
                    Level.ERROR,
                    dedent(`
                        E failed
                    `),
                ],
                [
                    Level.WARNING,
                    dedent(`
                        F skipped
                    `),
                ],
                [
                    Level.ERROR,
                    dedent(`
                        B skipped

                          Caused by: A failed
                    `),
                ],
            ]);
        });
    });

    describe(ChainingCommandGraphLogger.name, () => {
        class FailingCommand<R> extends Command<R, { message: string }> {
            protected computeResult(): R {
                throw new Error(`No computing today: ${this.parameters.message}`);
            }
        }

        it("adds additional information to cucumber import command failures", async () => {
            const logger = new CapturingLogger();
            const graph = new SimpleDirectedGraph<Command>();
            const a = graph.place(
                new FailingCommand<CucumberMultipart>({ message: "generic failure" }, logger)
            );
            const b = graph.place(
                new ImportExecutionCucumberCommand({ xrayClient: getMockedXrayClient() }, logger, a)
            );
            graph.connect(a, b);
            await Promise.allSettled([a.compute()]);
            b.setState(ComputableState.SKIPPED);
            new ChainingCommandGraphLogger(logger).logGraph(graph);
            expect(logger.getMessages()).to.deep.eq([
                [
                    Level.ERROR,
                    dedent(`
                        Failed to upload Cucumber execution results.

                          Caused by: No computing today: generic failure
                    `),
                ],
            ]);
        });

        it("adds additional information to cypress import command failures", async () => {
            const logger = new CapturingLogger();
            const graph = new SimpleDirectedGraph<Command>();
            const a = graph.place(
                new FailingCommand<[XrayTestExecutionResults, MultipartInfo]>(
                    { message: "generic failure" },
                    logger
                )
            );
            const b = graph.place(
                new ImportExecutionCypressCommand({ xrayClient: getMockedXrayClient() }, logger, a)
            );
            graph.connect(a, b);
            await Promise.allSettled([a.compute()]);
            b.setState(ComputableState.SKIPPED);
            new ChainingCommandGraphLogger(logger).logGraph(graph);
            expect(logger.getMessages()).to.deep.eq([
                [
                    Level.ERROR,
                    dedent(`
                        Failed to upload Cypress execution results.

                          Caused by: No computing today: generic failure
                    `),
                ],
            ]);
        });

        it("adds additional information to feature file import command failures", async () => {
            const logger = new CapturingLogger();
            const xrayClient = getMockedXrayClient();
            xrayClient.importFeature.rejects(new Error("the feature does not exist"));
            const graph = new SimpleDirectedGraph<Command>();
            const a = graph.place(
                new FailingCommand<XrayTestExecutionResults>(
                    { message: "cannot parse file" },
                    logger
                )
            );
            const b = graph.place(
                new ImportFeatureCommand(
                    { filePath: "/path/to/file.feature", xrayClient: xrayClient },
                    logger
                )
            );
            graph.connect(a, b);
            await Promise.allSettled([a.compute()]);
            b.setState(ComputableState.SKIPPED);
            new ChainingCommandGraphLogger(logger).logGraph(graph);
            expect(logger.getMessages()).to.deep.eq([
                [
                    Level.ERROR,
                    dedent(`
                        /path/to/file.feature

                          Failed to import feature file.

                          Caused by: No computing today: cannot parse file
                    `),
                ],
            ]);
        });
    });
});
