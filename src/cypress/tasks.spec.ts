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
        it("enqueues tasks for outgoing requests (url only)", () => {
            const { cy, cypress } = getMockedCypress();
            cypress.currentTest.title = "A test title";
            const stubbedTask = sinon.stub(cy, "task");
            tasks.enqueueTask(
                tasks.PluginTask.OUTGOING_REQUEST,
                "urlOnly.json",
                "https://example.org" as unknown as Cypress.RequestOptions // https://docs.cypress.io/api/commands/request#Syntax
            );
            expect(stubbedTask).to.have.been.calledOnceWithExactly(
                tasks.PluginTask.OUTGOING_REQUEST,
                {
                    filename: "urlOnly.json",
                    request: "https://example.org",
                    test: "A test title",
                }
            );
        });

        it("enqueues tasks for outgoing requests (object)", () => {
            const { cy, cypress } = getMockedCypress();
            cypress.currentTest.title = "Another test title";
            const stubbedTask = sinon.stub(cy, "task");
            tasks.enqueueTask(tasks.PluginTask.OUTGOING_REQUEST, "requestObject.json", {
                body: { data: "cool data" },
                method: "POST",
                url: "https://example.org",
            });
            expect(stubbedTask).to.have.been.calledOnceWithExactly(
                tasks.PluginTask.OUTGOING_REQUEST,
                {
                    filename: "requestObject.json",
                    request: {
                        body: { data: "cool data" },
                        method: "POST",
                        url: "https://example.org",
                    },
                    test: "Another test title",
                }
            );
        });

        it("enqueues tasks for incoming responses", () => {
            const { cy, cypress } = getMockedCypress();
            cypress.currentTest.title = "Incoming test title";
            const stubbedTask = sinon.stub(cy, "task");
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
            expect(stubbedTask).to.have.been.calledOnceWithExactly(
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
                }
            );
        });
    });

    describe(tasks.PluginTaskListener.name, () => {
        it("handles single outgoing requests for tests with issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const logger = getMockedLogger();
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, logger);
            const result = listener[tasks.PluginTask.OUTGOING_REQUEST]({
                filename: "outgoingRequest.json",
                request: {
                    url: "https://example.org",
                },
                test: "This is a test CYP-123",
            });
            expect(evidenceCollection.addEvidence).to.have.been.calledOnceWithExactly("CYP-123", {
                contentType: "application/json",
                data: "ewogICJ1cmwiOiAiaHR0cHM6Ly9leGFtcGxlLm9yZyIKfQ==",
                filename: "outgoingRequest.json",
            });
            expect(result).to.deep.eq({
                url: "https://example.org",
            });
        });

        it("handles multiple outgoing requests for tests with the same issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const logger = getMockedLogger();
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, logger);
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
            expect(evidenceCollection.addEvidence).to.have.been.calledTwice;
            expect(evidenceCollection.addEvidence.getCall(0)).to.have.been.calledWithExactly(
                "CYP-123",
                {
                    contentType: "application/json",
                    data: "ewogICJtZXRob2QiOiAiR0VUIiwKICAidXJsIjogImh0dHBzOi8vZXhhbXBsZS5vcmciCn0=",
                    filename: "outgoingRequest1.json",
                }
            );
            expect(evidenceCollection.addEvidence.getCall(1)).to.have.been.calledWithExactly(
                "CYP-123",
                {
                    contentType: "application/json",
                    data: "ewogICJib2R5IjogewogICAgIm5hbWUiOiAiSm9obiBEb2UiCiAgfSwKICAibWV0aG9kIjogIlBPU1QiLAogICJ1cmwiOiAiaHR0cHM6Ly9leGFtcGxlLm9yZyIKfQ==",
                    filename: "outgoingRequest2.json",
                }
            );
            expect(result1).to.deep.eq({
                method: "GET",
                url: "https://example.org",
            });
            expect(result2).to.deep.eq({
                body: { name: "John Doe" },
                method: "POST",
                url: "https://example.org",
            });
        });

        it("handles single outgoing requests for tests without issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, logger);
            listener[tasks.PluginTask.OUTGOING_REQUEST]({
                filename: "outgoingRequest.json",
                request: {
                    url: "https://example.org",
                },
                test: "This is a test",
            });
            expect(evidenceCollection.addEvidence).to.not.have.been.called;
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.WARNING,
                dedent(`
                    Test: This is a test

                      Encountered a cy.request call which will not be included as evidence.

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

        it("handles multiple outgoing requests for tests without issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, logger);
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
            expect(evidenceCollection.addEvidence).to.not.have.been.called;
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.WARNING,
                dedent(`
                    Test: This is a test

                      Encountered a cy.request call which will not be included as evidence.

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

        it("handles single incoming responses for tests with issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const logger = getMockedLogger();
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, logger);
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
            expect(evidenceCollection.addEvidence).to.have.been.calledOnceWithExactly("CYP-123", {
                contentType: "application/json",
                data: "ewogICJhbGxSZXF1ZXN0UmVzcG9uc2VzIjogW10sCiAgImJvZHkiOiAiVGhpcyBpcyBleGFtcGxlIHRleHQiLAogICJkdXJhdGlvbiI6IDEyMzQ1LAogICJoZWFkZXJzIjogewogICAgIkNvbnRlbnQtVHlwZSI6ICJ0ZXh0L3BsYWluIgogIH0sCiAgImlzT2tTdGF0dXNDb2RlIjogdHJ1ZSwKICAicmVxdWVzdEhlYWRlcnMiOiB7CiAgICAiQWNjZXB0IjogInRleHQvcGxhaW4iCiAgfSwKICAic3RhdHVzIjogMjAwLAogICJzdGF0dXNUZXh0IjogIk9rIgp9",
                filename: "incomingResponse.json",
            });
            expect(result).to.deep.eq({
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

        it("handles multiple incoming responses for tests with the same issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const logger = getMockedLogger();
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, logger);
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
            expect(evidenceCollection.addEvidence).to.have.been.calledTwice;
            expect(evidenceCollection.addEvidence.getCall(0)).to.have.been.calledWithExactly(
                "CYP-123",
                {
                    contentType: "application/json",
                    data: "ewogICJhbGxSZXF1ZXN0UmVzcG9uc2VzIjogW10sCiAgImJvZHkiOiAiVGhpcyBpcyBleGFtcGxlIHRleHQiLAogICJkdXJhdGlvbiI6IDEyMzQ1LAogICJoZWFkZXJzIjogewogICAgIkNvbnRlbnQtVHlwZSI6ICJ0ZXh0L3BsYWluIgogIH0sCiAgImlzT2tTdGF0dXNDb2RlIjogdHJ1ZSwKICAicmVxdWVzdEhlYWRlcnMiOiB7CiAgICAiQWNjZXB0IjogInRleHQvcGxhaW4iCiAgfSwKICAic3RhdHVzIjogMjAwLAogICJzdGF0dXNUZXh0IjogIk9rIgp9",
                    filename: "incomingResponse1.json",
                }
            );
            expect(evidenceCollection.addEvidence.getCall(1)).to.have.been.calledWithExactly(
                "CYP-123",
                {
                    contentType: "application/json",
                    data: "ewogICJhbGxSZXF1ZXN0UmVzcG9uc2VzIjogW10sCiAgImJvZHkiOiAiVGhpcyBwYWdlIGRvZXMgbm90IGV4aXN0IiwKICAiZHVyYXRpb24iOiAxMjM0NSwKICAiaGVhZGVycyI6IHsKICAgICJDb250ZW50LVR5cGUiOiAidGV4dC9wbGFpbiIKICB9LAogICJpc09rU3RhdHVzQ29kZSI6IGZhbHNlLAogICJyZXF1ZXN0SGVhZGVycyI6IHsKICAgICJBY2NlcHQiOiAidGV4dC9wbGFpbiIKICB9LAogICJzdGF0dXMiOiA0MDQsCiAgInN0YXR1c1RleHQiOiAiTm90IGZvdW5kIgp9",
                    filename: "incomingResponse2.json",
                }
            );
            expect(result1).to.deep.eq({
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
            expect(result2).to.deep.eq({
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

        it("handles single incoming responses for tests without issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, logger);
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
            expect(evidenceCollection.addEvidence).to.not.have.been.called;
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.WARNING,
                dedent(`
                    Test: This is a test

                      Encountered a cy.request call which will not be included as evidence.

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

        it("handles multiple incoming responses for tests without issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection, logger);
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
            expect(evidenceCollection.addEvidence).to.not.have.been.called;
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.WARNING,
                dedent(`
                    Test: This is a test

                      Encountered a cy.request call which will not be included as evidence.

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
