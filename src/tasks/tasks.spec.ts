import { expect } from "chai";
import path from "node:path";
import process from "node:process";

import sinon from "sinon";
import { getMockedCypress, getMockedLogger } from "../../test/mocks";
import { SimpleEvidenceCollection } from "../context";
import { dedent } from "../util/dedent";
import { Level } from "../util/logging";
import * as tasks from "./tasks";

describe(path.relative(process.cwd(), __filename), () => {
    describe(tasks.enqueueTask.name, () => {
        it("uses the current test title by default", () => {
            const { cy, cypress } = getMockedCypress();
            cypress.currentTest.title = "A test title";
            const stubbedTask = sinon.stub(cy, "task");
            tasks.enqueueTask("cypress-xray-plugin:add-evidence", {
                data: Buffer.from("https://example.org"),
                filename: "urlOnly.json",
            });
            expect(stubbedTask).to.have.been.calledOnceWithExactly(
                "cypress-xray-plugin:add-evidence",
                {
                    evidence: {
                        data: Buffer.from("https://example.org"),
                        filename: "urlOnly.json",
                    },
                    test: "A test title",
                }
            );
        });
    });

    describe(tasks.PluginTaskListener.name, () => {
        it("handles single evidence calls for tests with issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const logger = getMockedLogger();
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, logger);
            const result = listener.addEvidence({
                evidence: {
                    contentType: "text/plain",
                    data: Buffer.from("hello"),
                    filename: "hello.txt",
                },
                test: "This is a test CYP-123",
            });
            expect(evidenceCollection.addEvidence).to.have.been.calledOnceWithExactly("CYP-123", {
                contentType: "text/plain",
                data: "aGVsbG8=",
                filename: "hello.txt",
            });
            expect(result).to.deep.eq({
                contentType: "text/plain",
                data: Buffer.from("hello"),
                filename: "hello.txt",
            });
        });

        it("handles single evidence calls for tests with multiple issue keys", () => {
            const evidenceCollection = new SimpleEvidenceCollection();
            const logger = getMockedLogger();
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, logger);
            listener.addEvidence({
                evidence: {
                    contentType: "text/plain",
                    data: Buffer.from("hello"),
                    filename: "hello.txt",
                },
                test: "This is a test CYP-123 CYP-124 CYP-125",
            });
            expect(evidenceCollection.getEvidence("CYP-123")).to.deep.eq([
                {
                    contentType: "text/plain",
                    data: "aGVsbG8=",
                    filename: "hello.txt",
                },
            ]);
            expect(evidenceCollection.getEvidence("CYP-124")).to.deep.eq([
                {
                    contentType: "text/plain",
                    data: "aGVsbG8=",
                    filename: "hello.txt",
                },
            ]);
            expect(evidenceCollection.getEvidence("CYP-125")).to.deep.eq([
                {
                    contentType: "text/plain",
                    data: "aGVsbG8=",
                    filename: "hello.txt",
                },
            ]);
        });

        it("handles single evidence calls for tests without issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, logger);
            listener.addEvidence({
                evidence: {
                    data: Buffer.from("hello"),
                    filename: "hello.txt",
                },
                test: "This is a test",
            });
            expect(evidenceCollection.addEvidence).to.not.have.been.called;
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.WARNING,
                dedent(`
                    Test: This is a test

                      Encountered an error while trying to add evidence.

                        Caused by: Test: This is a test

                          No test issue keys found in title.

                          You can target existing test issues by adding a corresponding issue key:

                            it("CYP-123 This is a test", () => {
                              // ...
                            });

                          For more information, visit:
                          - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });

        it("handles multiple evidence calls for tests with the same issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const logger = getMockedLogger();
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, logger);
            const result1 = listener.addEvidence({
                evidence: {
                    data: Buffer.from("hello"),
                    filename: "hello1.txt",
                },
                test: "This is a test CYP-123: hello",
            });
            const result2 = listener.addEvidence({
                evidence: {
                    data: Buffer.from("bonjour"),
                    filename: "hello2.txt",
                },
                test: "This is a test CYP-123: bonjour",
            });
            expect(evidenceCollection.addEvidence).to.have.been.calledTwice;
            expect(evidenceCollection.addEvidence.getCall(0)).to.have.been.calledWithExactly(
                "CYP-123",
                {
                    data: "aGVsbG8=",
                    filename: "hello1.txt",
                }
            );
            expect(evidenceCollection.addEvidence.getCall(1)).to.have.been.calledWithExactly(
                "CYP-123",
                {
                    data: "Ym9uam91cg==",
                    filename: "hello2.txt",
                }
            );
            expect(result1).to.deep.eq({
                data: Buffer.from("hello"),
                filename: "hello1.txt",
            });
            expect(result2).to.deep.eq({
                data: Buffer.from("bonjour"),
                filename: "hello2.txt",
            });
        });

        it("handles multiple evidence calls for tests without issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, logger);
            listener.addEvidence({
                evidence: {
                    data: Buffer.from("This is example text"),
                    filename: "text1.txt",
                },
                test: "This is a test",
            });
            listener.addEvidence({
                evidence: {
                    data: Buffer.from("This page does not exist"),
                    filename: "text2.txt",
                },
                test: "This is a test",
            });
            expect(evidenceCollection.addEvidence).to.not.have.been.called;
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.WARNING,
                dedent(`
                    Test: This is a test

                      Encountered an error while trying to add evidence.

                        Caused by: Test: This is a test

                          No test issue keys found in title.

                          You can target existing test issues by adding a corresponding issue key:

                            it("CYP-123 This is a test", () => {
                              // ...
                            });

                          For more information, visit:
                          - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                `)
            );
        });
    });
});
