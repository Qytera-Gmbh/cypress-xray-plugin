import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { RunResult as RunResult_V12 } from "../../types/cypress/12.0.0/api";
import { RunResult as RunResult_V13 } from "../../types/cypress/13.0.0/api";
import { Status } from "../../types/testStatus";
import { getTestRunData_V12, getTestRunData_V13 } from "./runConversion";

chai.use(chaiAsPromised);

describe("the run conversion", () => {
    describe("v12", () => {
        const passedResult: RunResult_V12 = {
            hooks: [],
            reporter: "repotert",
            reporterStats: {},
            stats: {
                suites: 1,
                tests: 1,
                passes: 2,
                pending: 0,
                skipped: 0,
                failures: 0,
                duration: 7740,
                startedAt: "2022-11-28T17:41:12.234Z",
                endedAt: "2022-11-28T17:41:19.974Z",
            },
            shouldUploadVideo: false,
            skippedSpec: false,
            tests: [
                {
                    title: ["xray upload demo", "should look for paragraph elements"],
                    state: "passed",
                    body: 'function(){cy.get("p").should("exist");}',
                    displayError: null,
                    attempts: [
                        {
                            state: "passed",
                            error: null,
                            videoTimestamp: 7910,
                            duration: 244,
                            startedAt: "2022-11-28T17:41:15.091Z",
                            screenshots: [],
                        },
                    ],
                },
            ],
            error: null,
            video: "~/repositories/xray/cypress/videos/example.cy.ts.mp4",
            spec: {
                relativeToCommonRoot: "example.cy.ts",
                name: "cypress/e2e/demo/example.cy.ts",
                relative: "cypress/e2e/demo/example.cy.ts",
                absolute: "~/repositories/xray/cypress/e2e/demo/example.cy.ts",
            },
        };
        const failedResult: RunResult_V12 = {
            hooks: [],
            reporter: "reporter",
            reporterStats: {},
            stats: {
                suites: 1,
                tests: 1,
                passes: 0,
                pending: 0,
                skipped: 0,
                failures: 1,
                duration: 7740,
                startedAt: "2022-11-28T17:41:12.234Z",
                endedAt: "2022-11-28T17:41:19.974Z",
            },
            shouldUploadVideo: false,
            skippedSpec: false,
            tests: [
                {
                    title: ["xray upload demo", "should fail"],
                    state: "failed",
                    body: 'function(){cy.get("span").should("exist");}',
                    displayError:
                        "AssertionError: Timed out retrying after 4000ms: Expected to find element: `span`, but never found it.\n    at Context.eval (webpack:///./cypress/e2e/demo/example.cy.ts:15:23)",
                    attempts: [
                        {
                            state: "failed",
                            error: {
                                name: "AssertionError",
                                message:
                                    "Timed out retrying after 4000ms: Expected to find element: `span`, but never found it.",
                                stack: "at Context.eval (webpack:///./cypress/e2e/demo/example.cy.ts:15:23)",
                            },
                            videoTimestamp: 8345,
                            duration: 4413,
                            startedAt: "2022-11-28T17:41:15.526Z",
                            screenshots: [
                                {
                                    name: "",
                                    takenAt: "2022-11-28T17:41:19.702Z",
                                    path: "./test/resources/turtle.png",
                                    height: 720,
                                    width: 1280,
                                },
                                {
                                    name: "",
                                    takenAt: "2022-11-28T17:43:87.626Z",
                                    path: "./test/resources/turtle.png",
                                    height: 720,
                                    width: 1280,
                                },
                            ],
                        },
                    ],
                },
            ],
            error: null,
            video: "~/repositories/xray/cypress/videos/example.cy.ts.mp4",
            spec: {
                relativeToCommonRoot: "example.cy.ts",
                name: "cypress/e2e/demo/example.cy.ts",
                relative: "cypress/e2e/demo/example.cy.ts",
                absolute: "~/repositories/xray/cypress/e2e/demo/example.cy.ts",
            },
        };
        const invalidResult: RunResult_V12 = {
            hooks: [],
            reporter: "reporter",
            reporterStats: {},
            stats: {
                suites: 1,
                tests: 1,
                passes: 0,
                pending: 0,
                skipped: 0,
                failures: 1,
                duration: 7740,
                startedAt: "2022-11-28T17:41:12.234Z",
                endedAt: "2022-11-28T17:41:19.974Z",
            },
            shouldUploadVideo: false,
            skippedSpec: false,
            tests: [
                {
                    title: ["xray upload demo", "should fail"],
                    state: "failed",
                    body: 'function(){cy.get("span").should("exist");}',
                    displayError:
                        "AssertionError: Timed out retrying after 4000ms: Expected to find element: `span`, but never found it.\n    at Context.eval (webpack:///./cypress/e2e/demo/example.cy.ts:15:23)",
                    attempts: [
                        {
                            state: "broken",
                            error: {
                                name: "AssertionError",
                                message:
                                    "Timed out retrying after 4000ms: Expected to find element: `span`, but never found it.",
                                stack: "at Context.eval (webpack:///./cypress/e2e/demo/example.cy.ts:15:23)",
                            },
                            videoTimestamp: 8345,
                            duration: 4413,
                            startedAt: "2022-11-28T17:41:15.526Z",
                            screenshots: [
                                {
                                    name: "",
                                    takenAt: "2022-11-28T17:41:19.702Z",
                                    path: "./test/resources/turtle.png",
                                    height: 720,
                                    width: 1280,
                                },
                            ],
                        },
                    ],
                },
            ],
            error: null,
            video: "~/repositories/xray/cypress/videos/example.cy.ts.mp4",
            spec: {
                relativeToCommonRoot: "example.cy.ts",
                name: "cypress/e2e/demo/example.cy.ts",
                relative: "cypress/e2e/demo/example.cy.ts",
                absolute: "~/repositories/xray/cypress/e2e/demo/example.cy.ts",
            },
        };

        it("returns test data for valid runs", async () => {
            const promises = getTestRunData_V12(passedResult);
            const resolvedTestData = await Promise.all(promises);
            expect(resolvedTestData[0]).to.deep.eq({
                duration: 244,
                screenshots: [],
                spec: {
                    filepath: "~/repositories/xray/cypress/e2e/demo/example.cy.ts",
                },
                startedAt: new Date("2022-11-28T17:41:15.091Z"),
                status: Status.PASSED,
                title: "xray upload demo should look for paragraph elements",
            });
        });

        it("includes screenshots in runs", async () => {
            const promises = getTestRunData_V12(failedResult);
            const resolvedTestData = await Promise.all(promises);
            expect(resolvedTestData[0].screenshots).to.deep.eq([
                {
                    filepath: "./test/resources/turtle.png",
                },
                {
                    filepath: "./test/resources/turtle.png",
                },
            ]);
        });

        it("rejects invalid runs", async () => {
            const promises = getTestRunData_V12(invalidResult);
            const resolvedTestData = await Promise.allSettled(promises);
            expect(resolvedTestData[0].status).to.eq("rejected");
            const reason = (resolvedTestData[0] as PromiseRejectedResult).reason as Error;
            expect(reason.message).to.eq("Unknown Cypress test status: broken");
        });
    });

    describe("v13", () => {
        const passedResult: RunResult_V13 = {
            error: null,
            reporter: "spec",
            reporterStats: {
                suites: 1,
                tests: 1,
                passes: 1,
                pending: 0,
                failures: 0,
                start: "2023-09-09T10:59:28.829Z",
                end: "2023-09-09T10:59:31.925Z",
                duration: 3096,
            },
            screenshots: [],
            spec: {
                absolute: "~/Repositories/cypress/85/cypress/e2e/cyp/cypress.spec.cy.ts",
                fileExtension: ".ts",
                fileName: "cypress.spec",
                name: "cypress.spec.cy.ts",
                relative: "cypress/e2e/cyp/cypress.spec.cy.ts",
            },
            stats: {
                duration: 3100,
                endedAt: "2023-09-09T10:59:31.926Z",
                failures: 0,
                passes: 1,
                pending: 0,
                skipped: 0,
                startedAt: "2023-09-09T10:59:28.826Z",
                suites: 1,
                tests: 1,
            },
            tests: [
                {
                    attempts: [{ state: "passed" }],
                    displayError: null,
                    duration: 638,
                    state: "passed",
                    title: ["something", "CYP-237 happens"],
                },
                {
                    attempts: [{ state: "pending" }],
                    displayError: null,
                    duration: 123,
                    state: "pending",
                    title: ["something", "something"],
                },
            ],
            video: null,
        };
        const failedResult: RunResult_V13 = {
            error: null,
            reporter: "spec",
            reporterStats: {
                suites: 1,
                tests: 1,
                passes: 0,
                pending: 0,
                failures: 1,
                start: "2023-09-09T10:59:28.829Z",
                end: "2023-09-09T10:59:31.925Z",
                duration: 3096,
            },
            screenshots: [
                {
                    height: 8,
                    name: "",
                    path: "./test/resources/small CYP-237.png",
                    takenAt: "2023-09-09T10:59:31.366Z",
                    width: 8,
                },
                {
                    height: 16,
                    name: "",
                    path: "./test/resources/manual CYP-237 screenshot.png",
                    takenAt: "2023-09-09T10:59:31.366Z",
                    width: 16,
                },
                {
                    height: 8,
                    name: "",
                    path: "./test/resources/small.png",
                    takenAt: "2023-09-09T10:59:31.366Z",
                    width: 8,
                },
            ],
            spec: {
                absolute: "~/Repositories/cypress/85/cypress/e2e/cyp/cypress.spec.cy.ts",
                fileExtension: ".ts",
                fileName: "cypress.spec",
                name: "cypress.spec.cy.ts",
                relative: "cypress/e2e/cyp/cypress.spec.cy.ts",
            },
            stats: {
                duration: 3100,
                endedAt: "2023-09-09T10:59:31.926Z",
                failures: 0,
                passes: 1,
                pending: 0,
                skipped: 0,
                startedAt: "2023-09-09T10:59:28.826Z",
                suites: 1,
                tests: 1,
            },
            tests: [
                {
                    attempts: [{ state: "failed" }],
                    displayError: null,
                    duration: 638,
                    state: "failed",
                    title: ["something", "CYP-237 happens"],
                },
            ],
            video: null,
        };
        const invalidResult: RunResult_V13 = {
            error: null,
            reporter: "spec",
            reporterStats: {
                suites: 1,
                tests: 1,
                passes: 0,
                pending: 0,
                failures: 1,
                start: "2023-09-09T10:59:28.829Z",
                end: "2023-09-09T10:59:31.925Z",
                duration: 3096,
            },
            screenshots: [
                {
                    height: 8,
                    name: "",
                    path: "./test/resources/small CYP-237.png",
                    takenAt: "2023-09-09T10:59:31.366Z",
                    width: 8,
                },
            ],
            spec: {
                absolute: "~/Repositories/cypress/85/cypress/e2e/cyp/cypress.spec.cy.ts",
                fileExtension: ".ts",
                fileName: "cypress.spec",
                name: "cypress.spec.cy.ts",
                relative: "cypress/e2e/cyp/cypress.spec.cy.ts",
            },
            stats: {
                duration: 3100,
                endedAt: "2023-09-09T10:59:31.926Z",
                failures: 0,
                passes: 1,
                pending: 0,
                skipped: 0,
                startedAt: "2023-09-09T10:59:28.826Z",
                suites: 1,
                tests: 1,
            },
            tests: [
                {
                    attempts: [{ state: "broken" }],
                    displayError: null,
                    duration: 638,
                    state: "broken",
                    title: ["something", "CYP-237 happens"],
                },
            ],
            video: null,
        };

        it("returns test data for valid runs", async () => {
            const promises = getTestRunData_V13(passedResult, "CYP");
            const resolvedTestData = await Promise.all(promises);
            expect(resolvedTestData).to.deep.eq([
                {
                    duration: 638,
                    screenshots: [],
                    spec: {
                        filepath: "~/Repositories/cypress/85/cypress/e2e/cyp/cypress.spec.cy.ts",
                    },
                    startedAt: new Date("2023-09-09T10:59:28.826Z"),
                    status: Status.PASSED,
                    title: "something CYP-237 happens",
                },
                {
                    duration: 123,
                    screenshots: [],
                    spec: {
                        filepath: "~/Repositories/cypress/85/cypress/e2e/cyp/cypress.spec.cy.ts",
                    },
                    startedAt: new Date("2023-09-09T10:59:29.464Z"),
                    status: Status.PENDING,
                    title: "something something",
                },
            ]);
        });

        it("includes relevant screenshots in runs", async () => {
            const promises = getTestRunData_V13(failedResult, "CYP");
            const resolvedTestData = await Promise.all(promises);
            expect(resolvedTestData[0].screenshots).to.deep.eq([
                { filepath: "./test/resources/small CYP-237.png" },
                { filepath: "./test/resources/manual CYP-237 screenshot.png" },
            ]);
        });

        it("rejects invalid runs", async () => {
            const promises = getTestRunData_V13(invalidResult, "CYP");
            const resolvedTestData = await Promise.allSettled(promises);
            expect(resolvedTestData[0].status).to.eq("rejected");
            const reason = (resolvedTestData[0] as PromiseRejectedResult).reason as Error;
            expect(reason.message).to.eq("Unknown Cypress test status: broken");
        });
    });
});
