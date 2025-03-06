import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { beforeEach, describe, it } from "node:test";
import globalContext, {
    SimpleEvidenceCollection,
    SimpleIterationParameterCollection,
} from "../../../../../context";
import type { CypressRunResult as CypressRunResult_V12 } from "../../../../../types/cypress/12.0.0/api";
import type { CypressRunResultType } from "../../../../../types/cypress/cypress";
import type { InternalCypressXrayPluginOptions } from "../../../../../types/plugin";
import { dedent } from "../../../../../util/dedent";
import { LOG } from "../../../../../util/logging";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { ConvertCypressTestsCommand } from "./convert-cypress-tests-command";

describe(relative(cwd(), __filename), async () => {
    await describe(ConvertCypressTestsCommand.name, async () => {
        let options: InternalCypressXrayPluginOptions;
        beforeEach(() => {
            options = {
                http: {},
                jira: globalContext.initJiraOptions(
                    {},
                    {
                        projectKey: "CYP",
                        url: "http://localhost:1234",
                    }
                ),
                plugin: globalContext.initPluginOptions({}, {}),
                xray: globalContext.initXrayOptions(
                    {},
                    {
                        uploadResults: true,
                    }
                ),
            };
        });

        await describe("<13", async () => {
            await it("converts test results into xray results json", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const result = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                ) as CypressRunResult_V12;
                const command = new ConvertCypressTestsCommand(
                    {
                        evidenceCollection: new SimpleEvidenceCollection(),
                        featureFileExtension: options.cucumber?.featureFileExtension,
                        iterationParameterCollection: new SimpleIterationParameterCollection(),
                        normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                        projectKey: options.jira.projectKey,
                        uploadLastAttempt: false,
                        uploadScreenshots: options.xray.uploadScreenshots,
                        xrayStatus: options.xray.status,
                    },
                    LOG,
                    new ConstantCommand(LOG, result)
                );
                const json = await command.compute();
                assert.deepStrictEqual(json, [
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
                ]);
            });

            await it("converts test results with multiple issue keys into xray results json", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const result = JSON.parse(
                    readFileSync(
                        "./test/resources/runResultExistingTestIssuesMultiple.json",
                        "utf-8"
                    )
                ) as CypressRunResult_V12;
                const command = new ConvertCypressTestsCommand(
                    {
                        evidenceCollection: new SimpleEvidenceCollection(),
                        featureFileExtension: options.cucumber?.featureFileExtension,
                        iterationParameterCollection: new SimpleIterationParameterCollection(),
                        normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                        projectKey: options.jira.projectKey,
                        uploadLastAttempt: false,
                        uploadScreenshots: options.xray.uploadScreenshots,
                        xrayStatus: options.xray.status,
                    },
                    LOG,
                    new ConstantCommand(LOG, result)
                );
                const json = await command.compute();
                assert.deepStrictEqual(json, [
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
                ]);
            });
        });

        await describe(">=13", async () => {
            await it("converts test results into xray results json", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
                ) as CypressCommandLine.CypressRunResult;
                const command = new ConvertCypressTestsCommand(
                    {
                        evidenceCollection: new SimpleEvidenceCollection(),
                        featureFileExtension: options.cucumber?.featureFileExtension,
                        iterationParameterCollection: new SimpleIterationParameterCollection(),
                        normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                        projectKey: options.jira.projectKey,
                        uploadLastAttempt: false,
                        uploadScreenshots: options.xray.uploadScreenshots,
                        xrayStatus: options.xray.status,
                    },
                    LOG,
                    new ConstantCommand(LOG, result)
                );
                const json = await command.compute();
                assert.deepStrictEqual(json, [
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
                ]);
            });

            await it("converts test results with multiple issue keys into xray results json", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync(
                        "./test/resources/runResult_13_0_0_multipleTestIssueKeys.json",
                        "utf-8"
                    )
                ) as CypressCommandLine.CypressRunResult;
                const command = new ConvertCypressTestsCommand(
                    {
                        evidenceCollection: new SimpleEvidenceCollection(),
                        featureFileExtension: options.cucumber?.featureFileExtension,
                        iterationParameterCollection: new SimpleIterationParameterCollection(),
                        normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                        projectKey: options.jira.projectKey,
                        uploadLastAttempt: false,
                        uploadScreenshots: options.xray.uploadScreenshots,
                        xrayStatus: options.xray.status,
                    },
                    LOG,
                    new ConstantCommand(LOG, result)
                );
                const json = await command.compute();
                assert.deepStrictEqual(json, [
                    {
                        finish: "2023-09-09T10:59:29Z",
                        start: "2023-09-09T10:59:28Z",
                        status: "PASS",
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
                ]);
            });

            await it("warns about non-attributable screenshots", async (context) => {
                const message = context.mock.method(LOG, "message", context.mock.fn());
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
                ) as CypressCommandLine.CypressRunResult;
                result.runs[0].screenshots[0].path = join(".", "test", "resources", "small.png");
                const command = new ConvertCypressTestsCommand(
                    {
                        evidenceCollection: new SimpleEvidenceCollection(),
                        featureFileExtension: options.cucumber?.featureFileExtension,
                        iterationParameterCollection: new SimpleIterationParameterCollection(),
                        normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                        projectKey: options.jira.projectKey,
                        uploadLastAttempt: false,
                        uploadScreenshots: options.xray.uploadScreenshots,
                        xrayStatus: options.xray.status,
                    },
                    LOG,
                    new ConstantCommand(LOG, result)
                );
                const json = await command.compute();

                assert.deepStrictEqual(json, [
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
                ]);
                assert.deepStrictEqual(message.mock.calls[0].arguments, [
                    "warning",
                    dedent(`
                        ${join(".", "test", "resources", "small.png")}

                          Screenshot cannot be attributed to a test and will not be uploaded.

                          To upload screenshots, include test issue keys anywhere in their name:

                            cy.screenshot("CYP-123 small")
                    `),
                ]);
            });

            await it("uses default iterated passing statuses", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const result: CypressRunResultType = JSON.parse(
                    readFileSync("./test/resources/iteratedResult_13_16_0.json", "utf-8")
                ) as CypressRunResultType;
                result.runs[0].tests[0].attempts[0].state = "passed";
                result.runs[0].tests[0].attempts[1].state = "passed";
                result.runs[0].tests[0].attempts[2].state = "passed";
                result.runs[0].tests[1].attempts[0].state = "passed";
                const command = new ConvertCypressTestsCommand(
                    {
                        evidenceCollection: new SimpleEvidenceCollection(),
                        iterationParameterCollection: new SimpleIterationParameterCollection(),
                        normalizeScreenshotNames: false,
                        projectKey: "CYP",
                        uploadLastAttempt: false,
                        uploadScreenshots: true,
                        useCloudStatusFallback: true,
                        xrayStatus: options.xray.status,
                    },
                    LOG,
                    new ConstantCommand(LOG, result)
                );
                const tests = await command.compute();
                assert.strictEqual(tests[0].status, "PASSED");
                assert.ok(tests[0].iterations);
                assert.strictEqual(tests[0].iterations[0].status, "PASSED");
                assert.strictEqual(tests[0].iterations[1].status, "PASSED");
                assert.strictEqual(tests[0].iterations[2].status, "PASSED");
                assert.strictEqual(tests[0].iterations[3].status, "PASSED");
            });

            await it("uses default iterated pending statuses", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const result: CypressRunResultType = JSON.parse(
                    readFileSync("./test/resources/iteratedResult_13_16_0.json", "utf-8")
                ) as CypressRunResultType;
                result.runs[0].tests[0].attempts[0].state = "pending";
                result.runs[0].tests[0].attempts[1].state = "pending";
                result.runs[0].tests[0].attempts[2].state = "pending";
                result.runs[0].tests[1].attempts[0].state = "pending";
                const command = new ConvertCypressTestsCommand(
                    {
                        evidenceCollection: new SimpleEvidenceCollection(),
                        iterationParameterCollection: new SimpleIterationParameterCollection(),
                        normalizeScreenshotNames: false,
                        projectKey: "CYP",
                        uploadLastAttempt: false,
                        uploadScreenshots: true,
                        useCloudStatusFallback: true,
                        xrayStatus: options.xray.status,
                    },
                    LOG,
                    new ConstantCommand(LOG, result)
                );
                const tests = await command.compute();
                assert.strictEqual(tests[0].status, "TO DO");
                assert.ok(tests[0].iterations);
                assert.strictEqual(tests[0].iterations[0].status, "TO DO");
                assert.strictEqual(tests[0].iterations[1].status, "TO DO");
                assert.strictEqual(tests[0].iterations[2].status, "TO DO");
                assert.strictEqual(tests[0].iterations[3].status, "TO DO");
            });

            await it("uses default iterated skipped statuses", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const result: CypressRunResultType = JSON.parse(
                    readFileSync("./test/resources/iteratedResult_13_16_0.json", "utf-8")
                ) as CypressRunResultType;
                result.runs[0].tests[0].attempts[0].state = "pending";
                result.runs[0].tests[0].attempts[1].state = "pending";
                result.runs[0].tests[0].attempts[2].state = "pending";
                result.runs[0].tests[1].attempts[0].state = "skipped";
                const command = new ConvertCypressTestsCommand(
                    {
                        evidenceCollection: new SimpleEvidenceCollection(),
                        iterationParameterCollection: new SimpleIterationParameterCollection(),
                        normalizeScreenshotNames: false,
                        projectKey: "CYP",
                        uploadLastAttempt: false,
                        uploadScreenshots: true,
                        useCloudStatusFallback: true,
                        xrayStatus: options.xray.status,
                    },
                    LOG,
                    new ConstantCommand(LOG, result)
                );
                const tests = await command.compute();
                assert.strictEqual(tests[0].status, "FAILED");
                assert.ok(tests[0].iterations);
                assert.strictEqual(tests[0].iterations[0].status, "TO DO");
                assert.strictEqual(tests[0].iterations[1].status, "TO DO");
                assert.strictEqual(tests[0].iterations[2].status, "TO DO");
                assert.strictEqual(tests[0].iterations[3].status, "FAILED");
            });

            await it("uses default iterated failed statuses", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const result: CypressRunResultType = JSON.parse(
                    readFileSync("./test/resources/iteratedResult_13_16_0.json", "utf-8")
                ) as CypressRunResultType;
                const command = new ConvertCypressTestsCommand(
                    {
                        evidenceCollection: new SimpleEvidenceCollection(),
                        iterationParameterCollection: new SimpleIterationParameterCollection(),
                        normalizeScreenshotNames: false,
                        projectKey: "CYP",
                        uploadLastAttempt: false,
                        uploadScreenshots: true,
                        useCloudStatusFallback: true,
                        xrayStatus: options.xray.status,
                    },
                    LOG,
                    new ConstantCommand(LOG, result)
                );
                const tests = await command.compute();
                assert.strictEqual(tests[0].status, "FAILED");
                assert.ok(tests[0].iterations);
                assert.strictEqual(tests[0].iterations[0].status, "FAILED");
                assert.strictEqual(tests[0].iterations[1].status, "FAILED");
                assert.strictEqual(tests[0].iterations[2].status, "PASSED");
                assert.strictEqual(tests[0].iterations[3].status, "PASSED");
            });

            await it("uses custom aggregated statuses", async (context) => {
                context.mock.method(LOG, "message", context.mock.fn());
                const result: CypressRunResultType = JSON.parse(
                    readFileSync("./test/resources/iteratedResult_13_16_0.json", "utf-8")
                ) as CypressRunResultType;
                const command = new ConvertCypressTestsCommand(
                    {
                        evidenceCollection: new SimpleEvidenceCollection(),
                        iterationParameterCollection: new SimpleIterationParameterCollection(),
                        normalizeScreenshotNames: false,
                        projectKey: "CYP",
                        uploadLastAttempt: false,
                        uploadScreenshots: true,
                        useCloudStatusFallback: true,
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
                    LOG,
                    new ConstantCommand(LOG, result)
                );
                const tests = await command.compute();
                assert.strictEqual(tests[0].status, "FLAKY");
                assert.ok(tests[0].iterations);
                assert.strictEqual(tests[0].iterations[0].status, "FAILED");
                assert.strictEqual(tests[0].iterations[1].status, "FAILED");
                assert.strictEqual(tests[0].iterations[2].status, "PASSED");
                assert.strictEqual(tests[0].iterations[3].status, "PASSED");
            });
        });

        await it("skips tests when encountering unknown statuses", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultUnknownStatus.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            await assert.rejects(command.compute(), {
                message:
                    "Failed to convert Cypress tests into Xray tests: No Cypress tests to upload",
            });
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                "warning",
                dedent(`
                    Test: TodoMVC hides footer initially

                      Skipping result upload.

                        Caused by: Unknown Cypress test status: broken
                `),
            ]);
            assert.deepStrictEqual(message.mock.calls[1].arguments, [
                "warning",
                dedent(`
                    Test: TodoMVC adds 2 todos

                      Skipping result upload.

                        Caused by: Unknown Cypress test status: california
                `),
            ]);
        });

        await it("uploads screenshots by default", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();

            assert.strictEqual(tests[0].evidence, undefined);
            assert.strictEqual(tests[1].evidence, undefined);
            assert.strictEqual(tests[2].evidence?.length, 1);
            assert.strictEqual(tests[2].evidence[0].filename, "small.png");
        });

        await it("skips cucumber screenshots", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResult_13_0_0_mixed.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            result.runs[0].screenshots[0].path = join(
                ".",
                "test",
                "resources",
                "small CYP-237.png"
            );
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: ".feature",
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: false,
                    projectKey: "CYP",
                    uploadLastAttempt: false,
                    uploadScreenshots: true,
                    xrayStatus: {},
                },
                LOG,
                new ConstantCommand(LOG, result)
            );

            const tests = await command.compute();

            assert.strictEqual(message.mock.callCount(), 0);
            assert.strictEqual(tests.length, 1);
            assert.strictEqual(tests[0].evidence?.length, 1);
            assert.strictEqual(tests[0].evidence[0].filename, "small CYP-237.png");
        });

        await it("skips screenshot upload if disabled", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.uploadScreenshots = false;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();

            assert.strictEqual(tests[0].evidence, undefined);
            assert.strictEqual(tests[1].evidence, undefined);
            assert.strictEqual(tests[2].evidence, undefined);
        });

        await it("normalizes screenshot filenames if enabled", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
            ) as CypressRunResultType;
            options.plugin.normalizeScreenshotNames = true;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();

            assert.strictEqual(tests[0].evidence?.length, 1);
            assert.strictEqual(tests[0].evidence[0].filename, "t_rtle_with_problem_tic_name.png");
        });

        await it("does not normalize screenshot filenames by default", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();

            assert.strictEqual(tests[0].evidence?.length, 1);
            assert.strictEqual(tests[0].evidence[0].filename, "tûrtle with problemätic name.png");
        });

        await it("includes all evidence", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const evidenceCollection = new SimpleEvidenceCollection();
            evidenceCollection.addEvidence("CYP-452", {
                contentType: "text/plain",
                data: "aGkgdGhlcmU=",
                filename: "hi.txt",
            });
            evidenceCollection.addEvidence("CYP-237", {
                contentType: "text/plain",
                data: "Z29vZGJ5ZQ==",
                filename: "goodbye.txt",
            });
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: evidenceCollection,
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();
            assert.deepStrictEqual(tests, [
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
                            contentType: "text/plain",
                            data: "Z29vZGJ5ZQ==",
                            filename: "goodbye.txt",
                        },
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
            ]);
        });

        await it("includes iteration parameters", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            result.runs[0].tests = [
                {
                    attempts: [{ state: "passed" }],
                    displayError: null,
                    duration: 638,
                    state: "passed",
                    title: ["something", "CYP-452 happens Bob"],
                },
                {
                    attempts: [{ state: "passed" }],
                    displayError: null,
                    duration: 25,
                    state: "passed",
                    title: ["something", "CYP-452 happens Jeff"],
                },
                {
                    attempts: [{ state: "failed" }],
                    displayError: null,
                    duration: 28,
                    state: "passed",
                    title: ["something", "CYP-237 happens Mary"],
                },
                {
                    attempts: [{ state: "failed" }],
                    displayError: null,
                    duration: 25,
                    state: "failed",
                    title: ["something", "CYP-237 happens Jane"],
                },
            ];
            const iterationParameterCollection = new SimpleIterationParameterCollection();
            iterationParameterCollection.setIterationParameters(
                "CYP-452",
                "something CYP-452 happens Bob",
                {
                    age: "42",
                    name: "Bob",
                }
            );
            iterationParameterCollection.setIterationParameters(
                "CYP-452",
                "something CYP-452 happens Jeff",
                {
                    age: "51",
                    name: "Jeff",
                }
            );
            iterationParameterCollection.setIterationParameters(
                "CYP-237",
                "something CYP-237 happens Mary",
                {
                    age: "32",
                    name: "Mary",
                }
            );
            iterationParameterCollection.setIterationParameters(
                "CYP-237",
                "something CYP-237 happens Jane",
                {
                    age: "19",
                    name: "Jane",
                }
            );
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: iterationParameterCollection,
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();
            assert.deepStrictEqual(tests, [
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
                    evidence: [
                        {
                            contentType: "image/png",
                            data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                            filename: "small CYP-237.png",
                        },
                    ],
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
            ]);
        });

        await it("uses custom passed statuses", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.status = { passed: "it worked" };
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();
            assert.strictEqual(tests[0].status, "it worked");
            assert.strictEqual(tests[1].status, "it worked");
        });

        await it("uses custom failed statuses", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.status = { failed: "it did not work" };
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();
            assert.strictEqual(tests[2].status, "it did not work");
        });

        await it("uses custom pending statuses", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultPending.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.status = { pending: "still pending" };
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();
            assert.strictEqual(tests[0].status, "still pending");
            assert.strictEqual(tests[1].status, "still pending");
            assert.strictEqual(tests[2].status, "still pending");
            assert.strictEqual(tests[3].status, "still pending");
        });

        await it("uses custom skipped statuses", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultSkipped.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.status = { skipped: "omit" };
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();
            assert.strictEqual(tests[1].status, "omit");
        });

        await it("uses default iterated passing statuses", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/iteratedResult.json", "utf-8")
            ) as CypressRunResultType;
            result.runs[0].tests[0].attempts[0].state = "passed";
            result.runs[0].tests[0].attempts[1].state = "passed";
            result.runs[0].tests[0].attempts[2].state = "passed";
            result.runs[0].tests[1].attempts[0].state = "passed";
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: false,
                    projectKey: "CYP",
                    uploadLastAttempt: false,
                    uploadScreenshots: true,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();
            assert.strictEqual(tests[0].status, "PASS");
            assert.ok(tests[0].iterations);
            assert.strictEqual(tests[0].iterations[0].status, "PASS");
            assert.strictEqual(tests[0].iterations[1].status, "PASS");
            assert.strictEqual(tests[0].iterations[2].status, "PASS");
            assert.strictEqual(tests[0].iterations[3].status, "PASS");
        });

        await it("uses default iterated pending statuses", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/iteratedResult.json", "utf-8")
            ) as CypressRunResultType;
            result.runs[0].tests[0].attempts[0].state = "pending";
            result.runs[0].tests[0].attempts[1].state = "pending";
            result.runs[0].tests[0].attempts[2].state = "pending";
            result.runs[0].tests[1].attempts[0].state = "pending";
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: false,
                    projectKey: "CYP",
                    uploadLastAttempt: false,
                    uploadScreenshots: true,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();
            assert.strictEqual(tests[0].status, "TODO");
            assert.ok(tests[0].iterations);
            assert.strictEqual(tests[0].iterations[0].status, "TODO");
            assert.strictEqual(tests[0].iterations[1].status, "TODO");
            assert.strictEqual(tests[0].iterations[2].status, "TODO");
            assert.strictEqual(tests[0].iterations[3].status, "TODO");
        });

        await it("uses default iterated skipped statuses", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/iteratedResult.json", "utf-8")
            ) as CypressRunResultType;
            result.runs[0].tests[0].attempts[0].state = "pending";
            result.runs[0].tests[0].attempts[1].state = "pending";
            result.runs[0].tests[0].attempts[2].state = "pending";
            result.runs[0].tests[1].attempts[0].state = "skipped";
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: false,
                    projectKey: "CYP",
                    uploadLastAttempt: false,
                    uploadScreenshots: true,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();
            assert.strictEqual(tests[0].status, "FAIL");
            assert.ok(tests[0].iterations);
            assert.strictEqual(tests[0].iterations[0].status, "TODO");
            assert.strictEqual(tests[0].iterations[1].status, "TODO");
            assert.strictEqual(tests[0].iterations[2].status, "TODO");
            assert.strictEqual(tests[0].iterations[3].status, "FAIL");
        });

        await it("uses default iterated failed statuses", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/iteratedResult.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: false,
                    projectKey: "CYP",
                    uploadLastAttempt: false,
                    uploadScreenshots: true,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();
            assert.strictEqual(tests[0].status, "FAIL");
            assert.ok(tests[0].iterations);
            assert.strictEqual(tests[0].iterations[0].status, "FAIL");
            assert.strictEqual(tests[0].iterations[1].status, "FAIL");
            assert.strictEqual(tests[0].iterations[2].status, "PASS");
            assert.strictEqual(tests[0].iterations[3].status, "PASS");
        });

        await it("uses custom aggregated statuses", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/iteratedResult.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: false,
                    projectKey: "CYP",
                    uploadLastAttempt: false,
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
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();
            assert.strictEqual(tests[0].status, "FLAKY");
            assert.ok(tests[0].iterations);
            assert.strictEqual(tests[0].iterations[0].status, "FAIL");
            assert.strictEqual(tests[0].iterations[1].status, "FAIL");
            assert.strictEqual(tests[0].iterations[2].status, "PASS");
            assert.strictEqual(tests[0].iterations[3].status, "PASS");
        });

        await it("does not modify test information", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();

            assert.strictEqual(tests[0].testInfo, undefined);
            assert.strictEqual(tests[1].testInfo, undefined);
            assert.strictEqual(tests[2].testInfo, undefined);
        });

        await it("includes test issue keys", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();

            assert.strictEqual(tests[0].testKey, "CYP-40");
            assert.strictEqual(tests[1].testKey, "CYP-41");
            assert.strictEqual(tests[2].testKey, "CYP-49");
        });

        await it("defaults to server status values", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();

            assert.strictEqual(tests[0].status, "PASS");
            assert.strictEqual(tests[1].status, "PASS");
            assert.strictEqual(tests[2].status, "FAIL");
        });

        await it("uses cloud status values", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    useCloudStatusFallback: true,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            const tests = await command.compute();
            assert.strictEqual(tests[0].status, "PASSED");
            assert.strictEqual(tests[1].status, "PASSED");
            assert.strictEqual(tests[2].status, "FAILED");
        });

        await it("throws if no native cypress tests were executed", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: ".ts",
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadLastAttempt: false,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            await assert.rejects(command.compute(), {
                message: "Failed to extract test run data: Only Cucumber tests were executed",
            });
        });

        await it("returns its parameters", (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    iterationParameterCollection: new SimpleIterationParameterCollection(),
                    normalizeScreenshotNames: true,
                    projectKey: "CYP",
                    uploadLastAttempt: false,
                    uploadScreenshots: false,
                    xrayStatus: {
                        failed: "FAILED",
                        passed: "PASSED",
                        pending: "TODO",
                        skipped: "TODO",
                    },
                },
                LOG,
                new ConstantCommand(LOG, result)
            );
            assert.deepStrictEqual(command.getParameters(), {
                evidenceCollection: new SimpleEvidenceCollection(),
                iterationParameterCollection: new SimpleIterationParameterCollection(),
                normalizeScreenshotNames: true,
                projectKey: "CYP",
                uploadLastAttempt: false,
                uploadScreenshots: false,
                xrayStatus: {
                    failed: "FAILED",
                    passed: "PASSED",
                    pending: "TODO",
                    skipped: "TODO",
                },
            });
        });
    });
});
