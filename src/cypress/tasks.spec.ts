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
            const { cypress, cy } = getMockedCypress();
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
                    test: "A test title",
                    filename: "urlOnly.json",
                    request: "https://example.org",
                }
            );
        });

        it("enqueues tasks for outgoing requests (object)", () => {
            const { cypress, cy } = getMockedCypress();
            cypress.currentTest.title = "Another test title";
            const stubbedTask = sinon.stub(cy, "task");
            tasks.enqueueTask(tasks.PluginTask.OUTGOING_REQUEST, "requestObject.json", {
                url: "https://example.org",
                method: "POST",
                body: { data: "cool data" },
            });
            expect(stubbedTask).to.have.been.calledOnceWithExactly(
                tasks.PluginTask.OUTGOING_REQUEST,
                {
                    test: "Another test title",
                    filename: "requestObject.json",
                    request: {
                        url: "https://example.org",
                        method: "POST",
                        body: { data: "cool data" },
                    },
                }
            );
        });

        it("enqueues tasks for incoming responses", () => {
            const { cypress, cy } = getMockedCypress();
            cypress.currentTest.title = "Incoming test title";
            const stubbedTask = sinon.stub(cy, "task");
            tasks.enqueueTask(tasks.PluginTask.INCOMING_RESPONSE, "responseObject.json", {
                allRequestResponses: [],
                duration: 12345,
                isOkStatusCode: true,
                requestHeaders: { ["Accept"]: "text/plain" },
                status: 200,
                statusText: "Ok",
                body: "This is example text",
                headers: {
                    ["Content-Type"]: "text/plain",
                },
            });
            expect(stubbedTask).to.have.been.calledOnceWithExactly(
                tasks.PluginTask.INCOMING_RESPONSE,
                {
                    test: "Incoming test title",
                    filename: "responseObject.json",
                    response: {
                        allRequestResponses: [],
                        duration: 12345,
                        isOkStatusCode: true,
                        requestHeaders: { ["Accept"]: "text/plain" },
                        status: 200,
                        statusText: "Ok",
                        body: "This is example text",
                        headers: {
                            ["Content-Type"]: "text/plain",
                        },
                    },
                }
            );
        });
    });

    describe(tasks.PluginTaskListener.name, () => {
        it("handles single outgoing requests for tests with issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection);
            const result = listener[tasks.PluginTask.OUTGOING_REQUEST]({
                test: "This is a test CYP-123",
                filename: "outgoingRequest.json",
                request: {
                    url: "https://example.org",
                },
            });
            expect(evidenceCollection.addEvidence).to.have.been.calledOnceWithExactly("CYP-123", {
                filename: "outgoingRequest.json",
                contentType: "application/json",
                data: "ewogICJ1cmwiOiAiaHR0cHM6Ly9leGFtcGxlLm9yZyIKfQ==",
            });
            expect(result).to.deep.eq({
                url: "https://example.org",
            });
        });

        it("handles multiple outgoing requests for tests with the same issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection);
            const result1 = listener[tasks.PluginTask.OUTGOING_REQUEST]({
                test: "This is a test CYP-123: GET",
                filename: "outgoingRequest1.json",
                request: {
                    url: "https://example.org",
                    method: "GET",
                },
            });
            const result2 = listener[tasks.PluginTask.OUTGOING_REQUEST]({
                test: "This is a test CYP-123: POST",
                filename: "outgoingRequest2.json",
                request: {
                    url: "https://example.org",
                    method: "POST",
                    body: { name: "John Doe" },
                },
            });
            expect(evidenceCollection.addEvidence).to.have.been.calledTwice;
            expect(evidenceCollection.addEvidence.getCall(0)).to.have.been.calledWithExactly(
                "CYP-123",
                {
                    filename: "outgoingRequest1.json",
                    contentType: "application/json",
                    data: "ewogICJ1cmwiOiAiaHR0cHM6Ly9leGFtcGxlLm9yZyIsCiAgIm1ldGhvZCI6ICJHRVQiCn0=",
                }
            );
            expect(evidenceCollection.addEvidence.getCall(1)).to.have.been.calledWithExactly(
                "CYP-123",
                {
                    filename: "outgoingRequest2.json",
                    contentType: "application/json",
                    data: "ewogICJ1cmwiOiAiaHR0cHM6Ly9leGFtcGxlLm9yZyIsCiAgIm1ldGhvZCI6ICJQT1NUIiwKICAiYm9keSI6IHsKICAgICJuYW1lIjogIkpvaG4gRG9lIgogIH0KfQ==",
                }
            );
            expect(result1).to.deep.eq({
                url: "https://example.org",
                method: "GET",
            });
            expect(result2).to.deep.eq({
                url: "https://example.org",
                method: "POST",
                body: { name: "John Doe" },
            });
        });

        it("handles single outgoing requests for tests without issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection);
            listener[tasks.PluginTask.OUTGOING_REQUEST]({
                test: "This is a test",
                filename: "outgoingRequest.json",
                request: {
                    url: "https://example.org",
                },
            });
            expect(evidenceCollection.addEvidence).to.not.have.been.called;
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.WARNING,
                dedent(`
                    Encountered a cy.request call which will not be included as evidence for test: This is a test

                    No test issue keys found in title of test: This is a test
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
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection);
            listener[tasks.PluginTask.OUTGOING_REQUEST]({
                test: "This is a test",
                filename: "outgoingRequest1.json",
                request: {
                    url: "https://example.org",
                    method: "GET",
                },
            });
            listener[tasks.PluginTask.OUTGOING_REQUEST]({
                test: "This is a test",
                filename: "outgoingRequest2.json",
                request: {
                    url: "https://example.org",
                    method: "POST",
                    body: { username: "Jane Doe" },
                },
            });
            expect(evidenceCollection.addEvidence).to.not.have.been.called;
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.WARNING,
                dedent(`
                    Encountered a cy.request call which will not be included as evidence for test: This is a test

                    No test issue keys found in title of test: This is a test
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
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection);
            const result = listener[tasks.PluginTask.INCOMING_RESPONSE]({
                test: "This is a test CYP-123",
                filename: "incomingResponse.json",
                response: {
                    allRequestResponses: [],
                    duration: 12345,
                    isOkStatusCode: true,
                    requestHeaders: { ["Accept"]: "text/plain" },
                    status: 200,
                    statusText: "Ok",
                    body: "This is example text",
                    headers: {
                        ["Content-Type"]: "text/plain",
                    },
                },
            });
            expect(evidenceCollection.addEvidence).to.have.been.calledOnceWithExactly("CYP-123", {
                filename: "incomingResponse.json",
                contentType: "application/json",
                data: "ewogICJhbGxSZXF1ZXN0UmVzcG9uc2VzIjogW10sCiAgImR1cmF0aW9uIjogMTIzNDUsCiAgImlzT2tTdGF0dXNDb2RlIjogdHJ1ZSwKICAicmVxdWVzdEhlYWRlcnMiOiB7CiAgICAiQWNjZXB0IjogInRleHQvcGxhaW4iCiAgfSwKICAic3RhdHVzIjogMjAwLAogICJzdGF0dXNUZXh0IjogIk9rIiwKICAiYm9keSI6ICJUaGlzIGlzIGV4YW1wbGUgdGV4dCIsCiAgImhlYWRlcnMiOiB7CiAgICAiQ29udGVudC1UeXBlIjogInRleHQvcGxhaW4iCiAgfQp9",
            });
            expect(result).to.deep.eq({
                allRequestResponses: [],
                duration: 12345,
                isOkStatusCode: true,
                requestHeaders: { ["Accept"]: "text/plain" },
                status: 200,
                statusText: "Ok",
                body: "This is example text",
                headers: {
                    ["Content-Type"]: "text/plain",
                },
            });
        });

        it("handles multiple incoming responses for tests with the same issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection);
            const result1 = listener[tasks.PluginTask.INCOMING_RESPONSE]({
                test: "This is a test CYP-123: GET",
                filename: "incomingResponse1.json",
                response: {
                    allRequestResponses: [],
                    duration: 12345,
                    isOkStatusCode: true,
                    requestHeaders: { ["Accept"]: "text/plain" },
                    status: 200,
                    statusText: "Ok",
                    body: "This is example text",
                    headers: {
                        ["Content-Type"]: "text/plain",
                    },
                },
            });
            const result2 = listener[tasks.PluginTask.INCOMING_RESPONSE]({
                test: "This is a test CYP-123: POST",
                filename: "incomingResponse2.json",
                response: {
                    allRequestResponses: [],
                    duration: 12345,
                    isOkStatusCode: false,
                    requestHeaders: { ["Accept"]: "text/plain" },
                    status: 404,
                    statusText: "Not found",
                    body: "This page does not exist",
                    headers: {
                        ["Content-Type"]: "text/plain",
                    },
                },
            });
            expect(evidenceCollection.addEvidence).to.have.been.calledTwice;
            expect(evidenceCollection.addEvidence.getCall(0)).to.have.been.calledWithExactly(
                "CYP-123",
                {
                    filename: "incomingResponse1.json",
                    contentType: "application/json",
                    data: "ewogICJhbGxSZXF1ZXN0UmVzcG9uc2VzIjogW10sCiAgImR1cmF0aW9uIjogMTIzNDUsCiAgImlzT2tTdGF0dXNDb2RlIjogdHJ1ZSwKICAicmVxdWVzdEhlYWRlcnMiOiB7CiAgICAiQWNjZXB0IjogInRleHQvcGxhaW4iCiAgfSwKICAic3RhdHVzIjogMjAwLAogICJzdGF0dXNUZXh0IjogIk9rIiwKICAiYm9keSI6ICJUaGlzIGlzIGV4YW1wbGUgdGV4dCIsCiAgImhlYWRlcnMiOiB7CiAgICAiQ29udGVudC1UeXBlIjogInRleHQvcGxhaW4iCiAgfQp9",
                }
            );
            expect(evidenceCollection.addEvidence.getCall(1)).to.have.been.calledWithExactly(
                "CYP-123",
                {
                    filename: "incomingResponse2.json",
                    contentType: "application/json",
                    data: "ewogICJhbGxSZXF1ZXN0UmVzcG9uc2VzIjogW10sCiAgImR1cmF0aW9uIjogMTIzNDUsCiAgImlzT2tTdGF0dXNDb2RlIjogZmFsc2UsCiAgInJlcXVlc3RIZWFkZXJzIjogewogICAgIkFjY2VwdCI6ICJ0ZXh0L3BsYWluIgogIH0sCiAgInN0YXR1cyI6IDQwNCwKICAic3RhdHVzVGV4dCI6ICJOb3QgZm91bmQiLAogICJib2R5IjogIlRoaXMgcGFnZSBkb2VzIG5vdCBleGlzdCIsCiAgImhlYWRlcnMiOiB7CiAgICAiQ29udGVudC1UeXBlIjogInRleHQvcGxhaW4iCiAgfQp9",
                }
            );
            expect(result1).to.deep.eq({
                allRequestResponses: [],
                duration: 12345,
                isOkStatusCode: true,
                requestHeaders: { ["Accept"]: "text/plain" },
                status: 200,
                statusText: "Ok",
                body: "This is example text",
                headers: {
                    ["Content-Type"]: "text/plain",
                },
            });
            expect(result2).to.deep.eq({
                allRequestResponses: [],
                duration: 12345,
                isOkStatusCode: false,
                requestHeaders: { ["Accept"]: "text/plain" },
                status: 404,
                statusText: "Not found",
                body: "This page does not exist",
                headers: {
                    ["Content-Type"]: "text/plain",
                },
            });
        });

        it("handles single incoming responses for tests without issue key", () => {
            const evidenceCollection = sinon.stub(new SimpleEvidenceCollection());
            const logger = getMockedLogger({ allowUnstubbedCalls: true });
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection);
            listener[tasks.PluginTask.INCOMING_RESPONSE]({
                test: "This is a test",
                filename: "incomingResponse.json",
                response: {
                    allRequestResponses: [],
                    duration: 12345,
                    isOkStatusCode: false,
                    requestHeaders: { ["Accept"]: "text/plain" },
                    status: 404,
                    statusText: "Not found",
                    body: "This page does not exist",
                    headers: {
                        ["Content-Type"]: "text/plain",
                    },
                },
            });
            expect(evidenceCollection.addEvidence).to.not.have.been.called;
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.WARNING,
                dedent(`
                    Encountered a cy.request call which will not be included as evidence for test: This is a test

                    No test issue keys found in title of test: This is a test
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
            const listener = new tasks.PluginTaskListener("CYP", evidenceCollection);
            listener[tasks.PluginTask.INCOMING_RESPONSE]({
                test: "This is a test",
                filename: "incomingResponse1.json",
                response: {
                    allRequestResponses: [],
                    duration: 12345,
                    isOkStatusCode: true,
                    requestHeaders: { ["Accept"]: "text/plain" },
                    status: 200,
                    statusText: "Ok",
                    body: "This is example text",
                    headers: {
                        ["Content-Type"]: "text/plain",
                    },
                },
            });
            listener[tasks.PluginTask.INCOMING_RESPONSE]({
                test: "This is a test",
                filename: "incomingResponse2.json",
                response: {
                    allRequestResponses: [],
                    duration: 12345,
                    isOkStatusCode: false,
                    requestHeaders: { ["Accept"]: "text/plain" },
                    status: 404,
                    statusText: "Not found",
                    body: "This page does not exist",
                    headers: {
                        ["Content-Type"]: "text/plain",
                    },
                },
            });
            expect(evidenceCollection.addEvidence).to.not.have.been.called;
            expect(logger.message).to.have.been.calledOnceWithExactly(
                Level.WARNING,
                dedent(`
                    Encountered a cy.request call which will not be included as evidence for test: This is a test

                    No test issue keys found in title of test: This is a test
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
