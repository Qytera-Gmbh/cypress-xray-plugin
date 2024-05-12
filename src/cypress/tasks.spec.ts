import { expect } from "chai";
import path from "node:path";
import process from "node:process";

import sinon from "sinon";
import { getMockedCypress } from "../../test/mocks";
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
});
