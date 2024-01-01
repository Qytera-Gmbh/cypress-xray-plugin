import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { readFileSync } from "fs";
import path from "path";
import { getMockedLogger } from "../../../../../../test/mocks";
import { expectToExist } from "../../../../../../test/util";
import {
    initJiraOptions,
    initPluginOptions,
    initSslOptions,
    initXrayOptions,
} from "../../../../../context";
import { Level } from "../../../../../logging/logging";
import { InternalCypressXrayPluginOptions } from "../../../../../types/plugin";
import { dedent } from "../../../../../util/dedent";
import { ConstantCommand } from "../../../../util/commands/constantCommand";
import { ConvertCypressTestsCommand } from "./convertCypressTestsCommand";

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
                ssl: initSslOptions({}, {}),
            };
        });

        it("converts test results into xray info json", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const command = new ConvertCypressTestsCommand(options, new ConstantCommand(result));
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

        it("skips tests when encountering unknown statuses", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultUnknownStatus.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const logger = getMockedLogger();
            const command = new ConvertCypressTestsCommand(options, new ConstantCommand(result));
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
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const command = new ConvertCypressTestsCommand(options, new ConstantCommand(result));
            const tests = await command.compute();
            expectToExist(tests);
            expect(tests[0].evidence).to.be.undefined;
            expect(tests[1].evidence).to.be.undefined;
            expect(tests[2].evidence).to.be.an("array").with.length(1);
            expectToExist(tests[2].evidence);
            expect(tests[2].evidence[0].filename).to.eq("small.png");
        });

        it("skips screenshot upload if disabled", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            options.xray.uploadScreenshots = false;
            const command = new ConvertCypressTestsCommand(options, new ConstantCommand(result));
            const tests = await command.compute();
            expectToExist(tests);
            expect(tests).to.have.length(3);
            expect(tests[0].evidence).to.be.undefined;
            expect(tests[1].evidence).to.be.undefined;
            expect(tests[2].evidence).to.be.undefined;
        });

        it("normalizes screenshot filenames if enabled", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            options.plugin.normalizeScreenshotNames = true;
            const command = new ConvertCypressTestsCommand(options, new ConstantCommand(result));
            const tests = await command.compute();
            expectToExist(tests);
            expectToExist(tests[0].evidence);
            expect(tests[0].evidence[0].filename).to.eq("t_rtle_with_problem_tic_name.png");
        });

        it("does not normalize screenshot filenames by default", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const command = new ConvertCypressTestsCommand(options, new ConstantCommand(result));
            const tests = await command.compute();
            expectToExist(tests);
            expectToExist(tests[0].evidence);
            expect(tests[0].evidence[0].filename).to.eq("tûrtle with problemätic name.png");
        });

        it("uses custom passed statuses", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            options.xray.status = { passed: "it worked" };
            const command = new ConvertCypressTestsCommand(options, new ConstantCommand(result));
            const tests = await command.compute();
            expect(tests[0].status).to.eq("it worked");
            expect(tests[1].status).to.eq("it worked");
        });

        it("uses custom failed statuses", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            options.xray.status = { failed: "it did not work" };
            const command = new ConvertCypressTestsCommand(options, new ConstantCommand(result));
            const tests = await command.compute();
            expect(tests[2].status).to.eq("it did not work");
        });

        it("uses custom pending statuses", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultPending.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            options.xray.status = { pending: "still pending" };
            const command = new ConvertCypressTestsCommand(options, new ConstantCommand(result));
            const tests = await command.compute();
            expect(tests[0].status).to.eq("still pending");
            expect(tests[1].status).to.eq("still pending");
            expect(tests[2].status).to.eq("still pending");
            expect(tests[3].status).to.eq("still pending");
        });

        it("uses custom skipped statuses", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultSkipped.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            options.xray.status = { skipped: "omit" };
            const command = new ConvertCypressTestsCommand(options, new ConstantCommand(result));
            const tests = await command.compute();
            expect(tests[1].status).to.eq("omit");
        });

        it("does not modify test information", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const command = new ConvertCypressTestsCommand(options, new ConstantCommand(result));
            const tests = await command.compute();
            expect(tests[0].testInfo).to.be.undefined;
            expect(tests[1].testInfo).to.be.undefined;
            expect(tests[2].testInfo).to.be.undefined;
        });

        it("includes test issue keys", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const command = new ConvertCypressTestsCommand(options, new ConstantCommand(result));
            const tests = await command.compute();
            expect(tests[0].testKey).to.eq("CYP-40");
            expect(tests[1].testKey).to.eq("CYP-41");
            expect(tests[2].testKey).to.eq("CYP-49");
        });

        it("defaults to server status values", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const command = new ConvertCypressTestsCommand(options, new ConstantCommand(result));
            const tests = await command.compute();
            expect(tests[0].status).to.eq("PASS");
            expect(tests[1].status).to.eq("PASS");
            expect(tests[2].status).to.eq("FAIL");
        });

        it("uses cloud status values", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const command = new ConvertCypressTestsCommand(
                { ...options, useCloudStatusFallback: true },
                new ConstantCommand(result)
            );
            const tests = await command.compute();
            expect(tests[0].status).to.eq("PASSED");
            expect(tests[1].status).to.eq("PASSED");
            expect(tests[2].status).to.eq("FAILED");
        });
    });
});
