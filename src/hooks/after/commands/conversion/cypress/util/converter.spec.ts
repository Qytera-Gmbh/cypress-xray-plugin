import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import type { RunResult } from "../../../../../../types/cypress";
import { CypressStatus } from "../../../../../../types/cypress/status";
import { RunConverterLatest, RunConverterV12 } from "./converter";

describe(relative(cwd(), __filename), async () => {
    await describe(RunConverterV12.name, async () => {
        const passedResult: RunResult<"<13"> = {
            error: null,
            hooks: [],
            reporter: "repoter",
            reporterStats: {},
            shouldUploadVideo: false,
            skippedSpec: false,
            spec: {
                absolute: "~/repositories/xray/cypress/e2e/demo/example.cy.ts",
                name: "cypress/e2e/demo/example.cy.ts",
                relative: "cypress/e2e/demo/example.cy.ts",
                relativeToCommonRoot: "example.cy.ts",
            },
            stats: {
                duration: 7740,
                endedAt: "2022-11-28T17:41:19.974Z",
                failures: 0,
                passes: 2,
                pending: 0,
                skipped: 0,
                startedAt: "2022-11-28T17:41:12.234Z",
                suites: 1,
                tests: 1,
            },
            tests: [
                {
                    attempts: [
                        {
                            duration: 244,
                            error: null,
                            screenshots: [],
                            startedAt: "2022-11-28T17:41:15.091Z",
                            state: "passed",
                            videoTimestamp: 7910,
                        },
                    ],
                    body: 'function(){cy.get("p").should("exist");}',
                    displayError: null,
                    state: "passed",
                    title: ["xray upload demo", "should look for paragraph elements"],
                },
            ],
            video: "~/repositories/xray/cypress/videos/example.cy.ts.mp4",
        };
        const failedResult: RunResult<"<13"> = {
            error: null,
            hooks: [],
            reporter: "reporter",
            reporterStats: {},
            shouldUploadVideo: false,
            skippedSpec: false,
            spec: {
                absolute: "~/repositories/xray/cypress/e2e/demo/example.cy.ts",
                name: "cypress/e2e/demo/example.cy.ts",
                relative: "cypress/e2e/demo/example.cy.ts",
                relativeToCommonRoot: "example.cy.ts",
            },
            stats: {
                duration: 7740,
                endedAt: "2022-11-28T17:41:19.974Z",
                failures: 1,
                passes: 0,
                pending: 0,
                skipped: 0,
                startedAt: "2022-11-28T17:41:12.234Z",
                suites: 1,
                tests: 1,
            },
            tests: [
                {
                    attempts: [
                        {
                            duration: 4413,
                            error: {
                                message:
                                    "Timed out retrying after 4000ms: Expected to find element: `span`, but never found it.",
                                name: "AssertionError",
                                stack: "at Context.eval (webpack:///./cypress/e2e/demo/example.cy.ts:15:23)",
                            },
                            screenshots: [
                                {
                                    height: 720,
                                    name: "",
                                    path: "./test/resources/turtle.png",
                                    takenAt: "2022-11-28T17:41:19.702Z",
                                    width: 1280,
                                },
                                {
                                    height: 720,
                                    name: "",
                                    path: "./test/resources/CYP-123 turtle.png",
                                    takenAt: "2022-11-28T17:43:87.626Z",
                                    width: 1280,
                                },
                            ],
                            startedAt: "2022-11-28T17:41:15.526Z",
                            state: "failed",
                            videoTimestamp: 8345,
                        },
                    ],
                    body: 'function(){cy.get("span").should("exist");}',
                    displayError:
                        "AssertionError: Timed out retrying after 4000ms: Expected to find element: `span`, but never found it.\n    at Context.eval (webpack:///./cypress/e2e/demo/example.cy.ts:15:23)",
                    state: "failed",
                    title: ["CYP-123 xray upload demo", "should fail"],
                },
            ],
            video: "~/repositories/xray/cypress/videos/example.cy.ts.mp4",
        };
        const invalidResult: RunResult<"<13"> = {
            error: null,
            hooks: [],
            reporter: "reporter",
            reporterStats: {},
            shouldUploadVideo: false,
            skippedSpec: false,
            spec: {
                absolute: "~/repositories/xray/cypress/e2e/demo/example.cy.ts",
                name: "cypress/e2e/demo/example.cy.ts",
                relative: "cypress/e2e/demo/example.cy.ts",
                relativeToCommonRoot: "example.cy.ts",
            },
            stats: {
                duration: 7740,
                endedAt: "2022-11-28T17:41:19.974Z",
                failures: 1,
                passes: 0,
                pending: 0,
                skipped: 0,
                startedAt: "2022-11-28T17:41:12.234Z",
                suites: 1,
                tests: 1,
            },
            tests: [
                {
                    attempts: [
                        {
                            duration: 4413,
                            error: {
                                message:
                                    "Timed out retrying after 4000ms: Expected to find element: `span`, but never found it.",
                                name: "AssertionError",
                                stack: "at Context.eval (webpack:///./cypress/e2e/demo/example.cy.ts:15:23)",
                            },
                            screenshots: [
                                {
                                    height: 720,
                                    name: "",
                                    path: "./test/resources/turtle.png",
                                    takenAt: "2022-11-28T17:41:19.702Z",
                                    width: 1280,
                                },
                            ],
                            startedAt: "2022-11-28T17:41:15.526Z",
                            state: "broken",
                            videoTimestamp: 8345,
                        },
                    ],
                    body: 'function(){cy.get("span").should("exist");}',
                    displayError:
                        "AssertionError: Timed out retrying after 4000ms: Expected to find element: `span`, but never found it.\n    at Context.eval (webpack:///./cypress/e2e/demo/example.cy.ts:15:23)",
                    state: "failed",
                    title: ["xray upload demo", "should fail"],
                },
            ],
            video: "~/repositories/xray/cypress/videos/example.cy.ts.mp4",
        };
        const retriedResult: RunResult<"<13"> = {
            error: null,
            hooks: [],
            reporter: "spec",
            reporterStats: {
                duration: 2406,
                end: "2025-02-28T22:08:44.903Z",
                failures: 1,
                passes: 2,
                pending: 0,
                start: "2025-02-28T22:08:42.497Z",
                suites: 1,
                tests: 3,
            },
            shouldUploadVideo: true,
            skippedSpec: false,
            spec: {
                absolute: "/home/csvtuda/repositories/cypress/451/cypress/e2e/spec.cy.js",
                name: "cypress/e2e/spec.cy.js",
                relative: "cypress/e2e/spec.cy.js",
                relativeToCommonRoot: "spec.cy.js",
            },
            stats: {
                duration: 2404,
                endedAt: "2025-02-28T22:08:44.899Z",
                failures: 1,
                passes: 2,
                pending: 0,
                skipped: 0,
                startedAt: "2025-02-28T22:08:42.495Z",
                suites: 1,
                tests: 3,
            },
            tests: [
                {
                    attempts: [
                        {
                            duration: 329,
                            error: {
                                message: "expected 0 to equal 5",
                                name: "AssertionError",
                                stack: "    at Context.eval (webpack://451/./cypress/e2e/spec.cy.js:3:36)",
                            },
                            screenshots: [
                                {
                                    height: 720,
                                    name: "null",
                                    path: "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed).png",
                                    takenAt: "2025-02-28T22:08:42.565Z",
                                    width: 1280,
                                },
                            ],
                            startedAt: "2025-02-28T22:08:42.502Z",
                            state: "failed",
                            videoTimestamp: 4094,
                        },
                        {
                            duration: 492,
                            error: {
                                message: "expected 1 to equal 5",
                                name: "AssertionError",
                                stack: "    at Context.eval (webpack://451/./cypress/e2e/spec.cy.js:3:36)",
                            },
                            screenshots: [
                                {
                                    height: 720,
                                    name: "null",
                                    path: "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed) (attempt 2).png",
                                    takenAt: "2025-02-28T22:08:42.920Z",
                                    width: 1280,
                                },
                            ],
                            startedAt: "2025-02-28T22:08:42.870Z",
                            state: "failed",
                            videoTimestamp: 4462,
                        },
                        {
                            duration: 220,
                            error: {
                                message: "expected 2 to equal 5",
                                name: "AssertionError",
                                stack: "    at Context.eval (webpack://451/./cypress/e2e/spec.cy.js:3:36)",
                            },
                            screenshots: [
                                {
                                    height: 720,
                                    name: "null",
                                    path: "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed) (attempt 3).png",
                                    takenAt: "2025-02-28T22:08:43.447Z",
                                    width: 1280,
                                },
                            ],
                            startedAt: "2025-02-28T22:08:43.380Z",
                            state: "failed",
                            videoTimestamp: 4972,
                        },
                        {
                            duration: 210,
                            error: {
                                message: "expected 3 to equal 5",
                                name: "AssertionError",
                                stack: "    at Context.eval (webpack://451/./cypress/e2e/spec.cy.js:3:36)",
                            },
                            screenshots: [
                                {
                                    height: 720,
                                    name: "null",
                                    path: "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed) (attempt 4).png",
                                    takenAt: "2025-02-28T22:08:43.681Z",
                                    width: 1280,
                                },
                            ],
                            startedAt: "2025-02-28T22:08:43.621Z",
                            state: "failed",
                            videoTimestamp: 5213,
                        },
                        {
                            duration: 225,
                            error: {
                                message: "expected 4 to equal 5",
                                name: "AssertionError",
                                stack: "    at Context.eval (webpack://451/./cypress/e2e/spec.cy.js:3:36)",
                            },
                            screenshots: [
                                {
                                    height: 720,
                                    name: "null",
                                    path: "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed) (attempt 5).png",
                                    takenAt: "2025-02-28T22:08:43.933Z",
                                    width: 1280,
                                },
                            ],
                            startedAt: "2025-02-28T22:08:43.857Z",
                            state: "failed",
                            videoTimestamp: 5449,
                        },
                        {
                            duration: 85,
                            error: null,
                            screenshots: [],
                            startedAt: "2025-02-28T22:08:44.112Z",
                            state: "passed",
                            videoTimestamp: 5704,
                        },
                    ],
                    body: "() => {\n    expect(Cypress.currentRetry).to.eq(5);\n  }",
                    displayError: null,
                    state: "passed",
                    title: ["template spec", "CYP-123 passes eventually"],
                },
                {
                    attempts: [
                        {
                            duration: 176,
                            error: {
                                message: "expected true to be false",
                                name: "AssertionError",
                                stack: "    at Context.eval (webpack://451/./cypress/e2e/spec.cy.js:7:23)",
                            },
                            screenshots: [
                                {
                                    height: 720,
                                    name: "null",
                                    path: "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-456 split test (failed).png",
                                    takenAt: "2025-02-28T22:08:44.231Z",
                                    width: 1280,
                                },
                            ],
                            startedAt: "2025-02-28T22:08:44.202Z",
                            state: "failed",
                            videoTimestamp: 5794,
                        },
                        {
                            duration: 244,
                            error: {
                                message: "expected true to be false",
                                name: "AssertionError",
                                stack: "    at Context.eval (webpack://451/./cypress/e2e/spec.cy.js:7:23)",
                            },
                            screenshots: [
                                {
                                    height: 720,
                                    name: "null",
                                    path: "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-456 split test (failed) (attempt 2).png",
                                    takenAt: "2025-02-28T22:08:44.426Z",
                                    width: 1280,
                                },
                            ],
                            startedAt: "2025-02-28T22:08:44.387Z",
                            state: "failed",
                            videoTimestamp: 5979,
                        },
                        {
                            duration: 202,
                            error: {
                                message: "expected true to be false",
                                name: "AssertionError",
                                stack: "    at Context.eval (webpack://451/./cypress/e2e/spec.cy.js:7:23)",
                            },
                            screenshots: [
                                {
                                    height: 720,
                                    name: "null",
                                    path: "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-456 split test (failed) (attempt 3).png",
                                    takenAt: "2025-02-28T22:08:44.688Z",
                                    width: 1280,
                                },
                            ],
                            startedAt: "2025-02-28T22:08:44.644Z",
                            state: "failed",
                            videoTimestamp: 6236,
                        },
                    ],
                    body: "() => {\n    expect(true).to.be.false;\n  }",
                    displayError:
                        "AssertionError: expected true to be false\n    at Context.eval (webpack://451/./cypress/e2e/spec.cy.js:7:23)",
                    state: "failed",
                    title: ["template spec", "CYP-456 split test"],
                },
                {
                    attempts: [
                        {
                            duration: 31,
                            error: null,
                            screenshots: [
                                {
                                    height: 720,
                                    name: "null",
                                    path: "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-456 split test manual screenshot.png",
                                    takenAt: "2025-02-28T22:08:44.879Z",
                                    width: 1280,
                                },
                            ],
                            startedAt: "2025-02-28T22:08:44.867Z",
                            state: "passed",
                            videoTimestamp: 6459,
                        },
                    ],
                    body: "() => {\n    expect(true).to.be.true;\n  }",
                    displayError: null,
                    state: "passed",
                    title: ["template spec", "CYP-456 split test"],
                },
            ],
            video: "/home/csvtuda/repositories/cypress/451/cypress/videos/spec.cy.js.mp4",
        };
        const unkeyedResult: RunResult<"<13"> = {
            error: null,
            hooks: [],
            reporter: "repoter",
            reporterStats: {},
            shouldUploadVideo: false,
            skippedSpec: false,
            spec: {
                absolute: "~/repositories/xray/cypress/e2e/demo/example.cy.ts",
                name: "cypress/e2e/demo/example.cy.ts",
                relative: "cypress/e2e/demo/example.cy.ts",
                relativeToCommonRoot: "example.cy.ts",
            },
            stats: {
                duration: 7740,
                endedAt: "2022-11-28T17:41:19.974Z",
                failures: 0,
                passes: 2,
                pending: 0,
                skipped: 0,
                startedAt: "2022-11-28T17:41:12.234Z",
                suites: 1,
                tests: 1,
            },
            tests: [
                {
                    attempts: [
                        {
                            duration: 244,
                            error: null,
                            screenshots: [],
                            startedAt: "2022-11-28T17:41:15.091Z",
                            state: "passed",
                            videoTimestamp: 7910,
                        },
                    ],
                    body: 'function(){cy.get("p").should("exist");}',
                    displayError: null,
                    state: "passed",
                    title: ["xray upload demo", "should look for paragraph elements"],
                },
            ],
            video: "~/repositories/xray/cypress/videos/example.cy.ts.mp4",
        };

        await it("returns test data for valid runs", () => {
            const converter = new RunConverterV12("CYP", [passedResult]);
            const conversions = converter.getConversions({ onlyLastAttempt: false });
            assert.deepStrictEqual(conversions, [
                {
                    duration: 244,
                    issueKey: null,
                    kind: "success",
                    spec: {
                        filepath: "~/repositories/xray/cypress/e2e/demo/example.cy.ts",
                    },
                    startedAt: new Date("2022-11-28T17:41:15.091Z"),
                    status: CypressStatus.PASSED,
                    title: "xray upload demo should look for paragraph elements",
                },
            ]);
        });

        await it("omits retries", () => {
            const converter = new RunConverterV12("CYP", [retriedResult]);
            const conversions = converter.getConversions({ onlyLastAttempt: true });
            assert.deepStrictEqual(conversions, [
                {
                    duration: 85,
                    issueKey: "CYP-123",
                    kind: "success",
                    spec: {
                        filepath: "/home/csvtuda/repositories/cypress/451/cypress/e2e/spec.cy.js",
                    },
                    startedAt: new Date("2025-02-28T22:08:44.112Z"),
                    status: "passed",
                    title: "template spec CYP-123 passes eventually",
                },
                {
                    duration: 202,
                    issueKey: "CYP-456",
                    kind: "success",
                    spec: {
                        filepath: "/home/csvtuda/repositories/cypress/451/cypress/e2e/spec.cy.js",
                    },
                    startedAt: new Date("2025-02-28T22:08:44.644Z"),
                    status: "failed",
                    title: "template spec CYP-456 split test",
                },
                {
                    duration: 31,
                    issueKey: "CYP-456",
                    kind: "success",
                    spec: {
                        filepath: "/home/csvtuda/repositories/cypress/451/cypress/e2e/spec.cy.js",
                    },
                    startedAt: new Date("2025-02-28T22:08:44.867Z"),
                    status: "passed",
                    title: "template spec CYP-456 split test",
                },
            ]);
        });

        await it("includes screenshots in runs", () => {
            const converter = new RunConverterV12("CYP", [failedResult]);
            const screenshots = converter.getScreenshots("CYP-123", { onlyLastAttempt: false });
            assert.deepStrictEqual(screenshots, [
                "./test/resources/turtle.png",
                "./test/resources/CYP-123 turtle.png",
            ]);
        });

        await it("includes screenshots of retries", () => {
            const converter = new RunConverterV12("CYP", [retriedResult]);
            const screenshots = converter.getScreenshots("CYP-123", { onlyLastAttempt: false });
            assert.deepStrictEqual(screenshots, [
                "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed).png",
                "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed) (attempt 2).png",
                "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed) (attempt 3).png",
                "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed) (attempt 4).png",
                "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed) (attempt 5).png",
            ]);
        });

        await it("omits screenshots of retries", () => {
            const converter = new RunConverterV12("CYP", [retriedResult]);
            const screenshots = converter.getScreenshots("CYP-456", { onlyLastAttempt: true });
            assert.deepStrictEqual(screenshots, [
                "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-456 split test (failed) (attempt 3).png",
                "/home/csvtuda/repositories/cypress/451/cypress/screenshots/spec.cy.js/template spec -- CYP-456 split test manual screenshot.png",
            ]);
        });

        await it("does not return non-attributable screenshots", () => {
            const converter = new RunConverterV12("CYP", [retriedResult]);
            const screenshots = converter.getNonAttributableScreenshots();
            assert.deepStrictEqual(screenshots, []);
        });

        await it("does not return screenshots of unkeyed tests", () => {
            const converter = new RunConverterV12("CYP", [unkeyedResult]);
            const screenshots = converter.getScreenshots("CYP-123", { onlyLastAttempt: false });
            assert.deepStrictEqual(screenshots, []);
        });

        await it("rejects invalid runs", () => {
            const converter = new RunConverterV12("CYP", [invalidResult]);
            const conversions = converter.getConversions({ onlyLastAttempt: false });
            assert.strictEqual(conversions[0].kind, "error");
            const reason = conversions[0].error as Error;
            assert.strictEqual(reason.message, "Unknown Cypress test status: broken");
        });
    });

    await describe(RunConverterLatest.name, async () => {
        const passedResult: CypressCommandLine.RunResult = {
            error: null,
            reporter: "spec",
            reporterStats: {
                duration: 3096,
                end: "2023-09-09T10:59:31.925Z",
                failures: 0,
                passes: 1,
                pending: 0,
                start: "2023-09-09T10:59:28.829Z",
                suites: 1,
                tests: 1,
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
        const failedResult: CypressCommandLine.RunResult = {
            error: null,
            reporter: "spec",
            reporterStats: {
                duration: 3096,
                end: "2023-09-09T10:59:31.925Z",
                failures: 1,
                passes: 0,
                pending: 0,
                start: "2023-09-09T10:59:28.829Z",
                suites: 1,
                tests: 1,
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
        const invalidResult: CypressCommandLine.RunResult = {
            error: null,
            reporter: "spec",
            reporterStats: {
                duration: 3096,
                end: "2023-09-09T10:59:31.925Z",
                failures: 1,
                passes: 0,
                pending: 0,
                start: "2023-09-09T10:59:28.829Z",
                suites: 1,
                tests: 1,
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
        const retriedResult: CypressCommandLine.RunResult = {
            error: null,
            reporter: "spec",
            reporterStats: {
                duration: 1597,
                end: "2025-03-08T00:37:48.293Z",
                failures: 1,
                passes: 1,
                pending: 0,
                start: "2025-03-08T00:37:46.696Z",
                suites: 1,
                tests: 2,
            },
            screenshots: [
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot.png",
                    takenAt: "2025-03-08T00:55:58.120Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed).png",
                    takenAt: "2025-03-08T00:55:58.480Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 2).png",
                    takenAt: "2025-03-08T00:55:58.807Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed) (attempt 2).png",
                    takenAt: "2025-03-08T00:55:59.030Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 3).png",
                    takenAt: "2025-03-08T00:55:59.432Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed) (attempt 3).png",
                    takenAt: "2025-03-08T00:55:59.660Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 4).png",
                    takenAt: "2025-03-08T00:55:59.984Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed) (attempt 4).png",
                    takenAt: "2025-03-08T00:56:00.183Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 5).png",
                    takenAt: "2025-03-08T00:56:00.476Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually (failed) (attempt 5).png",
                    takenAt: "2025-03-08T00:56:00.690Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 6).png",
                    takenAt: "2025-03-08T00:56:01.021Z",
                    width: 1000,
                },
                {
                    height: 660,
                    name: "CYP-456 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-456 my screenshot.png",
                    takenAt: "2025-03-08T00:56:01.305Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-456 manual screenshot (failed).png",
                    takenAt: "2025-03-08T00:56:01.556Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-456 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-456 my screenshot (attempt 2).png",
                    takenAt: "2025-03-08T00:56:01.842Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-456 manual screenshot (failed) (attempt 2).png",
                    takenAt: "2025-03-08T00:56:02.067Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-456 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-456 my screenshot (attempt 3).png",
                    takenAt: "2025-03-08T00:56:02.344Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-456 manual screenshot (failed) (attempt 3).png",
                    takenAt: "2025-03-08T00:56:02.572Z",
                    width: 1280,
                },
            ],
            spec: {
                absolute: "/home/csvtuda/repositories/cypress/cloud/spec.cy.js",
                fileExtension: ".js",
                fileName: "spec",
                name: "spec.cy.js",
                relative: "spec.cy.js",
            },
            stats: {
                duration: 1600,
                endedAt: "2025-03-08T00:37:48.291Z",
                failures: 1,
                passes: 1,
                pending: 0,
                skipped: 0,
                startedAt: "2025-03-08T00:37:46.691Z",
                suites: 1,
                tests: 2,
            },
            tests: [
                {
                    attempts: [
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "passed" },
                    ],
                    displayError: null,
                    duration: 1145,
                    state: "passed",
                    title: ["template spec", "CYP-123 passes eventually"],
                },
                {
                    attempts: [{ state: "failed" }, { state: "failed" }, { state: "failed" }],
                    displayError:
                        "AssertionError: expected true to be false\n    at captureUserInvocationStack (http://localhost:63785/__cypress/runner/cypress_runner.js:138199:94)\n    at Assertion.assert (http://localhost:63785/__cypress/runner/cypress_runner.js:138227:9)\n    at Assertion.<anonymous> (http://localhost:63785/__cypress/runner/cypress_runner.js:79493:10)\n    at Assertion.propertyGetter (http://localhost:63785/__cypress/runner/cypress_runner.js:77567:29)\nat Reflect.get (<anonymous>)\n    at Object.proxyGetter [as get] (http://localhost:63785/__cypress/runner/cypress_runner.js:77851:22)\n    at Context.eval (webpack://integration-test/./spec.cy.js:8:27)",
                    duration: 398,
                    state: "failed",
                    title: ["template spec", "CYP-456 manual screenshot"],
                },
            ],
            video: null,
        };
        const retriedIteratedResult: CypressCommandLine.RunResult = {
            error: null,
            reporter: "spec",
            reporterStats: {
                duration: 13024,
                end: "2025-03-08T02:53:19.555Z",
                failures: 1,
                passes: 4,
                pending: 0,
                start: "2025-03-08T02:53:06.531Z",
                suites: 1,
                tests: 5,
            },
            screenshots: [
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot.png",
                    takenAt: "2025-03-08T02:53:06.571Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 1 (failed).png",
                    takenAt: "2025-03-08T02:53:06.873Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 2).png",
                    takenAt: "2025-03-08T02:53:07.204Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 1 (failed) (attempt 2).png",
                    takenAt: "2025-03-08T02:53:07.423Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 3).png",
                    takenAt: "2025-03-08T02:53:07.843Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 1 (failed) (attempt 3).png",
                    takenAt: "2025-03-08T02:53:08.056Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 4).png",
                    takenAt: "2025-03-08T02:53:08.340Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 1 (failed) (attempt 4).png",
                    takenAt: "2025-03-08T02:53:08.560Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 5).png",
                    takenAt: "2025-03-08T02:53:08.873Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 1 (failed) (attempt 5).png",
                    takenAt: "2025-03-08T02:53:09.100Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 6).png",
                    takenAt: "2025-03-08T02:53:09.429Z",
                    width: 1000,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (1).png",
                    takenAt: "2025-03-08T02:53:09.751Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 2 (failed).png",
                    takenAt: "2025-03-08T02:53:09.990Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 2) (1).png",
                    takenAt: "2025-03-08T02:53:10.220Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 2 (failed) (attempt 2).png",
                    takenAt: "2025-03-08T02:53:10.436Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 3) (1).png",
                    takenAt: "2025-03-08T02:53:10.723Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 2 (failed) (attempt 3).png",
                    takenAt: "2025-03-08T02:53:10.938Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 4) (1).png",
                    takenAt: "2025-03-08T02:53:11.254Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 2 (failed) (attempt 4).png",
                    takenAt: "2025-03-08T02:53:11.478Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 5) (1).png",
                    takenAt: "2025-03-08T02:53:11.787Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 2 (failed) (attempt 5).png",
                    takenAt: "2025-03-08T02:53:12.014Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 6) (1).png",
                    takenAt: "2025-03-08T02:53:12.328Z",
                    width: 1000,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (2).png",
                    takenAt: "2025-03-08T02:53:12.630Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 3 (failed).png",
                    takenAt: "2025-03-08T02:53:12.854Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 2) (2).png",
                    takenAt: "2025-03-08T02:53:13.100Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 3 (failed) (attempt 2).png",
                    takenAt: "2025-03-08T02:53:13.315Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 3) (2).png",
                    takenAt: "2025-03-08T02:53:13.594Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 3 (failed) (attempt 3).png",
                    takenAt: "2025-03-08T02:53:13.792Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 4) (2).png",
                    takenAt: "2025-03-08T02:53:14.093Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 3 (failed) (attempt 4).png",
                    takenAt: "2025-03-08T02:53:14.315Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 5) (2).png",
                    takenAt: "2025-03-08T02:53:14.603Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 3 (failed) (attempt 5).png",
                    takenAt: "2025-03-08T02:53:14.820Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 6) (2).png",
                    takenAt: "2025-03-08T02:53:15.108Z",
                    width: 1000,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (3).png",
                    takenAt: "2025-03-08T02:53:15.382Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 4 (failed).png",
                    takenAt: "2025-03-08T02:53:15.614Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 2) (3).png",
                    takenAt: "2025-03-08T02:53:15.884Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 4 (failed) (attempt 2).png",
                    takenAt: "2025-03-08T02:53:16.090Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 3) (3).png",
                    takenAt: "2025-03-08T02:53:16.357Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 4 (failed) (attempt 3).png",
                    takenAt: "2025-03-08T02:53:16.576Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 4) (3).png",
                    takenAt: "2025-03-08T02:53:16.880Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 4 (failed) (attempt 4).png",
                    takenAt: "2025-03-08T02:53:17.102Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 5) (3).png",
                    takenAt: "2025-03-08T02:53:17.390Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-123 passes eventually 4 (failed) (attempt 5).png",
                    takenAt: "2025-03-08T02:53:17.606Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-123 my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 6) (3).png",
                    takenAt: "2025-03-08T02:53:17.902Z",
                    width: 1000,
                },
                {
                    height: 660,
                    name: "CYP-456 my other screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-456 my other screenshot.png",
                    takenAt: "2025-03-08T02:53:18.175Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-456 manual screenshot (failed).png",
                    takenAt: "2025-03-08T02:53:18.381Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-456 my other screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-456 my other screenshot (attempt 2).png",
                    takenAt: "2025-03-08T02:53:18.639Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-456 manual screenshot (failed) (attempt 2).png",
                    takenAt: "2025-03-08T02:53:18.843Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "CYP-456 my other screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-456 my other screenshot (attempt 3).png",
                    takenAt: "2025-03-08T02:53:19.107Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-456 manual screenshot (failed) (attempt 3).png",
                    takenAt: "2025-03-08T02:53:19.301Z",
                    width: 1280,
                },
            ],
            spec: {
                absolute:
                    "C:/Users/Sebastian/Documents/Repositories/cypress-xray-plugin/test/integration/upload-last-attempt/cloud/spec.cy.js",
                fileExtension: ".js",
                fileName: "spec",
                name: "spec.cy.js",
                relative: "spec.cy.js",
            },
            stats: {
                duration: 13026,
                endedAt: "2025-03-08T02:53:19.552Z",
                failures: 1,
                passes: 4,
                pending: 0,
                skipped: 0,
                startedAt: "2025-03-08T02:53:06.526Z",
                suites: 1,
                tests: 5,
            },
            tests: [
                {
                    attempts: [
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "passed" },
                    ],
                    displayError: null,
                    duration: 3163,
                    state: "passed",
                    title: ["template spec", "CYP-123 passes eventually: 1"],
                },
                {
                    attempts: [
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "passed" },
                    ],
                    displayError: null,
                    duration: 2836,
                    state: "passed",
                    title: ["template spec", "CYP-123 passes eventually: 2"],
                },
                {
                    attempts: [
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "passed" },
                    ],
                    displayError: null,
                    duration: 2741,
                    state: "passed",
                    title: ["template spec", "CYP-123 passes eventually: 3"],
                },
                {
                    attempts: [
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "passed" },
                    ],
                    displayError: null,
                    duration: 2766,
                    state: "passed",
                    title: ["template spec", "CYP-123 passes eventually: 4"],
                },
                {
                    attempts: [{ state: "failed" }, { state: "failed" }, { state: "failed" }],
                    displayError:
                        "AssertionError: expected true to be false\n    at captureUserInvocationStack (http://localhost:50701/__cypress/runner/cypress_runner.js:138199:94)\n    at Assertion.assert (http://localhost:50701/__cypress/runner/cypress_runner.js:138227:9)\n    at Assertion.<anonymous> (http://localhost:50701/__cypress/runner/cypress_runner.js:79493:10)\n    at Assertion.propertyGetter (http://localhost:50701/__cypress/runner/cypress_runner.js:77567:29)\nat Reflect.get (<anonymous>)\n    at Object.proxyGetter [as get] (http://localhost:50701/__cypress/runner/cypress_runner.js:77851:22)\n    at Context.eval (webpack://integration-test/./spec.cy.js:11:41)\n    at getRet (http://localhost:50701/__cypress/runner/cypress_runner.js:118320:20)\n    at tryCatcher (http://localhost:50701/__cypress/runner/cypress_runner.js:1777:23)\n    at Promise.attempt.Promise.try (http://localhost:50701/__cypress/runner/cypress_runner.js:4285:29)",
                    duration: 1389,
                    state: "failed",
                    title: ["template spec", "CYP-456 manual screenshot"],
                },
            ],
            video: null,
        };
        const unkeyedResult: CypressCommandLine.RunResult = {
            error: null,
            reporter: "spec",
            reporterStats: {
                duration: 1597,
                end: "2025-03-08T00:37:48.293Z",
                failures: 1,
                passes: 1,
                pending: 0,
                start: "2025-03-08T00:37:46.696Z",
                suites: 1,
                tests: 2,
            },
            screenshots: [
                {
                    height: 660,
                    name: "my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my screenshot.png",
                    takenAt: "2025-03-08T00:55:58.120Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- passes eventually (failed).png",
                    takenAt: "2025-03-08T00:55:58.480Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my screenshot (attempt 2).png",
                    takenAt: "2025-03-08T00:55:58.807Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- passes eventually (failed) (attempt 2).png",
                    takenAt: "2025-03-08T00:55:59.030Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my screenshot (attempt 3).png",
                    takenAt: "2025-03-08T00:55:59.432Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- passes eventually (failed) (attempt 3).png",
                    takenAt: "2025-03-08T00:55:59.660Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my screenshot (attempt 4).png",
                    takenAt: "2025-03-08T00:55:59.984Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- passes eventually (failed) (attempt 4).png",
                    takenAt: "2025-03-08T00:56:00.183Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my screenshot (attempt 5).png",
                    takenAt: "2025-03-08T00:56:00.476Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- passes eventually (failed) (attempt 5).png",
                    takenAt: "2025-03-08T00:56:00.690Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my screenshot (attempt 6).png",
                    takenAt: "2025-03-08T00:56:01.021Z",
                    width: 1000,
                },
                {
                    height: 660,
                    name: "my screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my other screenshot.png",
                    takenAt: "2025-03-08T00:56:01.305Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- manual screenshot (failed).png",
                    takenAt: "2025-03-08T00:56:01.556Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "my other screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my other screenshot (attempt 2).png",
                    takenAt: "2025-03-08T00:56:01.842Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- manual screenshot (failed) (attempt 2).png",
                    takenAt: "2025-03-08T00:56:02.067Z",
                    width: 1280,
                },
                {
                    height: 660,
                    name: "my other screenshot",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my other screenshot (attempt 3).png",
                    takenAt: "2025-03-08T00:56:02.344Z",
                    width: 1000,
                },
                {
                    height: 720,
                    name: "null",
                    path: "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- manual screenshot (failed) (attempt 3).png",
                    takenAt: "2025-03-08T00:56:02.572Z",
                    width: 1280,
                },
            ],
            spec: {
                absolute: "/home/csvtuda/repositories/cypress/cloud/spec.cy.js",
                fileExtension: ".js",
                fileName: "spec",
                name: "spec.cy.js",
                relative: "spec.cy.js",
            },
            stats: {
                duration: 1600,
                endedAt: "2025-03-08T00:37:48.291Z",
                failures: 1,
                passes: 1,
                pending: 0,
                skipped: 0,
                startedAt: "2025-03-08T00:37:46.691Z",
                suites: 1,
                tests: 2,
            },
            tests: [
                {
                    attempts: [
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "failed" },
                        { state: "passed" },
                    ],
                    displayError: null,
                    duration: 1145,
                    state: "passed",
                    title: ["template spec", "passes eventually"],
                },
                {
                    attempts: [{ state: "failed" }, { state: "failed" }, { state: "failed" }],
                    displayError:
                        "AssertionError: expected true to be false\n    at captureUserInvocationStack (http://localhost:63785/__cypress/runner/cypress_runner.js:138199:94)\n    at Assertion.assert (http://localhost:63785/__cypress/runner/cypress_runner.js:138227:9)\n    at Assertion.<anonymous> (http://localhost:63785/__cypress/runner/cypress_runner.js:79493:10)\n    at Assertion.propertyGetter (http://localhost:63785/__cypress/runner/cypress_runner.js:77567:29)\nat Reflect.get (<anonymous>)\n    at Object.proxyGetter [as get] (http://localhost:63785/__cypress/runner/cypress_runner.js:77851:22)\n    at Context.eval (webpack://integration-test/./spec.cy.js:8:27)",
                    duration: 398,
                    state: "failed",
                    title: ["template spec", "manual screenshot"],
                },
            ],
            video: null,
        };

        await it("returns test data for valid runs", () => {
            const converter = new RunConverterLatest("CYP", [passedResult]);
            const conversions = converter.getConversions({ onlyLastAttempt: false });
            assert.deepStrictEqual(conversions, [
                {
                    duration: 638,
                    issueKey: "CYP-237",
                    kind: "success",
                    spec: {
                        filepath: "~/Repositories/cypress/85/cypress/e2e/cyp/cypress.spec.cy.ts",
                    },
                    startedAt: new Date("2023-09-09T10:59:28.826Z"),
                    status: CypressStatus.PASSED,
                    title: "something CYP-237 happens",
                },
                {
                    duration: 123,
                    issueKey: null,
                    kind: "success",
                    spec: {
                        filepath: "~/Repositories/cypress/85/cypress/e2e/cyp/cypress.spec.cy.ts",
                    },
                    startedAt: new Date("2023-09-09T10:59:29.464Z"),
                    status: CypressStatus.PENDING,
                    title: "something something",
                },
            ]);
        });

        await it("omits retries", () => {
            const converter = new RunConverterLatest("CYP", [retriedResult]);
            const conversions = converter.getConversions({ onlyLastAttempt: true });
            assert.deepStrictEqual(conversions, [
                {
                    duration: 1145,
                    issueKey: "CYP-123",
                    kind: "success",
                    spec: {
                        filepath: "/home/csvtuda/repositories/cypress/cloud/spec.cy.js",
                    },
                    startedAt: new Date("2025-03-08T00:37:46.691Z"),
                    status: "passed",
                    title: "template spec CYP-123 passes eventually",
                },
                {
                    duration: 398,
                    issueKey: "CYP-456",
                    kind: "success",
                    spec: {
                        filepath: "/home/csvtuda/repositories/cypress/cloud/spec.cy.js",
                    },
                    startedAt: new Date("2025-03-08T00:37:47.836Z"),
                    status: "failed",
                    title: "template spec CYP-456 manual screenshot",
                },
            ]);
        });

        await it("includes relevant screenshots in runs", () => {
            const converter = new RunConverterLatest("CYP", [failedResult]);
            const screenshots = converter.getScreenshots("CYP-237", { onlyLastAttempt: false });
            assert.deepStrictEqual(screenshots, [
                "./test/resources/small CYP-237.png",
                "./test/resources/manual CYP-237 screenshot.png",
            ]);
        });

        await it("omits screenshots of retries", () => {
            const converter = new RunConverterLatest("CYP", [retriedResult]);
            assert.deepStrictEqual(converter.getScreenshots("CYP-123", { onlyLastAttempt: true }), [
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (attempt 6).png",
            ]);
            assert.deepStrictEqual(converter.getScreenshots("CYP-456", { onlyLastAttempt: true }), [
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-456 my screenshot (attempt 3).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- CYP-456 manual screenshot (failed) (attempt 3).png",
            ]);
        });

        await it("omits screenshots of iterated retries", () => {
            const converter = new RunConverterLatest("CYP", [retriedIteratedResult]);
            assert.deepStrictEqual(converter.getScreenshots("CYP-123", { onlyLastAttempt: true }), [
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot.png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (1).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (2).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/CYP-123 my screenshot (3).png",
            ]);
        });

        await it("returns all non-attributable screenshots", () => {
            const converter = new RunConverterLatest("CYP", [unkeyedResult]);
            const screenshots = converter.getNonAttributableScreenshots({ onlyLastAttempt: false });
            assert.deepStrictEqual(screenshots, [
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my screenshot.png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- passes eventually (failed).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my screenshot (attempt 2).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- passes eventually (failed) (attempt 2).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my screenshot (attempt 3).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- passes eventually (failed) (attempt 3).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my screenshot (attempt 4).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- passes eventually (failed) (attempt 4).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my screenshot (attempt 5).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- passes eventually (failed) (attempt 5).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my screenshot (attempt 6).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my other screenshot.png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- manual screenshot (failed).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my other screenshot (attempt 2).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- manual screenshot (failed) (attempt 2).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my other screenshot (attempt 3).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- manual screenshot (failed) (attempt 3).png",
            ]);
        });

        await it("returns non-attributable screenshots of last attempts only", () => {
            const converter = new RunConverterLatest("CYP", [unkeyedResult]);
            const screenshots = converter.getNonAttributableScreenshots({ onlyLastAttempt: true });
            assert.deepStrictEqual(screenshots, [
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my screenshot (attempt 6).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/my other screenshot (attempt 3).png",
                "/home/csvtuda/repositories/cypress/screenshots/spec.cy.js/template spec -- manual screenshot (failed) (attempt 3).png",
            ]);
        });

        await it("rejects invalid runs", () => {
            const converter = new RunConverterLatest("CYP", [invalidResult]);
            const conversions = converter.getConversions({ onlyLastAttempt: false });
            assert.strictEqual(conversions[0].kind, "error");
            const reason = conversions[0].error as Error;
            assert.strictEqual(reason.message, "Unknown Cypress test status: broken");
        });
    });
});
