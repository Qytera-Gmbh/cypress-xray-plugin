import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { stub } from "../../../test/mocks";
import { dedent } from "../../util/dedent";
import type { Logger } from "../../util/logging";
import { unknownToString } from "../../util/string";
import cypressResultConversion from "./cypress-result-conversion";

void describe(relative(cwd(), __filename), () => {
    void describe(cypressResultConversion.convertCypressResults.name, () => {
        void describe("<13", () => {
            void it("converts test results into xray results json", () => {
                const result = cypressResultConversion.convertCypressResults({
                    context: {
                        evidence: {
                            getEvidence() {
                                return [];
                            },
                        },
                        iterationParameters: {
                            getIterationParameters() {
                                return {};
                            },
                        },
                        screenshots: [],
                    },
                    cypress: {
                        results: {
                            cypressVersion: "11.1.0",
                            runs: [
                                {
                                    spec: {
                                        absolute:
                                            "/repositories/xray/cypress/e2e/demo/example.cy.ts",
                                        relative: "cypress\\e2e\\demo\\example.cy.ts",
                                    },
                                    tests: [
                                        {
                                            attempts: [
                                                {
                                                    duration: 244,
                                                    screenshots: [],
                                                    startedAt: "2022-11-28T17:41:15.091Z",
                                                    state: "passed",
                                                },
                                            ],
                                            title: [
                                                "cypress xray plugin",
                                                "passing test case with test issue key CYP-40",
                                            ],
                                        },
                                        {
                                            attempts: [
                                                {
                                                    duration: 185,
                                                    screenshots: [],
                                                    startedAt: "2022-11-28T17:41:15.338Z",
                                                    state: "passed",
                                                },
                                            ],
                                            title: [
                                                "cypress xray plugin",
                                                "passing test case with test issue key CYP-41 in the middle of the title",
                                            ],
                                        },
                                        {
                                            attempts: [
                                                {
                                                    duration: 4413,
                                                    screenshots: [
                                                        { path: "./test/resources/small.png" },
                                                    ],
                                                    startedAt: "2022-11-28T17:41:15.526Z",
                                                    state: "failed",
                                                },
                                            ],
                                            title: [
                                                "cypress xray plugin",
                                                "CYP-49 failling test case with test issue key",
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    isCloudEnvironment: false,
                    logger: { message: stub() },
                    options: {
                        cucumber: {},
                        jira: { projectKey: "CYP" },
                        plugin: {
                            normalizeScreenshotNames: true,
                            uploadLastAttempt: false,
                        },
                        xray: {
                            uploadScreenshots: true,
                            xrayStatus: {},
                        },
                    },
                });
                assert.deepStrictEqual(result, {
                    testExecutionKey: undefined,
                    tests: [
                        {
                            finish: "2022-11-28T17:41:15Z",
                            start: "2022-11-28T17:41:15Z",
                            status: "PASS",
                            testKey: "CYP-40",
                        },
                        {
                            finish: "2022-11-28T17:41:15Z",
                            start: "2022-11-28T17:41:15Z",
                            status: "PASS",
                            testKey: "CYP-41",
                        },
                        {
                            evidence: [
                                {
                                    contentType: "image/png",
                                    data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                                    filename: "small.png",
                                },
                            ],
                            finish: "2022-11-28T17:41:19Z",
                            start: "2022-11-28T17:41:15Z",
                            status: "FAIL",
                            testKey: "CYP-49",
                        },
                    ],
                });
            });

            void it("converts test results with multiple issue keys into xray results json", () => {
                const result = cypressResultConversion.convertCypressResults({
                    context: {
                        evidence: {
                            getEvidence() {
                                return [];
                            },
                        },
                        iterationParameters: {
                            getIterationParameters() {
                                return {};
                            },
                        },
                        screenshots: [],
                    },
                    cypress: {
                        results: {
                            cypressVersion: "11.1.0",
                            runs: [
                                {
                                    spec: {
                                        absolute:
                                            "/repositories/xray/cypress/e2e/demo/example.cy.ts",
                                        relative: "cypress\\e2e\\demo\\example.cy.ts",
                                    },
                                    tests: [
                                        {
                                            attempts: [
                                                {
                                                    duration: 185,
                                                    screenshots: [
                                                        { path: "./test/resources/small.png" },
                                                    ],
                                                    startedAt: "2022-11-28T17:41:15.338Z",
                                                    state: "passed",
                                                },
                                            ],
                                            title: [
                                                "cypress xray plugin",
                                                "CYP-123 CYP-124 CYP-125 example test",
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    isCloudEnvironment: false,
                    logger: { message: stub() },
                    options: {
                        cucumber: {},
                        jira: { projectKey: "CYP" },
                        plugin: {
                            normalizeScreenshotNames: true,
                            uploadLastAttempt: false,
                        },
                        xray: {
                            uploadScreenshots: true,
                            xrayStatus: {},
                        },
                    },
                });
                assert.deepStrictEqual(result, {
                    testExecutionKey: undefined,
                    tests: [
                        {
                            evidence: [
                                {
                                    contentType: "image/png",
                                    data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                                    filename: "small.png",
                                },
                            ],
                            finish: "2022-11-28T17:41:15Z",
                            start: "2022-11-28T17:41:15Z",
                            status: "PASS",
                            testKey: "CYP-123",
                        },
                        {
                            evidence: [
                                {
                                    contentType: "image/png",
                                    data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                                    filename: "small.png",
                                },
                            ],
                            finish: "2022-11-28T17:41:15Z",
                            start: "2022-11-28T17:41:15Z",
                            status: "PASS",
                            testKey: "CYP-124",
                        },
                        {
                            evidence: [
                                {
                                    contentType: "image/png",
                                    data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                                    filename: "small.png",
                                },
                            ],
                            finish: "2022-11-28T17:41:15Z",
                            start: "2022-11-28T17:41:15Z",
                            status: "PASS",
                            testKey: "CYP-125",
                        },
                    ],
                });
            });

            for (const {
                customStatus,
                expectedValue,
                isCloudEnvironment,
                statusType,
                testStatus,
            } of [
                {
                    customStatus: {},
                    expectedValue: "PASS",
                    isCloudEnvironment: false,
                    statusType: "default passed server",
                    testStatus: "passed",
                },
                {
                    customStatus: {},
                    expectedValue: "FAIL",
                    isCloudEnvironment: false,
                    statusType: "default failed server",
                    testStatus: "failed",
                },
                {
                    customStatus: {},
                    expectedValue: "TODO",
                    isCloudEnvironment: false,
                    statusType: "default pending server",
                    testStatus: "pending",
                },
                {
                    customStatus: {},
                    expectedValue: "FAIL",
                    isCloudEnvironment: false,
                    statusType: "default skipped server",
                    testStatus: "skipped",
                },
                {
                    customStatus: {},
                    expectedValue: "PASSED",
                    isCloudEnvironment: true,
                    statusType: "default passed cloud",
                    testStatus: "passed",
                },
                {
                    customStatus: {},
                    expectedValue: "FAILED",
                    isCloudEnvironment: true,
                    statusType: "default failed cloud",
                    testStatus: "failed",
                },
                {
                    customStatus: {},
                    expectedValue: "TO DO",
                    isCloudEnvironment: true,
                    statusType: "default pending cloud",
                    testStatus: "pending",
                },
                {
                    customStatus: {},
                    expectedValue: "FAILED",
                    isCloudEnvironment: true,
                    statusType: "default skipped cloud",
                    testStatus: "skipped",
                },
                {
                    customStatus: { passed: "it worked" },
                    expectedValue: "it worked",
                    isCloudEnvironment: false,
                    statusType: "custom passed",
                    testStatus: "passed",
                },
                {
                    customStatus: { pending: "still pending" },
                    expectedValue: "still pending",
                    isCloudEnvironment: false,
                    statusType: "custom pending",
                    testStatus: "pending",
                },
                {
                    customStatus: { failed: "it did not work" },
                    expectedValue: "it did not work",
                    isCloudEnvironment: true,
                    statusType: "custom failed",
                    testStatus: "failed",
                },
                {
                    customStatus: { skipped: "omit" },
                    expectedValue: "omit",
                    isCloudEnvironment: true,
                    statusType: "custom skipped",
                    testStatus: "skipped",
                },
            ]) {
                void it(`uses ${statusType} statuses`, () => {
                    const result = cypressResultConversion.convertCypressResults({
                        context: {
                            evidence: {
                                getEvidence() {
                                    return [];
                                },
                            },
                            iterationParameters: {
                                getIterationParameters() {
                                    return {};
                                },
                            },
                            screenshots: [],
                        },
                        cypress: {
                            results: {
                                cypressVersion: "11.1.0",
                                runs: [
                                    {
                                        spec: {
                                            absolute:
                                                "/repositories/xray/cypress/e2e/demo/example.cy.ts",
                                            relative: "cypress\\e2e\\demo\\example.cy.ts",
                                        },
                                        stats: { startedAt: "2022-11-28T17:41:12.234Z" },
                                        tests: [
                                            {
                                                attempts: [
                                                    {
                                                        duration: 244,
                                                        screenshots: [],
                                                        startedAt: "2022-11-28T17:41:15.091Z",
                                                        state: testStatus,
                                                    },
                                                ],
                                                title: [
                                                    "cypress xray plugin",
                                                    "test case with test issue key CYP-40",
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                        isCloudEnvironment: isCloudEnvironment,
                        logger: { message: stub() },
                        options: {
                            cucumber: {},
                            jira: { projectKey: "CYP" },
                            plugin: {
                                normalizeScreenshotNames: false,
                                uploadLastAttempt: false,
                            },
                            xray: {
                                uploadScreenshots: true,
                                xrayStatus: customStatus,
                            },
                        },
                    });
                    assert.ok(result.tests);
                    assert.strictEqual(result.tests[0].status, expectedValue);
                });
            }
        });

        void describe(">=13", () => {
            void it("converts test results into xray results json", () => {
                const result = cypressResultConversion.convertCypressResults({
                    context: {
                        evidence: {
                            getEvidence() {
                                return [];
                            },
                        },
                        iterationParameters: {
                            getIterationParameters() {
                                return {};
                            },
                        },
                        screenshots: [
                            {
                                blackout: [],
                                dimensions: { height: 8, width: 8, x: 0, y: 0 },
                                duration: 123,
                                multipart: false,
                                name: "null",
                                path: "./test/resources/small CYP-237.png",
                                pixelRatio: 1,
                                scaled: true,
                                size: 12345,
                                specName: "cypress.spec.cy.ts",
                                takenAt: "2023-09-09T10:59:31.366Z",
                                testFailure: true,
                            },
                        ],
                    },
                    cypress: {
                        results: {
                            cypressVersion: "13.0.0",
                            runs: [
                                {
                                    spec: {
                                        absolute: "/repositories/cypress/cypress.spec.cy.ts",
                                        relative: "cypress/cypress.spec.cy.ts",
                                    },
                                    stats: { startedAt: "2023-09-09T10:59:28.826Z" },
                                    tests: [
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 638,
                                            state: "passed",
                                            title: ["something", "CYP-452 happens"],
                                        },
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 28,
                                            state: "passed",
                                            title: ["something", "CYP-268 happens"],
                                        },
                                        {
                                            attempts: [{ state: "failed" }],
                                            duration: 25,
                                            state: "failed",
                                            title: ["something", "CYP-237 happens"],
                                        },
                                        {
                                            attempts: [{ state: "skipped" }],
                                            duration: 25,
                                            state: "skipped",
                                            title: ["something", "CYP-332 happens"],
                                        },
                                        {
                                            attempts: [{ state: "pending" }],
                                            duration: 28,
                                            state: "pending",
                                            title: ["something", "CYP-333 happens"],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    isCloudEnvironment: false,
                    logger: { message: stub() },
                    options: {
                        cucumber: {},
                        jira: { projectKey: "CYP" },
                        plugin: {
                            normalizeScreenshotNames: false,
                            uploadLastAttempt: false,
                        },
                        xray: {
                            uploadScreenshots: true,
                            xrayStatus: {},
                        },
                    },
                });
                assert.deepStrictEqual(result, {
                    testExecutionKey: undefined,
                    tests: [
                        {
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:28Z",
                            status: "PASS",
                            testKey: "CYP-452",
                        },
                        {
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "PASS",
                            testKey: "CYP-268",
                        },
                        {
                            evidence: [
                                {
                                    contentType: "image/png",
                                    data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                                    filename: "small CYP-237.png",
                                },
                            ],
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "FAIL",
                            testKey: "CYP-237",
                        },
                        {
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "FAIL",
                            testKey: "CYP-332",
                        },
                        {
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "TODO",
                            testKey: "CYP-333",
                        },
                    ],
                });
            });

            void it("converts test results with multiple issue keys into xray results json", () => {
                const result = cypressResultConversion.convertCypressResults({
                    context: {
                        evidence: {
                            getEvidence() {
                                return [];
                            },
                        },
                        iterationParameters: {
                            getIterationParameters() {
                                return {};
                            },
                        },
                        screenshots: [
                            {
                                blackout: [],
                                dimensions: { height: 8, width: 8, x: 0, y: 0 },
                                duration: 123,
                                multipart: false,
                                name: "null",
                                path: "./test/resources/small CYP-123 CYP-125.png",
                                pixelRatio: 1,
                                scaled: true,
                                size: 12345,
                                specName: "cypress.spec.cy.ts",
                                takenAt: "2022-11-28T17:41:19.702Z",
                                testFailure: true,
                            },
                        ],
                    },
                    cypress: {
                        results: {
                            cypressVersion: "13.0.0",
                            runs: [
                                {
                                    spec: {
                                        absolute:
                                            "/repositories/cypress/e2e/cyp/cypress.spec.cy.ts",
                                        relative: "cypress/e2e/cyp/cypress.spec.cy.ts",
                                    },
                                    stats: { startedAt: "2023-09-09T10:59:28.826Z" },
                                    tests: [
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 638,
                                            state: "passed",
                                            title: ["something", "CYP-452 happens"],
                                        },
                                        {
                                            attempts: [{ state: "failed" }],
                                            duration: 28,
                                            state: "failed",
                                            title: [
                                                "something",
                                                "CYP-123 CYP-124 CYP-125 example test",
                                            ],
                                        },
                                        {
                                            attempts: [{ state: "failed" }],
                                            duration: 28,
                                            state: "failed",
                                            title: ["something", "CYP-452 example test"],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    isCloudEnvironment: false,
                    logger: { message: stub() },
                    options: {
                        cucumber: {},
                        jira: { projectKey: "CYP" },
                        plugin: {
                            normalizeScreenshotNames: false,
                            uploadLastAttempt: false,
                        },
                        xray: {
                            uploadScreenshots: true,
                            xrayStatus: {},
                        },
                    },
                });
                assert.deepStrictEqual(result, {
                    testExecutionKey: undefined,
                    tests: [
                        {
                            finish: "2023-09-09T10:59:29Z",
                            iterations: [
                                { parameters: [{ name: "iteration", value: "1" }], status: "PASS" },
                                { parameters: [{ name: "iteration", value: "2" }], status: "FAIL" },
                            ],
                            start: "2023-09-09T10:59:28Z",
                            status: "FAIL",
                            testKey: "CYP-452",
                        },
                        {
                            evidence: [
                                {
                                    contentType: "image/png",
                                    data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                                    filename: "small CYP-123 CYP-125.png",
                                },
                            ],
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "FAIL",
                            testKey: "CYP-123",
                        },
                        {
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "FAIL",
                            testKey: "CYP-124",
                        },
                        {
                            evidence: [
                                {
                                    contentType: "image/png",
                                    data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                                    filename: "small CYP-123 CYP-125.png",
                                },
                            ],
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "FAIL",
                            testKey: "CYP-125",
                        },
                    ],
                });
            });

            void it("warns about non-attributable screenshots", (context) => {
                const messageMock = context.mock.fn<Logger["message"]>();
                const result = cypressResultConversion.convertCypressResults({
                    context: {
                        evidence: {
                            getEvidence() {
                                return [];
                            },
                        },
                        iterationParameters: {
                            getIterationParameters() {
                                return {};
                            },
                        },
                        screenshots: [
                            {
                                blackout: [],
                                dimensions: { height: 8, width: 8, x: 0, y: 0 },
                                duration: 123,
                                multipart: false,
                                name: "null",
                                path: join(".", "test", "resources", "small.png"),
                                pixelRatio: 1,
                                scaled: true,
                                size: 12345,
                                specName: "cypress.spec.cy.ts",
                                takenAt: "2023-09-09T10:59:31.366Z",
                                testFailure: true,
                            },
                        ],
                    },
                    cypress: {
                        results: {
                            cypressVersion: "13.0.0",
                            runs: [
                                {
                                    spec: {
                                        absolute: "/repositories/cypress/cypress.spec.cy.ts",
                                        relative: "cypress/cypress.spec.cy.ts",
                                    },
                                    stats: { startedAt: "2023-09-09T10:59:28.826Z" },
                                    tests: [
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 638,
                                            state: "passed",
                                            title: ["something", "CYP-452 happens"],
                                        },
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 28,
                                            state: "passed",
                                            title: ["something", "CYP-268 happens"],
                                        },
                                        {
                                            attempts: [{ state: "failed" }],
                                            duration: 25,
                                            state: "failed",
                                            title: ["something", "CYP-237 happens"],
                                        },
                                        {
                                            attempts: [{ state: "skipped" }],
                                            duration: 25,
                                            state: "skipped",
                                            title: ["something", "CYP-332 happens"],
                                        },
                                        {
                                            attempts: [{ state: "pending" }],
                                            duration: 28,
                                            state: "pending",
                                            title: ["something", "CYP-333 happens"],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    isCloudEnvironment: false,
                    logger: { message: messageMock },
                    options: {
                        cucumber: {},
                        jira: { projectKey: "CYP" },
                        plugin: {
                            normalizeScreenshotNames: false,
                            uploadLastAttempt: false,
                        },
                        xray: {
                            uploadScreenshots: true,
                            xrayStatus: {},
                        },
                    },
                });
                assert.deepStrictEqual(
                    messageMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            "warning",
                            dedent(`
                                ${join(".", "test", "resources", "small.png")}

                                  Screenshot cannot be attributed to a test and will not be uploaded.

                                  To upload screenshots, include test issue keys anywhere in their name:

                                    cy.screenshot("CYP-123 small")
                            `),
                        ],
                    ]
                );
                assert.deepStrictEqual(result, {
                    testExecutionKey: undefined,
                    tests: [
                        {
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:28Z",
                            status: "PASS",
                            testKey: "CYP-452",
                        },
                        {
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "PASS",
                            testKey: "CYP-268",
                        },
                        {
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "FAIL",
                            testKey: "CYP-237",
                        },
                        {
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "FAIL",
                            testKey: "CYP-332",
                        },
                        {
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "TODO",
                            testKey: "CYP-333",
                        },
                    ],
                });
            });

            for (const { attempts, expectedStatus, isCloudEnvironment, statusType, xrayStatus } of [
                {
                    attempts: [
                        [{ state: "passed" }, { state: "passed" }, { state: "passed" }],
                        [{ state: "passed" }],
                    ],
                    expectedStatus: {
                        iterations: ["PASS", "PASS", "PASS", "PASS"],
                        test: "PASS",
                    },
                    isCloudEnvironment: false,
                    statusType: "default passed server",
                    xrayStatus: {},
                },
                {
                    attempts: [
                        [{ state: "pending" }, { state: "pending" }, { state: "pending" }],
                        [{ state: "pending" }],
                    ],
                    expectedStatus: {
                        iterations: ["TODO", "TODO", "TODO", "TODO"],
                        test: "TODO",
                    },
                    isCloudEnvironment: false,
                    statusType: "default pending server",
                    xrayStatus: {},
                },
                {
                    attempts: [
                        [{ state: "pending" }, { state: "pending" }, { state: "pending" }],
                        [{ state: "skipped" }],
                    ],
                    expectedStatus: {
                        iterations: ["TODO", "TODO", "TODO", "FAIL"],
                        test: "FAIL",
                    },
                    isCloudEnvironment: false,
                    statusType: "default skipped server",
                    xrayStatus: {},
                },
                {
                    attempts: [
                        [{ state: "failed" }, { state: "failed" }, { state: "passed" }],
                        [{ state: "passed" }],
                    ],
                    expectedStatus: {
                        iterations: ["FAIL", "FAIL", "PASS", "PASS"],
                        test: "FAIL",
                    },
                    isCloudEnvironment: false,
                    statusType: "default failed server",
                    xrayStatus: {},
                },
                {
                    attempts: [
                        [{ state: "passed" }, { state: "passed" }, { state: "passed" }],
                        [{ state: "passed" }],
                    ],
                    expectedStatus: {
                        iterations: ["PASSED", "PASSED", "PASSED", "PASSED"],
                        test: "PASSED",
                    },
                    isCloudEnvironment: true,
                    statusType: "default passed cloud",
                    xrayStatus: {},
                },
                {
                    attempts: [
                        [{ state: "pending" }, { state: "pending" }, { state: "pending" }],
                        [{ state: "pending" }],
                    ],
                    expectedStatus: {
                        iterations: ["TO DO", "TO DO", "TO DO", "TO DO"],
                        test: "TO DO",
                    },
                    isCloudEnvironment: true,
                    statusType: "default pending cloud",
                    xrayStatus: {},
                },
                {
                    attempts: [
                        [{ state: "pending" }, { state: "pending" }, { state: "pending" }],
                        [{ state: "skipped" }],
                    ],
                    expectedStatus: {
                        iterations: ["TO DO", "TO DO", "TO DO", "FAILED"],
                        test: "FAILED",
                    },
                    isCloudEnvironment: true,
                    statusType: "default skipped cloud",
                    xrayStatus: {},
                },
                {
                    attempts: [
                        [{ state: "failed" }, { state: "failed" }, { state: "passed" }],
                        [{ state: "passed" }],
                    ],
                    expectedStatus: {
                        iterations: ["FAILED", "FAILED", "PASSED", "PASSED"],
                        test: "FAILED",
                    },
                    isCloudEnvironment: true,
                    statusType: "default failed cloud",
                    xrayStatus: {},
                },

                {
                    attempts: [
                        [{ state: "passed" }, { state: "passed" }, { state: "passed" }],
                        [{ state: "passed" }],
                    ],
                    expectedStatus: {
                        iterations: ["OKI DOKI", "OKI DOKI", "OKI DOKI", "OKI DOKI"],
                        test: "OKI DOKI",
                    },
                    isCloudEnvironment: false,
                    statusType: "custom passed",
                    xrayStatus: { passed: "OKI DOKI" },
                },
                {
                    attempts: [
                        [{ state: "pending" }, { state: "pending" }, { state: "pending" }],
                        [{ state: "pending" }],
                    ],
                    expectedStatus: {
                        iterations: ["WAKE ME UP", "WAKE ME UP", "WAKE ME UP", "WAKE ME UP"],
                        test: "WAKE ME UP",
                    },
                    isCloudEnvironment: true,
                    statusType: "custom pending",
                    xrayStatus: { pending: "WAKE ME UP" },
                },
                {
                    attempts: [
                        [{ state: "pending" }, { state: "pending" }, { state: "pending" }],
                        [{ state: "skipped" }],
                    ],
                    expectedStatus: {
                        iterations: ["TODO", "TODO", "TODO", "NAH"],
                        test: "NAH",
                    },
                    isCloudEnvironment: false,
                    statusType: "custom skipped",
                    xrayStatus: { skipped: "NAH" },
                },
                {
                    attempts: [
                        [{ state: "failed" }, { state: "failed" }, { state: "passed" }],
                        [{ state: "passed" }],
                    ],
                    expectedStatus: {
                        iterations: ["BROKEN", "BROKEN", "PASSED", "PASSED"],
                        test: "BROKEN",
                    },
                    isCloudEnvironment: true,
                    statusType: "custom failed",
                    xrayStatus: { failed: "BROKEN" },
                },
            ]) {
                void it(`uses ${statusType} statuses`, () => {
                    const result = cypressResultConversion.convertCypressResults({
                        context: {
                            evidence: {
                                getEvidence() {
                                    return [];
                                },
                            },
                            iterationParameters: {
                                getIterationParameters() {
                                    return {};
                                },
                            },
                            screenshots: [],
                        },
                        cypress: {
                            results: {
                                cypressVersion: "13.16.0",
                                runs: [
                                    {
                                        spec: {
                                            absolute:
                                                "/home/user/cypress-xray-plugin/test/integration/iterations-using-describe/server/spec.cy.js",
                                            relative: "spec.cy.js",
                                        },
                                        stats: { startedAt: "2024-12-20T23:19:14.969Z" },
                                        tests: [
                                            {
                                                attempts: attempts[0],
                                                duration: 1003,
                                                state: "passed",
                                                title: [
                                                    "CYP-237 Test Suite Name",
                                                    "Test Method Name 1",
                                                ],
                                            },
                                            {
                                                attempts: attempts[1],
                                                duration: 52,
                                                state: "passed",
                                                title: [
                                                    "CYP-237 Test Suite Name",
                                                    "Test Method Name 2",
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                        isCloudEnvironment: isCloudEnvironment,
                        logger: { message: stub() },
                        options: {
                            cucumber: {},
                            jira: { projectKey: "CYP" },
                            plugin: {
                                normalizeScreenshotNames: false,
                                uploadLastAttempt: false,
                            },
                            xray: {
                                uploadScreenshots: true,
                                xrayStatus: xrayStatus,
                            },
                        },
                    });
                    assert.ok(result.tests);
                    assert.strictEqual(result.tests[0].status, expectedStatus.test);
                    assert.ok(result.tests[0].iterations);
                    assert.strictEqual(
                        result.tests[0].iterations[0].status,
                        expectedStatus.iterations[0]
                    );
                    assert.strictEqual(
                        result.tests[0].iterations[1].status,
                        expectedStatus.iterations[1]
                    );
                    assert.strictEqual(
                        result.tests[0].iterations[2].status,
                        expectedStatus.iterations[2]
                    );
                    assert.strictEqual(
                        result.tests[0].iterations[3].status,
                        expectedStatus.iterations[3]
                    );
                });
            }

            void it("uses custom aggregated statuses", () => {
                const result = cypressResultConversion.convertCypressResults({
                    context: {
                        evidence: {
                            getEvidence() {
                                return [];
                            },
                        },
                        iterationParameters: {
                            getIterationParameters() {
                                return {};
                            },
                        },
                        screenshots: [],
                    },
                    cypress: {
                        results: {
                            cypressVersion: "13.16.0",
                            runs: [
                                {
                                    spec: {
                                        absolute:
                                            "/home/user/cypress-xray-plugin/test/integration/iterations-using-describe/server/spec.cy.js",
                                        relative: "spec.cy.js",
                                    },
                                    stats: { startedAt: "2024-12-20T23:19:14.969Z" },
                                    tests: [
                                        {
                                            attempts: [
                                                { state: "failed" },
                                                { state: "failed" },
                                                { state: "passed" },
                                            ],
                                            duration: 1003,
                                            state: "passed",
                                            title: [
                                                "CYP-237 Test Suite Name",
                                                "Test Method Name 1",
                                            ],
                                        },
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 52,
                                            state: "passed",
                                            title: [
                                                "CYP-237 Test Suite Name",
                                                "Test Method Name 2",
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    isCloudEnvironment: true,
                    logger: { message: stub() },
                    options: {
                        cucumber: {},
                        jira: { projectKey: "CYP" },
                        plugin: {
                            normalizeScreenshotNames: false,
                            uploadLastAttempt: false,
                        },
                        xray: {
                            uploadScreenshots: true,
                            xrayStatus: {
                                aggregate: ({ failed, passed, pending, skipped }) => {
                                    if (passed > 0 && failed === 0 && skipped === 0) {
                                        return "PASSED";
                                    }
                                    if (passed > 0 && (failed > 0 || skipped > 0)) {
                                        return "FLAKY";
                                    }
                                    if (pending > 0) {
                                        return "TODO";
                                    }
                                    return "FAILED";
                                },
                            },
                        },
                    },
                });
                assert.ok(result.tests);
                assert.strictEqual(result.tests[0].status, "FLAKY");
                assert.ok(result.tests[0].iterations);
                assert.strictEqual(result.tests[0].iterations[0].status, "FAILED");
                assert.strictEqual(result.tests[0].iterations[1].status, "FAILED");
                assert.strictEqual(result.tests[0].iterations[2].status, "PASSED");
                assert.strictEqual(result.tests[0].iterations[3].status, "PASSED");
            });

            void it("calls the custom aggregation function with correct arguments", (context) => {
                const aggregationFunction = context.mock.fn(() => "PASS");
                cypressResultConversion.convertCypressResults({
                    context: {
                        evidence: {
                            getEvidence() {
                                return [];
                            },
                        },
                        iterationParameters: {
                            getIterationParameters() {
                                return {};
                            },
                        },
                        screenshots: [],
                    },
                    cypress: {
                        results: {
                            cypressVersion: "13.16.0",
                            runs: [
                                {
                                    spec: {
                                        absolute:
                                            "/home/user/cypress-xray-plugin/test/integration/iterations-using-describe/server/spec.cy.js",
                                        relative: "spec.cy.js",
                                    },
                                    stats: { startedAt: "2024-12-20T23:19:14.969Z" },
                                    tests: [
                                        {
                                            attempts: [
                                                { state: "failed" },
                                                { state: "failed" },
                                                { state: "passed" },
                                            ],
                                            duration: 1003,
                                            state: "passed",
                                            title: [
                                                "CYP-237 Test Suite Name",
                                                "Test Method Name 1",
                                            ],
                                        },
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 52,
                                            state: "passed",
                                            title: [
                                                "CYP-237 Test Suite Name",
                                                "Test Method Name 2",
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    isCloudEnvironment: true,
                    logger: { message: stub() },
                    options: {
                        cucumber: {},
                        jira: { projectKey: "CYP" },
                        plugin: {
                            normalizeScreenshotNames: false,
                            uploadLastAttempt: false,
                        },
                        xray: {
                            uploadScreenshots: true,
                            xrayStatus: { aggregate: aggregationFunction },
                        },
                    },
                });
                assert.deepStrictEqual(
                    aggregationFunction.mock.calls.map((call) => call.arguments),
                    [
                        [
                            {
                                failed: 2,
                                issueKey: "CYP-237",
                                passed: 2,
                                pending: 0,
                                skipped: 0,
                                specs: [
                                    {
                                        absolute:
                                            "/home/user/cypress-xray-plugin/test/integration/iterations-using-describe/server/spec.cy.js",
                                        relative: "spec.cy.js",
                                    },
                                ],
                                tests: [
                                    {
                                        attempts: [
                                            { state: "failed" },
                                            { state: "failed" },
                                            { state: "passed" },
                                        ],
                                        duration: 1003,
                                        state: "passed",
                                        title: ["CYP-237 Test Suite Name", "Test Method Name 1"],
                                    },
                                    {
                                        attempts: [{ state: "passed" }],
                                        duration: 52,
                                        state: "passed",
                                        title: ["CYP-237 Test Suite Name", "Test Method Name 2"],
                                    },
                                ],
                            },
                        ],
                    ]
                );
            });

            void it("skips tests when encountering unknown statuses", (context) => {
                const messageMock = context.mock.fn<Logger["message"]>();
                assert.throws(
                    () =>
                        cypressResultConversion.convertCypressResults({
                            context: {
                                evidence: {
                                    getEvidence() {
                                        return [];
                                    },
                                },
                                iterationParameters: {
                                    getIterationParameters() {
                                        return {};
                                    },
                                },
                                screenshots: [],
                            },
                            cypress: {
                                results: {
                                    cypressVersion: "12.10.0",
                                    runs: [
                                        {
                                            spec: {
                                                absolute:
                                                    "/home/csvtuda/cypress/cypress/e2e/statusSkipped.cy.js",
                                                relative: "cypress/e2e/statusSkipped.cy.js",
                                            },
                                            tests: [
                                                {
                                                    attempts: [
                                                        {
                                                            duration: 833,
                                                            screenshots: [
                                                                {
                                                                    path: "~/cypress/screenshots/statusSkipped.cy.js/TodoMVC -- hides footer initially -- before each hook (failed).png",
                                                                },
                                                            ],
                                                            startedAt: "2023-05-21T10:06:46.464Z",
                                                            state: "broken",
                                                        },
                                                    ],
                                                    title: [
                                                        "CYP-789 | TodoMVC",
                                                        "hides footer initially",
                                                    ],
                                                },
                                                {
                                                    attempts: [
                                                        {
                                                            duration: 0,
                                                            screenshots: [],
                                                            startedAt: "2023-05-21T10:06:46.464Z",
                                                            state: "california",
                                                        },
                                                    ],
                                                    title: ["TodoMVC", "adds 2 todos"],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            },
                            isCloudEnvironment: true,
                            logger: { message: messageMock },
                            options: {
                                cucumber: {},
                                jira: { projectKey: "CYP" },
                                plugin: {
                                    normalizeScreenshotNames: false,
                                    uploadLastAttempt: false,
                                },
                                xray: { uploadScreenshots: true, xrayStatus: {} },
                            },
                        }),
                    new Error(
                        "Failed to convert Cypress tests into Xray tests: No Cypress tests to upload"
                    )
                );
                assert.deepStrictEqual(
                    messageMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            "warning",
                            dedent(`
                                /home/csvtuda/cypress/cypress/e2e/statusSkipped.cy.js

                                  Test: CYP-789 | TodoMVC hides footer initially

                                    Skipping result upload.

                                      Caused by: Unknown Cypress test status: broken
                            `),
                        ],
                        [
                            "warning",
                            dedent(`
                                /home/csvtuda/cypress/cypress/e2e/statusSkipped.cy.js

                                  Test: TodoMVC adds 2 todos

                                    Skipping result upload.

                                      Caused by: Test: TodoMVC adds 2 todos

                                        No test issue keys found in title.

                                        You can target existing test issues by adding a corresponding issue key:

                                          it("CYP-123 TodoMVC adds 2 todos", () => {
                                            // ...
                                          });

                                        For more information, visit:
                                        - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                            `),
                        ],
                    ]
                );
            });

            void it("skips cucumber screenshots", () => {
                const result = cypressResultConversion.convertCypressResults({
                    context: {
                        evidence: {
                            getEvidence() {
                                return [];
                            },
                        },
                        iterationParameters: {
                            getIterationParameters() {
                                return {};
                            },
                        },
                        screenshots: [
                            {
                                blackout: [],
                                dimensions: { height: 8, width: 8, x: 0, y: 0 },
                                duration: 123,
                                multipart: false,
                                name: "null",
                                path: "./test/resources/small CYP-237.png",
                                pixelRatio: 1,
                                scaled: true,
                                size: 12345,
                                specName: "cypress.spec.cy.ts",
                                takenAt: "2023-09-09T10:59:31.366Z",
                                testFailure: true,
                            },
                        ],
                    },
                    cypress: {
                        results: {
                            cypressVersion: "13.10.0",
                            runs: [
                                {
                                    spec: {
                                        absolute:
                                            "/repositories/cypress/integration/cypress/325.spec.cy.ts",
                                        relative: "cypress\\325.spec.cy.ts",
                                    },
                                    stats: { startedAt: "2024-06-17T17:32:13.443Z" },
                                    tests: [
                                        {
                                            attempts: [{ state: "failed" }],
                                            duration: 327,
                                            state: "failed",
                                            title: [
                                                "Test results of grouped test steps",
                                                "CYP-237 should do A",
                                            ],
                                        },
                                    ],
                                },
                                {
                                    spec: {
                                        absolute:
                                            "/repositories/cypress/integration/cypress/singleScenario.feature",
                                        relative: "cypress\\singleScenario.feature",
                                    },
                                    stats: { startedAt: "2024-06-17T17:32:23.349Z" },
                                    tests: [
                                        {
                                            attempts: [{ state: "failed" }],
                                            duration: 265,
                                            state: "failed",
                                            title: ["Single scenario", "Single scenario test"],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    isCloudEnvironment: true,
                    logger: { message: stub() },
                    options: {
                        cucumber: { featureFileExtension: ".feature" },
                        jira: { projectKey: "CYP" },
                        plugin: {
                            normalizeScreenshotNames: false,
                            uploadLastAttempt: false,
                        },
                        xray: {
                            uploadScreenshots: true,
                            xrayStatus: {},
                        },
                    },
                });
                assert.ok(result.tests);
                assert.strictEqual(result.tests.length, 1);
                assert.strictEqual(result.tests[0].evidence?.length, 1);
                assert.strictEqual(result.tests[0].evidence[0].filename, "small CYP-237.png");
            });

            void it("skips screenshot upload if disabled", () => {
                const result = cypressResultConversion.convertCypressResults({
                    context: {
                        evidence: {
                            getEvidence() {
                                return [];
                            },
                        },
                        iterationParameters: {
                            getIterationParameters() {
                                return {};
                            },
                        },
                        screenshots: [],
                    },
                    cypress: {
                        results: {
                            cypressVersion: "11.1.0",
                            runs: [
                                {
                                    spec: {
                                        absolute:
                                            "/repositories/xray/cypress/e2e/demo/example.cy.ts",
                                        relative: "cypress\\e2e\\demo\\example.cy.ts",
                                    },
                                    tests: [
                                        {
                                            attempts: [
                                                {
                                                    duration: 244,
                                                    screenshots: [],
                                                    startedAt: "2022-11-28T17:41:15.091Z",
                                                    state: "passed",
                                                },
                                            ],
                                            title: [
                                                "cypress xray plugin",
                                                "passing test case with test issue key CYP-40",
                                            ],
                                        },
                                        {
                                            attempts: [
                                                {
                                                    duration: 185,
                                                    screenshots: [],
                                                    startedAt: "2022-11-28T17:41:15.338Z",
                                                    state: "passed",
                                                },
                                            ],
                                            title: [
                                                "cypress xray plugin",
                                                "passing test case with test issue key CYP-41 in the middle of the title",
                                            ],
                                        },
                                        {
                                            attempts: [
                                                {
                                                    duration: 4413,
                                                    screenshots: [
                                                        { path: "./test/resources/small.png" },
                                                    ],
                                                    startedAt: "2022-11-28T17:41:15.526Z",
                                                    state: "failed",
                                                },
                                            ],
                                            title: [
                                                "cypress xray plugin",
                                                "CYP-49 failling test case with test issue key",
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    isCloudEnvironment: true,
                    logger: { message: stub() },
                    options: {
                        cucumber: {},
                        jira: { projectKey: "CYP" },
                        plugin: {
                            normalizeScreenshotNames: false,
                            uploadLastAttempt: false,
                        },
                        xray: {
                            uploadScreenshots: false,
                            xrayStatus: {},
                        },
                    },
                });
                assert.ok(result.tests);
                assert.strictEqual(result.tests[0].evidence, undefined);
                assert.strictEqual(result.tests[1].evidence, undefined);
                assert.strictEqual(result.tests[2].evidence, undefined);
            });

            void it("normalizes screenshot filenames if enabled", () => {
                const result = cypressResultConversion.convertCypressResults({
                    context: {
                        evidence: {
                            getEvidence() {
                                return [];
                            },
                        },
                        iterationParameters: {
                            getIterationParameters() {
                                return {};
                            },
                        },
                        screenshots: [],
                    },
                    cypress: {
                        results: {
                            cypressVersion: "11.1.0",
                            runs: [
                                {
                                    spec: {
                                        absolute:
                                            "/repositories/xray/cypress/e2e/demo/example.cy.ts",
                                        relative: "cypress\\e2e\\demo\\example.cy.ts",
                                    },
                                    tests: [
                                        {
                                            attempts: [
                                                {
                                                    duration: 4413,
                                                    screenshots: [
                                                        {
                                                            path: "./test/resources/tûrtle with problemätic name.png",
                                                        },
                                                    ],
                                                    startedAt: "2022-11-28T17:41:15.526Z",
                                                    state: "failed",
                                                },
                                            ],
                                            title: ["xray upload demo", "should fail CYP-123"],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    isCloudEnvironment: true,
                    logger: { message: stub() },
                    options: {
                        cucumber: {},
                        jira: { projectKey: "CYP" },
                        plugin: {
                            normalizeScreenshotNames: true,
                            uploadLastAttempt: false,
                        },
                        xray: {
                            uploadScreenshots: true,
                            xrayStatus: {},
                        },
                    },
                });
                assert.ok(result.tests);
                assert.strictEqual(
                    result.tests[0].evidence?.[0].filename,
                    "t_rtle_with_problem_tic_name.png"
                );
            });

            void it("includes all evidence", () => {
                const result = cypressResultConversion.convertCypressResults({
                    context: {
                        evidence: {
                            getEvidence(issueKey: string) {
                                switch (issueKey) {
                                    case "CYP-237":
                                        return [
                                            {
                                                contentType: "text/plain",
                                                data: "Z29vZGJ5ZQ==",
                                                filename: "goodbye.txt",
                                            },
                                        ];
                                    case "CYP-452":
                                        return [
                                            {
                                                contentType: "text/plain",
                                                data: "aGkgdGhlcmU=",
                                                filename: "hi.txt",
                                            },
                                        ];
                                    case "CYP-268":
                                    case "CYP-123":
                                    case "CYP-125":
                                        return [];
                                    default:
                                        throw new Error(
                                            `Mock called unexpectedly with args: ${unknownToString(issueKey)}`
                                        );
                                }
                            },
                        },
                        iterationParameters: {
                            getIterationParameters() {
                                return {};
                            },
                        },
                        screenshots: [
                            {
                                blackout: [],
                                dimensions: { height: 8, width: 8, x: 0, y: 0 },
                                duration: 123,
                                multipart: false,
                                name: "null",
                                path: "./test/resources/small CYP-237.png",
                                pixelRatio: 1,
                                scaled: true,
                                size: 12345,
                                specName: "cypress.spec.cy.ts",
                                takenAt: "2023-09-09T10:59:31.366Z",
                                testFailure: true,
                            },
                            {
                                blackout: [],
                                dimensions: { height: 8, width: 8, x: 0, y: 0 },
                                duration: 123,
                                multipart: false,
                                name: "null",
                                path: "./test/resources/small CYP-123.png",
                                pixelRatio: 1,
                                scaled: true,
                                size: 12345,
                                specName: "cypress.spec.cy.ts",
                                takenAt: "2023-09-09T10:59:32.125Z",
                                testFailure: true,
                            },
                            {
                                blackout: [],
                                dimensions: { height: 8, width: 8, x: 0, y: 0 },
                                duration: 456,
                                multipart: false,
                                name: "null",
                                path: "./test/resources/small CYP-123 CYP-125.png",
                                pixelRatio: 1,
                                scaled: true,
                                size: 12345,
                                specName: "cypress.spec.cy.ts",
                                takenAt: "2023-09-09T10:59:35.814Z",
                                testFailure: false,
                            },
                        ],
                    },
                    cypress: {
                        results: {
                            cypressVersion: "13.16.0",
                            runs: [
                                {
                                    spec: {
                                        absolute:
                                            "/repositories/cypress/85/cypress/e2e/cyp/cypress.spec.cy.ts",
                                        relative: "cypress/e2e/cyp/cypress.spec.cy.ts",
                                    },
                                    stats: { startedAt: "2023-09-09T10:59:28.826Z" },
                                    tests: [
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 638,
                                            state: "passed",
                                            title: ["something", "CYP-452 happens"],
                                        },
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 28,
                                            state: "passed",
                                            title: ["something", "CYP-268 happens"],
                                        },
                                        {
                                            attempts: [{ state: "failed" }],
                                            duration: 25,
                                            state: "failed",
                                            title: ["something", "CYP-237 happens"],
                                        },
                                        {
                                            attempts: [{ state: "skipped" }],
                                            duration: 25,
                                            state: "skipped",
                                            title: ["something", "CYP-123 happens"],
                                        },
                                        {
                                            attempts: [{ state: "pending" }],
                                            duration: 28,
                                            state: "pending",
                                            title: ["something", "CYP-125 happens"],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    isCloudEnvironment: false,
                    logger: { message: stub() },
                    options: {
                        cucumber: {},
                        jira: { projectKey: "CYP" },
                        plugin: {
                            normalizeScreenshotNames: false,
                            uploadLastAttempt: false,
                        },
                        xray: {
                            uploadScreenshots: true,
                            xrayStatus: {},
                        },
                    },
                });
                assert.deepStrictEqual(result, {
                    testExecutionKey: undefined,
                    tests: [
                        {
                            evidence: [
                                {
                                    contentType: "text/plain",
                                    data: "aGkgdGhlcmU=",
                                    filename: "hi.txt",
                                },
                            ],
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:28Z",
                            status: "PASS",
                            testKey: "CYP-452",
                        },
                        {
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "PASS",
                            testKey: "CYP-268",
                        },
                        {
                            evidence: [
                                {
                                    contentType: "image/png",
                                    data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                                    filename: "small CYP-237.png",
                                },
                                {
                                    contentType: "text/plain",
                                    data: "Z29vZGJ5ZQ==",
                                    filename: "goodbye.txt",
                                },
                            ],
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "FAIL",
                            testKey: "CYP-237",
                        },
                        {
                            evidence: [
                                {
                                    contentType: "image/png",
                                    data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                                    filename: "small CYP-123.png",
                                },
                                {
                                    contentType: "image/png",
                                    data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                                    filename: "small CYP-123 CYP-125.png",
                                },
                            ],
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "FAIL",
                            testKey: "CYP-123",
                        },
                        {
                            evidence: [
                                {
                                    contentType: "image/png",
                                    data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                                    filename: "small CYP-123 CYP-125.png",
                                },
                            ],
                            finish: "2023-09-09T10:59:29Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "TODO",
                            testKey: "CYP-125",
                        },
                    ],
                });
            });

            void it("includes iteration parameters", () => {
                const result = cypressResultConversion.convertCypressResults({
                    context: {
                        evidence: {
                            getEvidence() {
                                return [];
                            },
                        },
                        iterationParameters: {
                            getIterationParameters(issueKey, testId) {
                                if (
                                    issueKey === "CYP-452" &&
                                    testId === "something CYP-452 happens Bob"
                                ) {
                                    return { age: "42", name: "Bob" };
                                }
                                if (
                                    issueKey === "CYP-452" &&
                                    testId === "something CYP-452 happens Jeff"
                                ) {
                                    return { age: "51", name: "Jeff" };
                                }
                                if (
                                    issueKey === "CYP-237" &&
                                    testId === "something CYP-237 happens Mary"
                                ) {
                                    return { age: "32", name: "Mary" };
                                }
                                if (
                                    issueKey === "CYP-237" &&
                                    testId === "something CYP-237 happens Jane"
                                ) {
                                    return { age: "19", name: "Jane" };
                                }
                                throw new Error(
                                    `Mock called unexpectedly with args: ${unknownToString({ issueKey, testId })}`
                                );
                            },
                        },
                        screenshots: [],
                    },
                    cypress: {
                        results: {
                            cypressVersion: "13.16.0",
                            runs: [
                                {
                                    spec: {
                                        absolute:
                                            "/home/user/cypress-xray-plugin/test/integration/iterations-using-describe/server/spec.cy.js",
                                        relative: "spec.cy.js",
                                    },
                                    stats: { startedAt: "2023-09-09T10:59:28.826Z" },
                                    tests: [
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 638,
                                            state: "passed",
                                            title: ["something", "CYP-452 happens Bob"],
                                        },
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 25,
                                            state: "passed",
                                            title: ["something", "CYP-452 happens Jeff"],
                                        },
                                        {
                                            attempts: [{ state: "failed" }],
                                            duration: 28,
                                            state: "passed",
                                            title: ["something", "CYP-237 happens Mary"],
                                        },
                                        {
                                            attempts: [{ state: "failed" }],
                                            duration: 25,
                                            state: "failed",
                                            title: ["something", "CYP-237 happens Jane"],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    isCloudEnvironment: false,
                    logger: { message: stub() },
                    options: {
                        cucumber: {},
                        jira: { projectKey: "CYP" },
                        plugin: {
                            normalizeScreenshotNames: false,
                            uploadLastAttempt: false,
                        },
                        xray: {
                            uploadScreenshots: true,
                            xrayStatus: {},
                        },
                    },
                });
                assert.deepStrictEqual(result, {
                    testExecutionKey: undefined,
                    tests: [
                        {
                            finish: "2023-09-09T10:59:29Z",
                            iterations: [
                                {
                                    parameters: [
                                        { name: "iteration", value: "1" },
                                        { name: "age", value: "42" },
                                        { name: "name", value: "Bob" },
                                    ],
                                    status: "PASS",
                                },
                                {
                                    parameters: [
                                        { name: "iteration", value: "2" },
                                        { name: "age", value: "51" },
                                        { name: "name", value: "Jeff" },
                                    ],
                                    status: "PASS",
                                },
                            ],
                            start: "2023-09-09T10:59:28Z",
                            status: "PASS",
                            testKey: "CYP-452",
                        },
                        {
                            finish: "2023-09-09T10:59:29Z",
                            iterations: [
                                {
                                    parameters: [
                                        { name: "iteration", value: "1" },
                                        { name: "age", value: "32" },
                                        { name: "name", value: "Mary" },
                                    ],
                                    status: "FAIL",
                                },
                                {
                                    parameters: [
                                        { name: "iteration", value: "2" },
                                        { name: "age", value: "19" },
                                        { name: "name", value: "Jane" },
                                    ],
                                    status: "FAIL",
                                },
                            ],
                            start: "2023-09-09T10:59:29Z",
                            status: "FAIL",
                            testKey: "CYP-237",
                        },
                    ],
                });
            });

            void it("does not modify test information", () => {
                const result = cypressResultConversion.convertCypressResults({
                    context: {
                        evidence: {
                            getEvidence() {
                                return [];
                            },
                        },
                        iterationParameters: {
                            getIterationParameters() {
                                return {};
                            },
                        },
                        screenshots: [],
                    },
                    cypress: {
                        results: {
                            cypressVersion: "13.16.0",
                            runs: [
                                {
                                    spec: {
                                        absolute:
                                            "/home/user/cypress-xray-plugin/test/integration/iterations-using-describe/server/spec.cy.js",
                                        relative: "spec.cy.js",
                                    },
                                    stats: { startedAt: "2023-09-09T10:59:28.826Z" },
                                    tests: [
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 638,
                                            state: "passed",
                                            title: ["something", "CYP-452 happens Bob"],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    isCloudEnvironment: false,
                    logger: { message: stub() },
                    options: {
                        cucumber: {},
                        jira: { projectKey: "CYP" },
                        plugin: {
                            normalizeScreenshotNames: false,
                            uploadLastAttempt: false,
                        },
                        xray: {
                            uploadScreenshots: true,
                            xrayStatus: {},
                        },
                    },
                });
                assert.deepStrictEqual(result.tests?.[0].testInfo, undefined);
            });

            void it("throws if no native cypress tests were executed", () => {
                assert.throws(
                    () =>
                        cypressResultConversion.convertCypressResults({
                            context: {
                                evidence: {
                                    getEvidence() {
                                        return [];
                                    },
                                },
                                iterationParameters: {
                                    getIterationParameters() {
                                        return {};
                                    },
                                },
                                screenshots: [],
                            },
                            cypress: {
                                results: {
                                    cypressVersion: "13.16.0",
                                    runs: [
                                        {
                                            spec: {
                                                absolute:
                                                    "/home/user/cypress-xray-plugin/test/integration/iterations-using-describe/server/spec.cy.js",
                                                relative: "spec.cy.js",
                                            },
                                            stats: { startedAt: "2023-09-09T10:59:28.826Z" },
                                            tests: [],
                                        },
                                    ],
                                },
                            },
                            isCloudEnvironment: false,
                            logger: { message: stub() },
                            options: {
                                cucumber: {},
                                jira: { projectKey: "CYP" },
                                plugin: {
                                    normalizeScreenshotNames: false,
                                    uploadLastAttempt: false,
                                },
                                xray: {
                                    uploadScreenshots: true,
                                    xrayStatus: {},
                                },
                            },
                        }),
                    new Error(
                        "Failed to convert Cypress tests into Xray tests: No Cypress tests to upload"
                    )
                );
            });

            void it("handles tests without issue keys", (context) => {
                const messageMock = context.mock.fn<Logger["message"]>();
                const result = cypressResultConversion.convertCypressResults({
                    context: {
                        evidence: {
                            getEvidence() {
                                return [];
                            },
                        },
                        iterationParameters: {
                            getIterationParameters() {
                                return {};
                            },
                        },
                        screenshots: [],
                    },
                    cypress: {
                        results: {
                            cypressVersion: "13.16.0",
                            runs: [
                                {
                                    spec: {
                                        absolute:
                                            "/home/user/cypress-xray-plugin/test/integration/iterations-using-describe/server/spec.cy.js",
                                        relative: "spec.cy.js",
                                    },
                                    stats: { startedAt: "2023-09-09T10:59:28.826Z" },
                                    tests: [
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 638,
                                            state: "passed",
                                            title: ["something", "Alice"],
                                        },
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 638,
                                            state: "passed",
                                            title: ["something", "CYP-123 happens Bob"],
                                        },
                                        {
                                            attempts: [{ state: "passed" }],
                                            duration: 638,
                                            state: "passed",
                                            title: ["something", "Charlie"],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    isCloudEnvironment: false,
                    logger: { message: messageMock },
                    options: {
                        cucumber: {},
                        jira: { projectKey: "CYP" },
                        plugin: {
                            normalizeScreenshotNames: false,
                            uploadLastAttempt: false,
                        },
                        xray: {
                            uploadScreenshots: true,
                            xrayStatus: {},
                        },
                    },
                });
                assert.deepStrictEqual(result, {
                    testExecutionKey: undefined,
                    tests: [
                        {
                            finish: "2023-09-09T10:59:30Z",
                            start: "2023-09-09T10:59:29Z",
                            status: "PASS",
                            testKey: "CYP-123",
                        },
                    ],
                });
                assert.deepStrictEqual(
                    messageMock.mock.calls.map((call) => call.arguments),
                    [
                        [
                            "warning",
                            dedent(`
                                /home/user/cypress-xray-plugin/test/integration/iterations-using-describe/server/spec.cy.js

                                  Test: something Alice

                                    Skipping result upload.

                                      Caused by: Test: something Alice

                                        No test issue keys found in title.

                                        You can target existing test issues by adding a corresponding issue key:

                                          it("CYP-123 something Alice", () => {
                                            // ...
                                          });

                                        For more information, visit:
                                        - https://csvtuda.github.io/docs/cypress-xray-plugin/guides/targetingExistingIssues/
                            `),
                        ],
                        [
                            "warning",
                            dedent(`
                                /home/user/cypress-xray-plugin/test/integration/iterations-using-describe/server/spec.cy.js

                                  Test: something Charlie

                                    Skipping result upload.

                                      Caused by: Test: something Charlie

                                        No test issue keys found in title.

                                        You can target existing test issues by adding a corresponding issue key:

                                          it("CYP-123 something Charlie", () => {
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
});
