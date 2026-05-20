import assert from "node:assert";
import path from "node:path";
import process from "node:process";
import { describe, it } from "node:test";
import {
    faker,
    generateFakeIssueKey,
    generateFakeProjectKey,
    generateFakeTitles,
    generateFakeXrayEvidenceItem,
} from "../../test/faker";
import { getMockedCypress } from "../../test/mocks";
import type { RequestOptions } from "../models/cypress";
import { SimpleEvidenceCollection, SimpleIterationParameterCollection } from "../plugin/context";
import { dedent } from "../util/dedent";
import type { Logger } from "../util/logging";
import { LOG } from "../util/logging";
import * as tasks from "./tasks";

void describe(path.relative(process.cwd(), __filename), () => {
    void describe(tasks.enqueueTask.name, () => {
        void it("enqueues tasks for outgoing requests (url only)", (context) => {
            const { cy, cypress } = getMockedCypress();
            cypress.currentTest.titlePath = ["A test title"];
            const task = context.mock.method(cy, "task", context.mock.fn());
            tasks.enqueueTask(
                tasks.PluginTask.OUTGOING_REQUEST,
                "urlOnly.json",
                "https://example.org" as unknown as RequestOptions // https://docs.cypress.io/api/commands/request#Syntax
            );
            assert.deepStrictEqual(task.mock.calls[0].arguments, [
                tasks.PluginTask.OUTGOING_REQUEST,
                {
                    filename: "urlOnly.json",
                    request: "https://example.org",
                    test: "A test title",
                },
            ]);
        });

        void it("enqueues tasks for outgoing requests (object)", (context) => {
            const { cy, cypress } = getMockedCypress();
            cypress.currentTest.titlePath = ["Another test title"];
            const task = context.mock.method(cy, "task", context.mock.fn());
            tasks.enqueueTask(tasks.PluginTask.OUTGOING_REQUEST, "requestObject.json", {
                body: { data: "cool data" },
                method: "POST",
                url: "https://example.org",
            });
            assert.deepStrictEqual(task.mock.calls[0].arguments, [
                tasks.PluginTask.OUTGOING_REQUEST,
                {
                    filename: "requestObject.json",
                    request: {
                        body: { data: "cool data" },
                        method: "POST",
                        url: "https://example.org",
                    },
                    test: "Another test title",
                },
            ]);
        });

        void it("enqueues tasks for incoming responses", (context) => {
            const { cy, cypress } = getMockedCypress();
            cypress.currentTest.titlePath = ["Incoming test title"];
            const task = context.mock.method(cy, "task", context.mock.fn());
            tasks.enqueueTask(tasks.PluginTask.INCOMING_RESPONSE, "responseObject.json", {
                allRequestResponses: [],
                body: "This is example text",
                duration: 12345,
                headers: {
                    ["Content-Type"]: "text/plain",
                },
                isOkStatusCode: true,
                requestHeaders: { ["Accept"]: "text/plain" },
                status: 200,
                statusText: "Ok",
            });
            assert.deepStrictEqual(task.mock.calls[0].arguments, [
                tasks.PluginTask.INCOMING_RESPONSE,
                {
                    filename: "responseObject.json",
                    response: {
                        allRequestResponses: [],
                        body: "This is example text",
                        duration: 12345,
                        headers: {
                            ["Content-Type"]: "text/plain",
                        },
                        isOkStatusCode: true,
                        requestHeaders: { ["Accept"]: "text/plain" },
                        status: 200,
                        statusText: "Ok",
                    },
                    test: "Incoming test title",
                },
            ]);
        });

        void it("enqueues tasks for defining iteration parameters", (context) => {
            const { cy, cypress } = getMockedCypress();
            cypress.currentTest.titlePath = ["Incoming test title"];
            const task = context.mock.method(cy, "task", context.mock.fn());
            tasks.enqueueTask("cypress-xray-plugin:task:iteration:definition", {
                age: "42",
                name: "Bob",
            });
            assert.deepStrictEqual(task.mock.calls[0].arguments, [
                "cypress-xray-plugin:task:iteration:definition",
                {
                    parameters: { age: "42", name: "Bob" },
                    test: "Incoming test title",
                },
            ]);
        });

        void it("enqueues tasks for attaching test evidence", (context) => {
            const testName = faker().helpers.multiple(() => faker().string.sample());
            const contentType = faker().system.mimeType();
            const data = Buffer.from(faker().string.sample()).toString("base64");
            const filename = faker().system.fileName();
            const { cy, cypress } = getMockedCypress();
            cypress.currentTest.titlePath = testName;
            const task = context.mock.method(cy, "task", context.mock.fn());
            tasks.enqueueTask("cypress-xray-plugin:task:evidence:attachment", {
                contentType: contentType,
                data: data,
                filename: filename,
            });
            assert.deepStrictEqual(
                task.mock.calls.map((call) => call.arguments),
                [
                    [
                        "cypress-xray-plugin:task:evidence:attachment",
                        {
                            evidence: {
                                contentType: contentType,
                                data: data,
                                filename: filename,
                            },
                            test: testName.join(" "),
                        },
                    ],
                ]
            );
        });
    });

    void describe(tasks.CypressTaskListener.name, () => {
        void it("handles single outgoing requests for tests with issue key", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const evidenceCollection = new SimpleEvidenceCollection();
            const addEvidence = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const listener = new tasks.CypressTaskListener(
                "CYP",
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                LOG
            );
            const result = listener[tasks.PluginTask.OUTGOING_REQUEST]({
                filename: "outgoingRequest.json",
                request: {
                    url: "https://example.org",
                },
                test: "This is a test CYP-123",
            });
            assert.deepStrictEqual(addEvidence.mock.calls[0].arguments, [
                "CYP-123",
                {
                    contentType: "application/json",
                    data: "ewogICJ1cmwiOiAiaHR0cHM6Ly9leGFtcGxlLm9yZyIKfQ==",
                    filename: "outgoingRequest.json",
                },
            ]);
            assert.deepStrictEqual(result, {
                url: "https://example.org",
            });
        });

        void it("handles single outgoing requests for tests with multiple issue keys", (context) => {
            const evidenceCollection = new SimpleEvidenceCollection();
            context.mock.method(LOG, "message", context.mock.fn());
            const listener = new tasks.CypressTaskListener(
                "CYP",
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                LOG
            );
            listener[tasks.PluginTask.OUTGOING_REQUEST]({
                filename: "outgoingRequest.json",
                request: {
                    url: "https://example.org",
                },
                test: "This is a test CYP-123 CYP-124 CYP-125",
            });
            assert.deepStrictEqual(evidenceCollection.getEvidence("CYP-123"), [
                {
                    contentType: "application/json",
                    data: "ewogICJ1cmwiOiAiaHR0cHM6Ly9leGFtcGxlLm9yZyIKfQ==",
                    filename: "outgoingRequest.json",
                },
            ]);
            assert.deepStrictEqual(evidenceCollection.getEvidence("CYP-124"), [
                {
                    contentType: "application/json",
                    data: "ewogICJ1cmwiOiAiaHR0cHM6Ly9leGFtcGxlLm9yZyIKfQ==",
                    filename: "outgoingRequest.json",
                },
            ]);
            assert.deepStrictEqual(evidenceCollection.getEvidence("CYP-125"), [
                {
                    contentType: "application/json",
                    data: "ewogICJ1cmwiOiAiaHR0cHM6Ly9leGFtcGxlLm9yZyIKfQ==",
                    filename: "outgoingRequest.json",
                },
            ]);
        });

        void it("handles multiple outgoing requests for tests with the same issue key", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const evidenceCollection = new SimpleEvidenceCollection();
            const addEvidence = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const listener = new tasks.CypressTaskListener(
                "CYP",
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                LOG
            );
            const result1 = listener[tasks.PluginTask.OUTGOING_REQUEST]({
                filename: "outgoingRequest1.json",
                request: {
                    method: "GET",
                    url: "https://example.org",
                },
                test: "This is a test CYP-123: GET",
            });
            const result2 = listener[tasks.PluginTask.OUTGOING_REQUEST]({
                filename: "outgoingRequest2.json",
                request: {
                    body: { name: "John Doe" },
                    method: "POST",
                    url: "https://example.org",
                },
                test: "This is a test CYP-123: POST",
            });
            assert.strictEqual(addEvidence.mock.callCount(), 2);
            assert.deepStrictEqual(addEvidence.mock.calls[0].arguments, [
                "CYP-123",
                {
                    contentType: "application/json",
                    data: "ewogICJtZXRob2QiOiAiR0VUIiwKICAidXJsIjogImh0dHBzOi8vZXhhbXBsZS5vcmciCn0=",
                    filename: "outgoingRequest1.json",
                },
            ]);
            assert.deepStrictEqual(addEvidence.mock.calls[1].arguments, [
                "CYP-123",
                {
                    contentType: "application/json",
                    data: "ewogICJib2R5IjogewogICAgIm5hbWUiOiAiSm9obiBEb2UiCiAgfSwKICAibWV0aG9kIjogIlBPU1QiLAogICJ1cmwiOiAiaHR0cHM6Ly9leGFtcGxlLm9yZyIKfQ==",
                    filename: "outgoingRequest2.json",
                },
            ]);
            assert.deepStrictEqual(result1, {
                method: "GET",
                url: "https://example.org",
            });
            assert.deepStrictEqual(result2, {
                body: { name: "John Doe" },
                method: "POST",
                url: "https://example.org",
            });
        });

        void it("handles single outgoing requests for tests without issue key", (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const evidenceCollection = new SimpleEvidenceCollection();
            const addEvidence = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const listener = new tasks.CypressTaskListener(
                "CYP",
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                LOG
            );
            listener[tasks.PluginTask.OUTGOING_REQUEST]({
                filename: "outgoingRequest.json",
                request: {
                    url: "https://example.org",
                },
                test: "This is a test",
            });
            assert.strictEqual(addEvidence.mock.callCount(), 0);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "warning",
                dedent(`
                    Test: This is a test

                      Encountered a cypress-xray-plugin:task:request task call which cannot be mapped to a test.

                        Caused by: Test: This is a test

                          No test issue keys found in title.

                          You can target existing test issues by adding a corresponding issue key:

                            it("CYP-123 This is a test", () => {
                              // ...
                            });

                          For more information, visit:
                          - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                `),
            ]);
        });

        void it("handles multiple outgoing requests for tests without issue key", (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const evidenceCollection = new SimpleEvidenceCollection();
            const addEvidence = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const listener = new tasks.CypressTaskListener(
                "CYP",
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                LOG
            );
            listener[tasks.PluginTask.OUTGOING_REQUEST]({
                filename: "outgoingRequest1.json",
                request: {
                    method: "GET",
                    url: "https://example.org",
                },
                test: "This is a test",
            });
            listener[tasks.PluginTask.OUTGOING_REQUEST]({
                filename: "outgoingRequest2.json",
                request: {
                    body: { username: "Jane Doe" },
                    method: "POST",
                    url: "https://example.org",
                },
                test: "This is a test",
            });
            assert.strictEqual(addEvidence.mock.callCount(), 0);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "warning",
                dedent(`
                    Test: This is a test

                      Encountered a cypress-xray-plugin:task:request task call which cannot be mapped to a test.

                        Caused by: Test: This is a test

                          No test issue keys found in title.

                          You can target existing test issues by adding a corresponding issue key:

                            it("CYP-123 This is a test", () => {
                              // ...
                            });

                          For more information, visit:
                          - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                `),
            ]);
        });

        void it("handles single incoming responses for tests with issue key", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const evidenceCollection = new SimpleEvidenceCollection();
            const addEvidence = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const listener = new tasks.CypressTaskListener(
                "CYP",
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                LOG
            );
            const result = listener[tasks.PluginTask.INCOMING_RESPONSE]({
                filename: "incomingResponse.json",
                response: {
                    allRequestResponses: [],
                    body: "This is example text",
                    duration: 12345,
                    headers: {
                        ["Content-Type"]: "text/plain",
                    },
                    isOkStatusCode: true,
                    requestHeaders: { ["Accept"]: "text/plain" },
                    status: 200,
                    statusText: "Ok",
                },
                test: "This is a test CYP-123",
            });
            assert.deepStrictEqual(addEvidence.mock.calls[0].arguments, [
                "CYP-123",
                {
                    contentType: "application/json",
                    data: "ewogICJhbGxSZXF1ZXN0UmVzcG9uc2VzIjogW10sCiAgImJvZHkiOiAiVGhpcyBpcyBleGFtcGxlIHRleHQiLAogICJkdXJhdGlvbiI6IDEyMzQ1LAogICJoZWFkZXJzIjogewogICAgIkNvbnRlbnQtVHlwZSI6ICJ0ZXh0L3BsYWluIgogIH0sCiAgImlzT2tTdGF0dXNDb2RlIjogdHJ1ZSwKICAicmVxdWVzdEhlYWRlcnMiOiB7CiAgICAiQWNjZXB0IjogInRleHQvcGxhaW4iCiAgfSwKICAic3RhdHVzIjogMjAwLAogICJzdGF0dXNUZXh0IjogIk9rIgp9",
                    filename: "incomingResponse.json",
                },
            ]);
            assert.deepStrictEqual(result, {
                allRequestResponses: [],
                body: "This is example text",
                duration: 12345,
                headers: {
                    ["Content-Type"]: "text/plain",
                },
                isOkStatusCode: true,
                requestHeaders: { ["Accept"]: "text/plain" },
                status: 200,
                statusText: "Ok",
            });
        });

        void it("handles single incoming responses for tests with multiple issue keys", (context) => {
            const evidenceCollection = new SimpleEvidenceCollection();
            context.mock.method(LOG, "message", context.mock.fn());
            const listener = new tasks.CypressTaskListener(
                "CYP",
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                LOG
            );
            listener[tasks.PluginTask.INCOMING_RESPONSE]({
                filename: "incomingResponse.json",
                response: {
                    allRequestResponses: [],
                    body: "This is example text",
                    duration: 12345,
                    headers: {
                        ["Content-Type"]: "text/plain",
                    },
                    isOkStatusCode: true,
                    requestHeaders: { ["Accept"]: "text/plain" },
                    status: 200,
                    statusText: "Ok",
                },
                test: "This is a test CYP-123 CYP-124 CYP-125",
            });
            assert.deepStrictEqual(evidenceCollection.getEvidence("CYP-123"), [
                {
                    contentType: "application/json",
                    data: "ewogICJhbGxSZXF1ZXN0UmVzcG9uc2VzIjogW10sCiAgImJvZHkiOiAiVGhpcyBpcyBleGFtcGxlIHRleHQiLAogICJkdXJhdGlvbiI6IDEyMzQ1LAogICJoZWFkZXJzIjogewogICAgIkNvbnRlbnQtVHlwZSI6ICJ0ZXh0L3BsYWluIgogIH0sCiAgImlzT2tTdGF0dXNDb2RlIjogdHJ1ZSwKICAicmVxdWVzdEhlYWRlcnMiOiB7CiAgICAiQWNjZXB0IjogInRleHQvcGxhaW4iCiAgfSwKICAic3RhdHVzIjogMjAwLAogICJzdGF0dXNUZXh0IjogIk9rIgp9",
                    filename: "incomingResponse.json",
                },
            ]);
            assert.deepStrictEqual(evidenceCollection.getEvidence("CYP-124"), [
                {
                    contentType: "application/json",
                    data: "ewogICJhbGxSZXF1ZXN0UmVzcG9uc2VzIjogW10sCiAgImJvZHkiOiAiVGhpcyBpcyBleGFtcGxlIHRleHQiLAogICJkdXJhdGlvbiI6IDEyMzQ1LAogICJoZWFkZXJzIjogewogICAgIkNvbnRlbnQtVHlwZSI6ICJ0ZXh0L3BsYWluIgogIH0sCiAgImlzT2tTdGF0dXNDb2RlIjogdHJ1ZSwKICAicmVxdWVzdEhlYWRlcnMiOiB7CiAgICAiQWNjZXB0IjogInRleHQvcGxhaW4iCiAgfSwKICAic3RhdHVzIjogMjAwLAogICJzdGF0dXNUZXh0IjogIk9rIgp9",
                    filename: "incomingResponse.json",
                },
            ]);
            assert.deepStrictEqual(evidenceCollection.getEvidence("CYP-125"), [
                {
                    contentType: "application/json",
                    data: "ewogICJhbGxSZXF1ZXN0UmVzcG9uc2VzIjogW10sCiAgImJvZHkiOiAiVGhpcyBpcyBleGFtcGxlIHRleHQiLAogICJkdXJhdGlvbiI6IDEyMzQ1LAogICJoZWFkZXJzIjogewogICAgIkNvbnRlbnQtVHlwZSI6ICJ0ZXh0L3BsYWluIgogIH0sCiAgImlzT2tTdGF0dXNDb2RlIjogdHJ1ZSwKICAicmVxdWVzdEhlYWRlcnMiOiB7CiAgICAiQWNjZXB0IjogInRleHQvcGxhaW4iCiAgfSwKICAic3RhdHVzIjogMjAwLAogICJzdGF0dXNUZXh0IjogIk9rIgp9",
                    filename: "incomingResponse.json",
                },
            ]);
        });

        void it("handles multiple incoming responses for tests with the same issue key", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const evidenceCollection = new SimpleEvidenceCollection();
            const addEvidence = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const listener = new tasks.CypressTaskListener(
                "CYP",
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                LOG
            );
            const result1 = listener[tasks.PluginTask.INCOMING_RESPONSE]({
                filename: "incomingResponse1.json",
                response: {
                    allRequestResponses: [],
                    body: "This is example text",
                    duration: 12345,
                    headers: {
                        ["Content-Type"]: "text/plain",
                    },
                    isOkStatusCode: true,
                    requestHeaders: { ["Accept"]: "text/plain" },
                    status: 200,
                    statusText: "Ok",
                },
                test: "This is a test CYP-123: GET",
            });
            const result2 = listener[tasks.PluginTask.INCOMING_RESPONSE]({
                filename: "incomingResponse2.json",
                response: {
                    allRequestResponses: [],
                    body: "This page does not exist",
                    duration: 12345,
                    headers: {
                        ["Content-Type"]: "text/plain",
                    },
                    isOkStatusCode: false,
                    requestHeaders: { ["Accept"]: "text/plain" },
                    status: 404,
                    statusText: "Not found",
                },
                test: "This is a test CYP-123: POST",
            });
            assert.strictEqual(addEvidence.mock.callCount(), 2);
            assert.deepStrictEqual(addEvidence.mock.calls[0].arguments, [
                "CYP-123",
                {
                    contentType: "application/json",
                    data: "ewogICJhbGxSZXF1ZXN0UmVzcG9uc2VzIjogW10sCiAgImJvZHkiOiAiVGhpcyBpcyBleGFtcGxlIHRleHQiLAogICJkdXJhdGlvbiI6IDEyMzQ1LAogICJoZWFkZXJzIjogewogICAgIkNvbnRlbnQtVHlwZSI6ICJ0ZXh0L3BsYWluIgogIH0sCiAgImlzT2tTdGF0dXNDb2RlIjogdHJ1ZSwKICAicmVxdWVzdEhlYWRlcnMiOiB7CiAgICAiQWNjZXB0IjogInRleHQvcGxhaW4iCiAgfSwKICAic3RhdHVzIjogMjAwLAogICJzdGF0dXNUZXh0IjogIk9rIgp9",
                    filename: "incomingResponse1.json",
                },
            ]);
            assert.deepStrictEqual(addEvidence.mock.calls[1].arguments, [
                "CYP-123",
                {
                    contentType: "application/json",
                    data: "ewogICJhbGxSZXF1ZXN0UmVzcG9uc2VzIjogW10sCiAgImJvZHkiOiAiVGhpcyBwYWdlIGRvZXMgbm90IGV4aXN0IiwKICAiZHVyYXRpb24iOiAxMjM0NSwKICAiaGVhZGVycyI6IHsKICAgICJDb250ZW50LVR5cGUiOiAidGV4dC9wbGFpbiIKICB9LAogICJpc09rU3RhdHVzQ29kZSI6IGZhbHNlLAogICJyZXF1ZXN0SGVhZGVycyI6IHsKICAgICJBY2NlcHQiOiAidGV4dC9wbGFpbiIKICB9LAogICJzdGF0dXMiOiA0MDQsCiAgInN0YXR1c1RleHQiOiAiTm90IGZvdW5kIgp9",
                    filename: "incomingResponse2.json",
                },
            ]);
            assert.deepStrictEqual(result1, {
                allRequestResponses: [],
                body: "This is example text",
                duration: 12345,
                headers: {
                    ["Content-Type"]: "text/plain",
                },
                isOkStatusCode: true,
                requestHeaders: { ["Accept"]: "text/plain" },
                status: 200,
                statusText: "Ok",
            });
            assert.deepStrictEqual(result2, {
                allRequestResponses: [],
                body: "This page does not exist",
                duration: 12345,
                headers: {
                    ["Content-Type"]: "text/plain",
                },
                isOkStatusCode: false,
                requestHeaders: { ["Accept"]: "text/plain" },
                status: 404,
                statusText: "Not found",
            });
        });

        void it("handles single incoming responses for tests without issue key", (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const evidenceCollection = new SimpleEvidenceCollection();
            const addEvidence = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const listener = new tasks.CypressTaskListener(
                "CYP",
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                LOG
            );
            listener[tasks.PluginTask.INCOMING_RESPONSE]({
                filename: "incomingResponse.json",
                response: {
                    allRequestResponses: [],
                    body: "This page does not exist",
                    duration: 12345,
                    headers: {
                        ["Content-Type"]: "text/plain",
                    },
                    isOkStatusCode: false,
                    requestHeaders: { ["Accept"]: "text/plain" },
                    status: 404,
                    statusText: "Not found",
                },
                test: "This is a test",
            });
            assert.strictEqual(addEvidence.mock.callCount(), 0);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "warning",
                dedent(`
                    Test: This is a test

                      Encountered a cypress-xray-plugin:task:response task call which cannot be mapped to a test.

                        Caused by: Test: This is a test

                          No test issue keys found in title.

                          You can target existing test issues by adding a corresponding issue key:

                            it("CYP-123 This is a test", () => {
                              // ...
                            });

                          For more information, visit:
                          - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                `),
            ]);
        });

        void it("handles multiple incoming responses for tests without issue key", (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const evidenceCollection = new SimpleEvidenceCollection();
            const addEvidence = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const listener = new tasks.CypressTaskListener(
                "CYP",
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                LOG
            );
            listener[tasks.PluginTask.INCOMING_RESPONSE]({
                filename: "incomingResponse1.json",
                response: {
                    allRequestResponses: [],
                    body: "This is example text",
                    duration: 12345,
                    headers: {
                        ["Content-Type"]: "text/plain",
                    },
                    isOkStatusCode: true,
                    requestHeaders: { ["Accept"]: "text/plain" },
                    status: 200,
                    statusText: "Ok",
                },
                test: "This is a test",
            });
            listener[tasks.PluginTask.INCOMING_RESPONSE]({
                filename: "incomingResponse2.json",
                response: {
                    allRequestResponses: [],
                    body: "This page does not exist",
                    duration: 12345,
                    headers: {
                        ["Content-Type"]: "text/plain",
                    },
                    isOkStatusCode: false,
                    requestHeaders: { ["Accept"]: "text/plain" },
                    status: 404,
                    statusText: "Not found",
                },
                test: "This is a test",
            });
            assert.strictEqual(addEvidence.mock.callCount(), 0);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "warning",
                dedent(`
                    Test: This is a test

                      Encountered a cypress-xray-plugin:task:response task call which cannot be mapped to a test.

                        Caused by: Test: This is a test

                          No test issue keys found in title.

                          You can target existing test issues by adding a corresponding issue key:

                            it("CYP-123 This is a test", () => {
                              // ...
                            });

                          For more information, visit:
                          - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                `),
            ]);
        });

        void it("handles iteration definitions for tests with issue key", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const iterationParameterCollection = new SimpleIterationParameterCollection();
            const setIterationParameters = context.mock.method(
                iterationParameterCollection,
                "setIterationParameters",
                context.mock.fn()
            );
            const listener = new tasks.CypressTaskListener(
                "CYP",
                new SimpleEvidenceCollection(),
                iterationParameterCollection,
                LOG
            );
            const result = listener["cypress-xray-plugin:task:iteration:definition"]({
                parameters: { age: "42", name: "Bob" },
                test: "This is a test CYP-123",
            });
            assert.deepStrictEqual(setIterationParameters.mock.calls[0].arguments, [
                "CYP-123",
                "This is a test CYP-123",
                { age: "42", name: "Bob" },
            ]);
            assert.deepStrictEqual(result, { age: "42", name: "Bob" });
        });

        void it("handles single iteration definitions for tests with multiple issue keys", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const iterationParameterCollection = new SimpleIterationParameterCollection();
            const listener = new tasks.CypressTaskListener(
                "CYP",
                new SimpleEvidenceCollection(),
                iterationParameterCollection,
                LOG
            );
            listener["cypress-xray-plugin:task:iteration:definition"]({
                parameters: { age: "42", name: "Bob" },
                test: "CYP-123 CYP-124 CYP-125",
            });
            assert.deepStrictEqual(
                iterationParameterCollection.getIterationParameters(
                    "CYP-123",
                    "CYP-123 CYP-124 CYP-125"
                ),
                { age: "42", name: "Bob" }
            );
            assert.deepStrictEqual(
                iterationParameterCollection.getIterationParameters(
                    "CYP-124",
                    "CYP-123 CYP-124 CYP-125"
                ),
                { age: "42", name: "Bob" }
            );
            assert.deepStrictEqual(
                iterationParameterCollection.getIterationParameters(
                    "CYP-125",
                    "CYP-123 CYP-124 CYP-125"
                ),
                { age: "42", name: "Bob" }
            );
        });

        void it("handles multiple iteration definitions for tests with the same issue key", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const iterationParameterCollection = new SimpleIterationParameterCollection();
            const listener = new tasks.CypressTaskListener(
                "CYP",
                new SimpleEvidenceCollection(),
                iterationParameterCollection,
                LOG
            );
            listener["cypress-xray-plugin:task:iteration:definition"]({
                parameters: { name: "Bob" },
                test: "This is a test CYP-123",
            });
            listener["cypress-xray-plugin:task:iteration:definition"]({
                parameters: { age: "42" },
                test: "This is another test CYP-123",
            });
            assert.deepStrictEqual(
                iterationParameterCollection.getIterationParameters(
                    "CYP-123",
                    "This is a test CYP-123"
                ),
                { name: "Bob" }
            );
            assert.deepStrictEqual(
                iterationParameterCollection.getIterationParameters(
                    "CYP-123",
                    "This is another test CYP-123"
                ),
                { age: "42" }
            );
        });

        void it("handles single iteration definitions for tests without issue key", (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const iterationParameterCollection = new SimpleIterationParameterCollection();
            const setIterationParameters = context.mock.method(
                iterationParameterCollection,
                "setIterationParameters",
                context.mock.fn()
            );
            const listener = new tasks.CypressTaskListener(
                "CYP",
                new SimpleEvidenceCollection(),
                iterationParameterCollection,
                LOG
            );
            listener["cypress-xray-plugin:task:iteration:definition"]({
                parameters: { name: "Bob" },
                test: "This is a test",
            });
            assert.strictEqual(setIterationParameters.mock.callCount(), 0);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "warning",
                dedent(`
                    Test: This is a test

                      Encountered a cypress-xray-plugin:task:iteration:definition task call which cannot be mapped to a test.

                        Caused by: Test: This is a test

                          No test issue keys found in title.

                          You can target existing test issues by adding a corresponding issue key:

                            it("CYP-123 This is a test", () => {
                              // ...
                            });

                          For more information, visit:
                          - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                `),
            ]);
        });

        void it("handles multiple iteration definitions for tests without issue key", (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const iterationParameterCollection = new SimpleIterationParameterCollection();
            const setIterationParameters = context.mock.method(
                iterationParameterCollection,
                "setIterationParameters",
                context.mock.fn()
            );
            const listener = new tasks.CypressTaskListener(
                "CYP",
                new SimpleEvidenceCollection(),
                iterationParameterCollection,
                LOG
            );
            listener["cypress-xray-plugin:task:iteration:definition"]({
                parameters: { name: "Bob" },
                test: "This is a test",
            });
            listener["cypress-xray-plugin:task:iteration:definition"]({
                parameters: { age: "42" },
                test: "This is a test",
            });
            assert.strictEqual(setIterationParameters.mock.callCount(), 0);
            assert.deepStrictEqual(message.mock.callCount(), 1);
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "warning",
                dedent(`
                    Test: This is a test

                      Encountered a cypress-xray-plugin:task:iteration:definition task call which cannot be mapped to a test.

                        Caused by: Test: This is a test

                          No test issue keys found in title.

                          You can target existing test issues by adding a corresponding issue key:

                            it("CYP-123 This is a test", () => {
                              // ...
                            });

                          For more information, visit:
                          - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                `),
            ]);
        });

        void it("handles evidence attachments for tests with issue key", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const evidenceCollection = new SimpleEvidenceCollection();
            const addEvidenceMock = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const projectKey = generateFakeProjectKey();
            const issueKey = generateFakeIssueKey({ projectKey: projectKey });
            const evidence = generateFakeXrayEvidenceItem();
            const listener = new tasks.CypressTaskListener(
                projectKey,
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                { message: messageMock }
            );
            const result = listener["cypress-xray-plugin:task:evidence:attachment"]({
                evidence: evidence,
                test: generateFakeTitles(issueKey).join(" "),
            });
            assert.deepStrictEqual(
                addEvidenceMock.mock.calls.map((call) => call.arguments),
                [[issueKey, evidence]]
            );
            assert.deepStrictEqual(result, evidence);
        });

        void it("handles single evidence attachments for tests with multiple issue keys", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const evidenceCollection = new SimpleEvidenceCollection();
            const projectKey = generateFakeProjectKey();
            const issueKeys = faker().helpers.multiple(() =>
                generateFakeIssueKey({ projectKey: projectKey })
            );
            const evidence = generateFakeXrayEvidenceItem();
            const listener = new tasks.CypressTaskListener(
                projectKey,
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                { message: messageMock }
            );
            listener["cypress-xray-plugin:task:evidence:attachment"]({
                evidence: evidence,
                test: issueKeys.flatMap((key) => generateFakeTitles(key)).join(" "),
            });
            for (const issueKey of issueKeys) {
                assert.deepStrictEqual(evidenceCollection.getEvidence(issueKey), [evidence]);
            }
        });

        void it("handles multiple evidence attachments for tests with the same issue key", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const evidenceCollection = new SimpleEvidenceCollection();
            const projectKey = generateFakeProjectKey();
            const issueKey = generateFakeIssueKey({ projectKey: projectKey });
            const evidences = faker().helpers.multiple(() => generateFakeXrayEvidenceItem());
            const listener = new tasks.CypressTaskListener(
                projectKey,
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                { message: messageMock }
            );
            for (const evidence of evidences) {
                listener["cypress-xray-plugin:task:evidence:attachment"]({
                    evidence: evidence,
                    test: generateFakeTitles(issueKey).join(" "),
                });
            }
            assert.deepStrictEqual(evidenceCollection.getEvidence(issueKey), evidences);
        });

        void it("handles single evidence attachments for tests without issue key", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const evidenceCollection = new SimpleEvidenceCollection();
            const projectKey = generateFakeProjectKey();
            const evidence = generateFakeXrayEvidenceItem();
            const title = generateFakeTitles().join(" ");
            const addEvidenceMock = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const listener = new tasks.CypressTaskListener(
                projectKey,
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                { message: messageMock }
            );
            listener["cypress-xray-plugin:task:evidence:attachment"]({
                evidence: evidence,
                test: title,
            });
            assert.strictEqual(addEvidenceMock.mock.callCount(), 0);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "warning",
                        dedent(`
                            Test: ${title}

                              Encountered a cypress-xray-plugin:task:evidence:attachment task call which cannot be mapped to a test.

                                Caused by: Test: ${title}

                                  No test issue keys found in title.

                                  You can target existing test issues by adding a corresponding issue key:

                                    it("${projectKey}-123 ${title}", () => {
                                      // ...
                                    });

                                  For more information, visit:
                                  - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                        `),
                    ],
                ]
            );
        });

        void it("handles multiple evidence attachments for tests without issue key", (context) => {
            const messageMock = context.mock.fn<Logger["message"]>();
            const evidenceCollection = new SimpleEvidenceCollection();
            const projectKey = generateFakeProjectKey();
            const evidences = faker().helpers.multiple(() => generateFakeXrayEvidenceItem());
            const title = generateFakeTitles().join(" ");
            const addEvidenceMock = context.mock.method(
                evidenceCollection,
                "addEvidence",
                context.mock.fn()
            );
            const listener = new tasks.CypressTaskListener(
                projectKey,
                evidenceCollection,
                new SimpleIterationParameterCollection(),
                { message: messageMock }
            );
            for (const evidence of evidences) {
                listener["cypress-xray-plugin:task:evidence:attachment"]({
                    evidence: evidence,
                    test: title,
                });
            }
            assert.strictEqual(addEvidenceMock.mock.callCount(), 0);
            assert.deepStrictEqual(messageMock.mock.callCount(), 1);
            assert.deepStrictEqual(
                messageMock.mock.calls.map((call) => call.arguments),
                [
                    [
                        "warning",
                        dedent(`
                            Test: ${title}

                              Encountered a cypress-xray-plugin:task:evidence:attachment task call which cannot be mapped to a test.

                                Caused by: Test: ${title}

                                  No test issue keys found in title.

                                  You can target existing test issues by adding a corresponding issue key:

                                    it("${projectKey}-123 ${title}", () => {
                                      // ...
                                    });

                                  For more information, visit:
                                  - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                        `),
                    ],
                ]
            );
        });
    });
});
