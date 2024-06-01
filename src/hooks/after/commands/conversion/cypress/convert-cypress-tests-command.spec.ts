import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { readFileSync } from "fs";
import path from "path";
import { getMockedLogger } from "../../../../../../test/mocks";
import { expectToExist } from "../../../../../../test/util";
import {
    SimpleEvidenceCollection,
    initJiraOptions,
    initPluginOptions,
    initXrayOptions,
} from "../../../../../context";
import { CypressRunResult as CypressRunResult_V12 } from "../../../../../types/cypress/12.0.0/api";
import { CypressRunResultType } from "../../../../../types/cypress/cypress";
import { InternalCypressXrayPluginOptions } from "../../../../../types/plugin";
import { dedent } from "../../../../../util/dedent";
import { Level } from "../../../../../util/logging";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { ConvertCypressTestsCommand } from "./convert-cypress-tests-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(ConvertCypressTestsCommand.name, () => {
        let options: InternalCypressXrayPluginOptions;
        beforeEach(() => {
            options = {
                jira: initJiraOptions(
                    {},
                    {
                        projectKey: "CYP",
                        url: "https://example.org",
                    }
                ),
                xray: initXrayOptions(
                    {},
                    {
                        uploadResults: true,
                    }
                ),
                plugin: initPluginOptions({}, {}),
                http: {},
            };
        });

        describe("<13", () => {
            it("converts test results into xray info json", async () => {
                const logger = getMockedLogger();
                const result: CypressRunResult_V12 = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                ) as CypressRunResult_V12;
                const command = new ConvertCypressTestsCommand(
                    { ...options, evidenceCollection: new SimpleEvidenceCollection() },
                    logger,
                    new ConstantCommand(logger, result)
                );
                const json = await command.compute();
                expect(json).to.deep.eq([
                    {
                        testKey: "CYP-40",
                        start: "2022-11-28T17:41:15Z",
                        finish: "2022-11-28T17:41:15Z",
                        status: "PASS",
                    },
                    {
                        testKey: "CYP-41",
                        start: "2022-11-28T17:41:15Z",
                        finish: "2022-11-28T17:41:15Z",
                        status: "PASS",
                    },
                    {
                        testKey: "CYP-49",
                        start: "2022-11-28T17:41:15Z",
                        finish: "2022-11-28T17:41:19Z",
                        status: "FAIL",
                        evidence: [
                            {
                                data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                                filename: "small.png",
                            },
                        ],
                    },
                ]);
            });
        });

        describe(">=13", () => {
            it("converts test results into xray info json", async () => {
                const logger = getMockedLogger();
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
                ) as CypressCommandLine.CypressRunResult;
                const command = new ConvertCypressTestsCommand(
                    { ...options, evidenceCollection: new SimpleEvidenceCollection() },
                    logger,
                    new ConstantCommand(logger, result)
                );
                const json = await command.compute();
                expect(json).to.deep.eq([
                    {
                        testKey: "CYP-452",
                        start: "2023-09-09T10:59:28Z",
                        finish: "2023-09-09T10:59:29Z",
                        status: "PASS",
                    },
                    {
                        testKey: "CYP-268",
                        start: "2023-09-09T10:59:29Z",
                        finish: "2023-09-09T10:59:29Z",
                        status: "PASS",
                    },
                    {
                        testKey: "CYP-237",
                        start: "2023-09-09T10:59:29Z",
                        finish: "2023-09-09T10:59:29Z",
                        status: "FAIL",
                        evidence: [
                            {
                                data: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAoSURBVBhXY/iPA4AkGBig0hAGlISz4AwUCTggWgJIwhlESGAB//8DAAF4fYMJdJTzAAAAAElFTkSuQmCC",
                                filename: "small CYP-237.png",
                            },
                        ],
                    },
                    {
                        testKey: "CYP-332",
                        start: "2023-09-09T10:59:29Z",
                        finish: "2023-09-09T10:59:29Z",
                        status: "FAIL",
                    },
                    {
                        testKey: "CYP-333",
                        start: "2023-09-09T10:59:29Z",
                        finish: "2023-09-09T10:59:29Z",
                        status: "TODO",
                    },
                ]);
            });

            it("warns about non-attributable screenshots", async () => {
                const logger = getMockedLogger();
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
                ) as CypressCommandLine.CypressRunResult;
                result.runs[0].screenshots[0].path = "./test/resources/small.png";
                const command = new ConvertCypressTestsCommand(
                    { ...options, evidenceCollection: new SimpleEvidenceCollection() },
                    logger,
                    new ConstantCommand(logger, result)
                );
                const json = await command.compute();
                expect(json).to.deep.eq([
                    {
                        testKey: "CYP-452",
                        start: "2023-09-09T10:59:28Z",
                        finish: "2023-09-09T10:59:29Z",
                        status: "PASS",
                    },
                    {
                        testKey: "CYP-268",
                        start: "2023-09-09T10:59:29Z",
                        finish: "2023-09-09T10:59:29Z",
                        status: "PASS",
                    },
                    {
                        testKey: "CYP-237",
                        start: "2023-09-09T10:59:29Z",
                        finish: "2023-09-09T10:59:29Z",
                        status: "FAIL",
                    },
                    {
                        testKey: "CYP-332",
                        start: "2023-09-09T10:59:29Z",
                        finish: "2023-09-09T10:59:29Z",
                        status: "FAIL",
                    },
                    {
                        testKey: "CYP-333",
                        start: "2023-09-09T10:59:29Z",
                        finish: "2023-09-09T10:59:29Z",
                        status: "TODO",
                    },
                ]);
                expect(logger.message).to.have.been.calledWithExactly(
                    Level.WARNING,
                    dedent(`
                        Screenshot will not be uploaded: ./test/resources/small.png

                        To upload screenshots, include a test issue key anywhere in their names:

                          cy.screenshot("CYP-123 small")
                    `)
                );
            });
        });

        it("skips tests when encountering unknown statuses", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultUnknownStatus.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                { ...options, evidenceCollection: new SimpleEvidenceCollection() },
                logger,
                new ConstantCommand(logger, result)
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                "Failed to convert Cypress tests into Xray tests: No Cypress tests to upload"
            );
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Skipping result upload for test: TodoMVC hides footer initially

                    Unknown Cypress test status: broken
                `)
            );
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Skipping result upload for test: TodoMVC adds 2 todos

                    Unknown Cypress test status: california
                `)
            );
        });

        it("uploads screenshots by default", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                { ...options, evidenceCollection: new SimpleEvidenceCollection() },
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

        it("skips screenshot upload if disabled", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.uploadScreenshots = false;
            const command = new ConvertCypressTestsCommand(
                { ...options, evidenceCollection: new SimpleEvidenceCollection() },
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

        it("normalizes screenshot filenames if enabled", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
            ) as CypressRunResultType;
            options.plugin.normalizeScreenshotNames = true;
            const command = new ConvertCypressTestsCommand(
                { ...options, evidenceCollection: new SimpleEvidenceCollection() },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expectToExist(tests);
            expectToExist(tests[0].evidence);
            expect(tests[0].evidence[0].filename).to.eq("t_rtle_with_problem_tic_name.png");
        });

        it("does not normalize screenshot filenames by default", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                { ...options, evidenceCollection: new SimpleEvidenceCollection() },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expectToExist(tests);
            expectToExist(tests[0].evidence);
            expect(tests[0].evidence[0].filename).to.eq("tûrtle with problemätic name.png");
        });

        it("uses custom passed statuses", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.status = { passed: "it worked" };
            const command = new ConvertCypressTestsCommand(
                { ...options, evidenceCollection: new SimpleEvidenceCollection() },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[0].status).to.eq("it worked");
            expect(tests[1].status).to.eq("it worked");
        });

        it("uses custom failed statuses", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.status = { failed: "it did not work" };
            const command = new ConvertCypressTestsCommand(
                { ...options, evidenceCollection: new SimpleEvidenceCollection() },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[2].status).to.eq("it did not work");
        });

        it("uses custom pending statuses", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultPending.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.status = { pending: "still pending" };
            const command = new ConvertCypressTestsCommand(
                { ...options, evidenceCollection: new SimpleEvidenceCollection() },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[0].status).to.eq("still pending");
            expect(tests[1].status).to.eq("still pending");
            expect(tests[2].status).to.eq("still pending");
            expect(tests[3].status).to.eq("still pending");
        });

        it("uses custom skipped statuses", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultSkipped.json", "utf-8")
            ) as CypressRunResultType;
            options.xray.status = { skipped: "omit" };
            const command = new ConvertCypressTestsCommand(
                { ...options, evidenceCollection: new SimpleEvidenceCollection() },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[1].status).to.eq("omit");
        });

        it("does not modify test information", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                { ...options, evidenceCollection: new SimpleEvidenceCollection() },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[0].testInfo).to.be.undefined;
            expect(tests[1].testInfo).to.be.undefined;
            expect(tests[2].testInfo).to.be.undefined;
        });

        it("includes test issue keys", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                { ...options, evidenceCollection: new SimpleEvidenceCollection() },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[0].testKey).to.eq("CYP-40");
            expect(tests[1].testKey).to.eq("CYP-41");
            expect(tests[2].testKey).to.eq("CYP-49");
        });

        it("defaults to server status values", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                { ...options, evidenceCollection: new SimpleEvidenceCollection() },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[0].status).to.eq("PASS");
            expect(tests[1].status).to.eq("PASS");
            expect(tests[2].status).to.eq("FAIL");
        });

        it("uses cloud status values", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    ...options,
                    useCloudStatusFallback: true,
                    evidenceCollection: new SimpleEvidenceCollection(),
                },
                logger,
                new ConstantCommand(logger, result)
            );
            const tests = await command.compute();
            expect(tests[0].status).to.eq("PASSED");
            expect(tests[1].status).to.eq("PASSED");
            expect(tests[2].status).to.eq("FAILED");
        });

        it("throws if no native cypress tests were executed", async () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    ...options,
                    cucumber: { featureFileExtension: ".ts" },
                    useCloudStatusFallback: true,
                    evidenceCollection: new SimpleEvidenceCollection(),
                },
                logger,
                new ConstantCommand(logger, result)
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                "Failed to extract test run data: Only Cucumber tests were executed"
            );
        });

        it("returns its parameters", () => {
            const logger = getMockedLogger();
            const result: CypressRunResultType = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ConvertCypressTestsCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    xray: {
                        status: {
                            failed: "FAILED",
                            passed: "PASSED",
                            pending: "TODO",
                            skipped: "TODO",
                        },
                        uploadScreenshots: false,
                    },
                    plugin: {
                        normalizeScreenshotNames: true,
                    },
                    evidenceCollection: new SimpleEvidenceCollection(),
                },
                logger,
                new ConstantCommand(logger, result)
            );
            expect(command.getParameters()).to.deep.eq({
                jira: {
                    projectKey: "CYP",
                },
                xray: {
                    status: {
                        failed: "FAILED",
                        passed: "PASSED",
                        pending: "TODO",
                        skipped: "TODO",
                    },
                    uploadScreenshots: false,
                },
                plugin: {
                    normalizeScreenshotNames: true,
                },
                evidenceCollection: new SimpleEvidenceCollection(),
            });
        });
    });
});
