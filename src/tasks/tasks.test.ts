import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { getMockedCypress } from "../../test/mocks";
import { SimpleEvidenceCollection } from "../context";
import { dedent } from "../util/dedent";
import { Level, LOG } from "../util/logging";
import * as tasks from "./tasks";

describe(relative(cwd(), __filename), async () => {
    await describe(tasks.enqueueTask.name, async () => {
        await it("uses the current test title by default", (context) => {
            const { cy, cypress } = getMockedCypress();
            cypress.currentTest.title = "A test title";
            const task = context.mock.method(cy, "task", context.mock.fn());
            const buffer = Buffer.from("https://example.org") as unknown as typeof Cypress.Buffer;
            tasks.enqueueTask("cypress-xray-plugin:add-evidence", {
                data: buffer,
                filename: "urlOnly.json",
            });
            assert.deepStrictEqual(task.mock.calls[0].arguments, [
                "cypress-xray-plugin:add-evidence",
                {
                    evidence: {
                        data: buffer,
                        filename: "urlOnly.json",
                    },
                    test: "A test title",
                },
            ]);
        });
    });

    await describe(tasks.PluginTaskListener.name, async () => {
        await it("handles single evidence calls for tests with issue key", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const evidenceCollection = new SimpleEvidenceCollection();
            const addEvidence = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, LOG);
            listener.addEvidence({
                evidence: {
                    contentType: "text/plain",
                    data: { data: [...Buffer.from("hello")], type: "Buffer" },
                    filename: "hello.txt",
                },
                test: "This is a test CYP-123",
            });
            assert.deepStrictEqual(addEvidence.mock.calls[0].arguments, [
                "CYP-123",
                {
                    contentType: "text/plain",
                    data: "aGVsbG8=",
                    filename: "hello.txt",
                },
            ]);
        });

        await it("handles single evidence calls for tests with multiple issue keys", (context) => {
            const evidenceCollection = new SimpleEvidenceCollection();
            context.mock.method(LOG, "message", context.mock.fn());
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, LOG);
            listener.addEvidence({
                evidence: {
                    contentType: "text/plain",
                    data: { data: [...Buffer.from("hello")], type: "Buffer" },
                    filename: "hello.txt",
                },
                test: "This is a test CYP-123 CYP-124 CYP-125",
            });
            assert.deepStrictEqual(evidenceCollection.getEvidence("CYP-123"), [
                {
                    contentType: "text/plain",
                    data: "aGVsbG8=",
                    filename: "hello.txt",
                },
            ]);
            assert.deepStrictEqual(evidenceCollection.getEvidence("CYP-124"), [
                {
                    contentType: "text/plain",
                    data: "aGVsbG8=",
                    filename: "hello.txt",
                },
            ]);
            assert.deepStrictEqual(evidenceCollection.getEvidence("CYP-125"), [
                {
                    contentType: "text/plain",
                    data: "aGVsbG8=",
                    filename: "hello.txt",
                },
            ]);
        });

        await it("handles single evidence calls for tests without issue key", (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const evidenceCollection = new SimpleEvidenceCollection();
            const addEvidence = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, LOG);
            listener.addEvidence({
                evidence: {
                    data: { data: [...Buffer.from("hello")], type: "Buffer" },
                    filename: "hello.txt",
                },
                test: "This is a test",
            });
            assert.strictEqual(addEvidence.mock.callCount(), 0);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
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
                `),
            ]);
        });

        await it("handles multiple evidence calls for tests with the same issue key", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const evidenceCollection = new SimpleEvidenceCollection();
            const addEvidence = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, LOG);
            listener.addEvidence({
                evidence: {
                    data: { data: [...Buffer.from("hello")], type: "Buffer" },
                    filename: "hello1.txt",
                },
                test: "This is a test CYP-123: hello",
            });
            listener.addEvidence({
                evidence: {
                    data: { data: [...Buffer.from("bonjour")], type: "Buffer" },
                    filename: "hello2.txt",
                },
                test: "This is a test CYP-123: bonjour",
            });
            assert.strictEqual(addEvidence.mock.callCount(), 2);
            assert.deepStrictEqual(addEvidence.mock.calls[0].arguments, [
                "CYP-123",
                {
                    contentType: undefined,
                    data: "aGVsbG8=",
                    filename: "hello1.txt",
                },
            ]);
            assert.deepStrictEqual(addEvidence.mock.calls[1].arguments, [
                "CYP-123",
                {
                    contentType: undefined,
                    data: "Ym9uam91cg==",
                    filename: "hello2.txt",
                },
            ]);
        });

        await it("handles multiple evidence calls for tests without issue key", (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const evidenceCollection = new SimpleEvidenceCollection();
            const addEvidence = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, LOG);
            listener.addEvidence({
                evidence: {
                    data: { data: [...Buffer.from("This is example text")], type: "Buffer" },
                    filename: "text1.txt",
                },
                test: "This is a test",
            });
            listener.addEvidence({
                evidence: {
                    data: { data: [...Buffer.from("This page does not exist")], type: "Buffer" },
                    filename: "text2.txt",
                },
                test: "This is a test",
            });
            assert.strictEqual(addEvidence.mock.callCount(), 0);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
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
                `),
            ]);
        });
    });
});
