import { expect } from "chai";
import path from "node:path";
import process from "node:process";

import Sinon from "sinon";
import { getMockedCypress } from "../../test/mocks";
import * as tasks from "./tasks";

describe(path.relative(process.cwd(), __filename), () => {
    beforeEach(() => {
        const resolved = require.resolve(`${__dirname}/commands`);
        if (resolved in require.cache) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete require.cache[resolved];
        }
    });

    it("overwrites the cy.request command on import", async () => {
        const overwriteSpy = Sinon.spy((name: string) => {
            expect(name).to.eq("request");
        });
        getMockedCypress().cypress.Commands.overwrite = overwriteSpy;
        await import("./commands");
        expect(overwriteSpy).to.have.been.calledOnce;
    });

    const tests: {
        name: string;
        request: Partial<Cypress.RequestOptions>;
        response: Cypress.Response<unknown>;
        expectedFilenames: [string, string];
    }[] = [
        {
            name: "a request object",
            request: {
                url: "https://example.org",
                method: "GET",
            },
            response: {
                allRequestResponses: [],
                body: "Hello there",
                duration: 42,
                headers: {
                    ["Content-Type"]: "text/plain",
                },
                isOkStatusCode: true,
                requestHeaders: {},
                status: 200,
                statusText: "Ok",
            },
            expectedFilenames: [
                "GET https_example.org 01_00_12 request.json",
                "GET https_example.org 01_00_12 response.json",
            ],
        },
        {
            name: "a request string",
            request: "https://example.org" as Partial<Cypress.RequestOptions>,
            response: {
                allRequestResponses: [],
                body: "Page not found",
                duration: 420,
                headers: {
                    ["Content-Type"]: "text/plain",
                },
                isOkStatusCode: true,
                requestHeaders: {},
                status: 404,
                statusText: "Not found",
            },
            expectedFilenames: [
                "GET https_example.org 01_00_12 request.json",
                "GET https_example.org 01_00_12 response.json",
            ],
        },
        {
            name: "an undefined request object",
            request: {},
            response: {
                allRequestResponses: [],
                body: "Pls go somewhere else",
                duration: 123,
                headers: {
                    ["Content-Type"]: "text/plain",
                },
                isOkStatusCode: true,
                requestHeaders: {},
                status: 302,
                statusText: "Found",
            },
            expectedFilenames: [
                "UNKNOWN_METHOD UNKNOWN_URL 01_00_12 request.json",
                "UNKNOWN_METHOD UNKNOWN_URL 01_00_12 response.json",
            ],
        },
    ];

    for (const test of tests) {
        it(`calls the request interception tasks with ${test.name}`, async () => {
            Sinon.useFakeTimers(new Date(12345));

            const firstChainable = {
                then: (
                    fn: (
                        this: Cypress.ObjectLike,
                        currentSubject: Partial<Cypress.RequestOptions>
                    ) => Cypress.Chainable<Cypress.Response<unknown>>
                ) => {
                    return fn.call({}, test.request);
                },
            } as unknown as Cypress.Chainable<Partial<Cypress.RequestOptions>>;

            const secondChainable: Cypress.Chainable<Cypress.Response<unknown>> = {
                then: (
                    fn: (
                        this: Cypress.ObjectLike,
                        currentSubject: Cypress.Response<unknown>
                    ) => Cypress.Chainable<Cypress.Response<unknown>>
                ) => {
                    return fn.call({}, test.response);
                },
            } as unknown as Cypress.Chainable<Cypress.Response<unknown>>;

            const stubbedEnqueue = Sinon.stub(tasks, "enqueueTask");
            stubbedEnqueue
                .onFirstCall()
                .returns(firstChainable as unknown as Cypress.Chainable<Cypress.Response<unknown>>);
            stubbedEnqueue
                .onSecondCall()
                .returns(
                    secondChainable as unknown as Cypress.Chainable<Cypress.Response<unknown>>
                );

            getMockedCypress().cypress.Commands.overwrite = Sinon.spy(
                (
                    name: string,
                    fn: (
                        this: Mocha.Context,
                        originalFn: Cypress.CommandOriginalFn<"request">,
                        ...args: Parameters<Cypress.ChainableMethods["request"]>
                    ) => ReturnType<Cypress.ChainableMethods["request"]>
                ) => {
                    expect(name).to.eq("request");
                    const originalFn: Cypress.CommandOriginalFn<"request"> = () => {
                        return secondChainable;
                    };
                    fn.call({} as Mocha.Context, originalFn, test.request);
                }
            );
            await import("./commands");
            expect(stubbedEnqueue).to.have.been.calledTwice;
            expect(stubbedEnqueue.getCall(0).args).to.deep.eq([
                tasks.PluginTask.OUTGOING_REQUEST,
                test.expectedFilenames[0],
                test.request,
            ]);
            expect(stubbedEnqueue.getCall(1).args).to.deep.eq([
                tasks.PluginTask.INCOMING_RESPONSE,
                test.expectedFilenames[1],
                test.response,
            ]);
        });
    }
});
