import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import fs, { readFileSync } from "fs";
import path from "path";
import Sinon from "sinon";
import { getMockedLogger } from "../../../../../../test/mocks.js";
import { expectToExist } from "../../../../../../test/util.js";
import {
    SimpleEvidenceCollection,
    initJiraOptions,
    initPluginOptions,
    initXrayOptions,
} from "../../../../../context.js";
import type { CypressRunResult as CypressRunResult_V12 } from "../../../../../types/cypress/12.0.0/api.js";
import type { CypressRunResultType } from "../../../../../types/cypress/cypress.js";
import type { InternalCypressXrayPluginOptions } from "../../../../../types/plugin.js";
import { dedent } from "../../../../../util/dedent.js";
import { Level } from "../../../../../util/logging.js";
import { ConstantCommand } from "../../../../util/commands/constant-command.js";
import { ConvertCypressTestsCommand } from "./convert-cypress-tests-command.js";

chai.use(chaiAsPromised);

await describe(path.relative(process.cwd(), import.meta.filename), () => {
    await describe(ConvertCypressTestsCommand.name, () => {
        let options: InternalCypressXrayPluginOptions;
        beforeEach(() => {
            options = {
                http: {},
                jira: initJiraOptions(
                    {},
                    {
                        projectKey: "CYP",
                        url: "https://example.org",
                    }
                ),
                plugin: initPluginOptions({}, {}),
                xray: initXrayOptions(
                    {},
                    {
                        uploadResults: true,
                    }
                ),
            };
        });

        await describe("<13", () => {
            await it("converts test results into xray results json", async () => {
                const logger = getMockedLogger();
                const result = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                ) as CypressRunResult_V12;
                const command = new ConvertCypressTestsCommand(
                    {
                        evidenceCollection: new SimpleEvidenceCollection(),
                        featureFileExtension: options.cucumber?.featureFileExtension,
                        normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                        projectKey: options.jira.projectKey,
                        uploadScreenshots: options.xray.uploadScreenshots,
                        xrayStatus: options.xray.status,
                    },
                    logger,
                    new ConstantCommand(logger, result)
                );
                const json = await command.compute();
                expect(json).to.deep.eq([
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

            await it("converts test results with multiple issue keys into xray results json", async () => {
                const logger = getMockedLogger();
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
                        normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                        projectKey: options.jira.projectKey,
                        uploadScreenshots: options.xray.uploadScreenshots,
                        xrayStatus: options.xray.status,
                    },
                    logger,
                    new ConstantCommand(logger, result)
                );
                const json = await command.compute();
                expect(json).to.deep.eq([
                    {
                        evidence: [
                            {
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

        await describe(">=13", () => {
            await it("converts test results into xray results json", async () => {
                const logger = getMockedLogger();
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
                ) as CypressCommandLine.CypressRunResult;
                const command = new ConvertCypressTestsCommand(
                    {
                        evidenceCollection: new SimpleEvidenceCollection(),
                        featureFileExtension: options.cucumber?.featureFileExtension,
                        normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                        projectKey: options.jira.projectKey,
                        uploadScreenshots: options.xray.uploadScreenshots,
                        xrayStatus: options.xray.status,
                    },
                    logger,
                    new ConstantCommand(logger, result)
                );
                const json = await command.compute();
                expect(json).to.deep.eq([
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

            await it("converts test results with multiple issue keys into xray results json", async () => {
                const logger = getMockedLogger();
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
                        normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                        projectKey: options.jira.projectKey,
                        uploadScreenshots: options.xray.uploadScreenshots,
                        xrayStatus: options.xray.status,
                    },
                    logger,
                    new ConstantCommand(logger, result)
                );
                const json = await command.compute();
                expect(json).to.deep.eq([
                    {
                        finish: "2023-09-09T10:59:29Z",
                        start: "2023-09-09T10:59:28Z",
                        status: "PASS",
                        testKey: "CYP-452",
                    },
                    {
                        evidence: [
                            {
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

            await it("warns about non-attributable screenshots", async () => {
                const logger = getMockedLogger();
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
                ) as CypressCommandLine.CypressRunResult;
                result.runs[0].screenshots[0].path = "./test/resources/small.png";
                const command = new ConvertCypressTestsCommand(
                    {
                        evidenceCollection: new SimpleEvidenceCollection(),
                        featureFileExtension: options.cucumber?.featureFileExtension,
                        normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                        projectKey: options.jira.projectKey,
                        uploadScreenshots: options.xray.uploadScreenshots,
                        xrayStatus: options.xray.status,
                    },
                    logger,
                    new ConstantCommand(logger, result)
                );
                const json = await command.compute();
                expect(json).to.deep.eq([
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
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.WARNING,
                    dedent(`
                        ./test/resources/small.png

                          Screenshot cannot be attributed to a test and will not be uploaded.

                          To upload screenshots, include test issue keys anywhere in their name:

                            cy.screenshot("CYP-123 small")
                    `)
                );
            });
        });

        await it("skips tests when encountering unknown statuses", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultUnknownStatus.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                "Failed to convert Cypress tests into Xray tests: No Cypress tests to upload"
            );
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Test: TodoMVC hides footer initially

                      Skipping result upload.

                        Caused by: Unknown Cypress test status: broken
                `)
            );
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Test: TodoMVC adds 2 todos

                      Skipping result upload.

                        Caused by: Unknown Cypress test status: california
                `)
            );
        });

        await it("uploads screenshots by default", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expectToExist(tests);
            expect(tests[0].evidence).to.be.undefined;
            expect(tests[1].evidence).to.be.undefined;
            expect(tests[2].evidence).to.be.an("array").with.length(1);
            expectToExist(tests[2].evidence);
            expect(tests[2].evidence[0].filename).to.eq("small.png");
        });

        await it("skips cucumber screenshots", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResult_13_0_0_mixed.json", "utf-8")
            ) as CypressRunResultType;
            const mockedFs = Sinon.stub(fs);
            mockedFs.readFileSync.onFirstCall().returns(Buffer.from("abcdef"));
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: ".feature",
                    normalizeScreenshotNames: false,
                    projectKey: "CYP",
                    uploadScreenshots: true,
                    xrayStatus: {},
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(logger.message).to.not.have.been.called;
            expect(tests).to.have.length(1);
            expectToExist(tests[0].evidence);
            expect(tests[0].evidence[0].filename).to.eq(
                "CYP-665 Test results of grouped test steps -- should do A (failed).png"
            );
        });

        await it("skips screenshot upload if disabled", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.uploadScreenshots = false;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expectToExist(tests);
            expect(tests).to.have.length(3);
            expect(tests[0].evidence).to.be.undefined;
            expect(tests[1].evidence).to.be.undefined;
            expect(tests[2].evidence).to.be.undefined;
        });

        await it("normalizes screenshot filenames if enabled", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
            ) as CypressRunResultType;
            options.plugin.normalizeScreenshotNames = true;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expectToExist(tests);
            expectToExist(tests[0].evidence);
            expect(tests[0].evidence[0].filename).to.eq("t_rtle_with_problem_tic_name.png");
        });

        await it("does not normalize screenshot filenames by default", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expectToExist(tests);
            expectToExist(tests[0].evidence);
            expect(tests[0].evidence[0].filename).to.eq("tûrtle with problemätic name.png");
        });

        await it("includes all evidence", async () => {
            const logger = getMockedLogger();
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
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests).to.deep.eq([
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

        await it("uses custom passed statuses", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.status = { passed: "it worked" };
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[0].status).to.eq("it worked");
            expect(tests[1].status).to.eq("it worked");
        });

        await it("uses custom failed statuses", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.status = { failed: "it did not work" };
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[2].status).to.eq("it did not work");
        });

        await it("uses custom pending statuses", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultPending.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.status = { pending: "still pending" };
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[0].status).to.eq("still pending");
            expect(tests[1].status).to.eq("still pending");
            expect(tests[2].status).to.eq("still pending");
            expect(tests[3].status).to.eq("still pending");
        });

        await it("uses custom skipped statuses", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultSkipped.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.status = { skipped: "omit" };
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[1].status).to.eq("omit");
        });

        await it("does not modify test information", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[0].testInfo).to.be.undefined;
            expect(tests[1].testInfo).to.be.undefined;
            expect(tests[2].testInfo).to.be.undefined;
        });

        await it("includes test issue keys", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[0].testKey).to.eq("CYP-40");
            expect(tests[1].testKey).to.eq("CYP-41");
            expect(tests[2].testKey).to.eq("CYP-49");
        });

        await it("defaults to server status values", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[0].status).to.eq("PASS");
            expect(tests[1].status).to.eq("PASS");
            expect(tests[2].status).to.eq("FAIL");
        });

        await it("uses cloud status values", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: options.cucumber?.featureFileExtension,
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    useCloudStatusFallback: true,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[0].status).to.eq("PASSED");
            expect(tests[1].status).to.eq("PASSED");
            expect(tests[2].status).to.eq("FAILED");
        });

        await it("throws if no native cypress tests were executed", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    featureFileExtension: ".ts",
                    normalizeScreenshotNames: options.plugin.normalizeScreenshotNames,
                    projectKey: options.jira.projectKey,
                    uploadScreenshots: options.xray.uploadScreenshots,
                    xrayStatus: options.xray.status,
                },
                logger,
                new ConstantCommand(logger, result)
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                "Failed to extract test run data: Only Cucumber tests were executed"
            );
        });

        await it("returns its parameters", () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    evidenceCollection: new SimpleEvidenceCollection(),
                    normalizeScreenshotNames: true,
                    projectKey: "CYP",
                    uploadScreenshots: false,
                    xrayStatus: {
                        failed: "FAILED",
                        passed: "PASSED",
                        pending: "TODO",
                        skipped: "TODO",
                    },
                },
                logger,
                new ConstantCommand(logger, result)
            );
            expect(command.getParameters()).to.deep.eq({
                evidenceCollection: new SimpleEvidenceCollection(),
                normalizeScreenshotNames: true,
                projectKey: "CYP",
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
