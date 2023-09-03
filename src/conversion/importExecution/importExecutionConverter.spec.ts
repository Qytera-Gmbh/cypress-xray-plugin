import { expect } from "chai";
import { readFileSync } from "fs";
import { stubLogging } from "../../../test/util";
import { initOptions } from "../../context";
import { InternalOptions } from "../../types/plugin";
import { dedent } from "../../util/dedent";
import { TestIssueData } from "./importExecutionConverter";
import { ImportExecutionConverterCloud } from "./importExecutionConverterCloud";
import { ImportExecutionConverterServer } from "./importExecutionConverterServer";

describe("the import execution converters", () => {
    ["server", "cloud"].forEach((converterType: string) => {
        describe(converterType, () => {
            let options: InternalOptions;
            let converter: ImportExecutionConverterServer | ImportExecutionConverterCloud;
            let testIssueData: TestIssueData;
            beforeEach(() => {
                options = initOptions(
                    {},
                    {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        xray: {
                            uploadResults: true,
                        },
                        cucumber: {
                            featureFileExtension: ".feature",
                        },
                    }
                );
                converter =
                    converterType === "server"
                        ? new ImportExecutionConverterServer(options)
                        : new ImportExecutionConverterCloud(options);
                testIssueData = { summaries: {}, testTypes: {} };
            });

            it("converts test results into xray json", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                const json = await converter.convert(result, testIssueData);
                expect(json.tests).to.have.length(3);
            });

            it("skips tests when encountering unknown statuses", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultUnknownStatus.json", "utf-8")
                );
                const { stubbedWarning } = stubLogging();
                const json = await converter.convert(result, testIssueData);
                expect(stubbedWarning.firstCall).to.have.been.calledWith(
                    dedent(`
                        Skipping result upload for test: TodoMVC hides footer initially

                        Unknown Cypress test status: broken
                    `)
                );
                expect(stubbedWarning.secondCall).to.have.been.calledWith(
                    dedent(`
                        Skipping result upload for test: TodoMVC adds 2 todos

                        Unknown Cypress test status: california
                    `)
                );
                expect(json.tests).to.be.undefined;
            });

            it("erases milliseconds from timestamps", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                const json = await converter.convert(result, testIssueData);
                expect(json.info?.startDate).to.eq("2022-11-28T17:41:12Z");
                expect(json.info?.finishDate).to.eq("2022-11-28T17:41:19Z");
            });

            it("uploads screenshots by default", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                const json = await converter.convert(result, testIssueData);
                expect(json.tests[0].evidence).to.be.undefined;
                expect(json.tests[1].evidence).to.be.undefined;
                expect(json.tests[2].evidence).to.be.an("array").with.length(1);
                expect(json.tests[2].evidence[0].filename).to.eq("turtle.png");
            });

            it("skips screenshot upload if disabled", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                options.xray.uploadScreenshots = false;
                const json = await converter.convert(result, testIssueData);
                expect(json.tests).to.have.length(3);
                expect(json.tests[0].evidence).to.be.undefined;
                expect(json.tests[1].evidence).to.be.undefined;
                expect(json.tests[2].evidence).to.be.undefined;
            });

            it("normalizes screenshot filenames if enabled", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-123": "Test issue",
                };
                testIssueData.testTypes = {
                    "CYP-123": "Manual",
                };
                options.plugin.normalizeScreenshotNames = true;
                const json = await converter.convert(result, testIssueData);
                expect(json.tests[0].evidence[0].filename).to.eq(
                    "t_rtle_with_problem_tic_name.png"
                );
            });

            it("does not normalize screenshot filenames by default", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-123": "Big test",
                };
                testIssueData.testTypes = {
                    "CYP-123": "Generic",
                };
                const json = await converter.convert(result, testIssueData);
                expect(json.tests[0].evidence[0].filename).to.eq(
                    "tûrtle with problemätic name.png"
                );
            });

            it("uses custom passed statuses", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                options.xray.statusPassed = "it worked";
                const json = await converter.convert(result, testIssueData);
                expect(json.tests[0].status).to.eq("it worked");
                expect(json.tests[1].status).to.eq("it worked");
            });

            it("uses custom failed statuses", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                options.xray.statusFailed = "it did not work";
                const json = await converter.convert(result, testIssueData);
                expect(json.tests[2].status).to.eq("it did not work");
            });

            it("uses custom pending statuses", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultPending.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-123": "This is",
                    "CYP-456": "a distributed",
                    "CYP-789": "summary",
                    "CYP-987": "!!!",
                };
                testIssueData.testTypes = {
                    "CYP-123": "Generic",
                    "CYP-456": "Manual",
                    "CYP-789": "Cucumber",
                    "CYP-987": "No idea",
                };
                options.xray.statusPending = "still pending";
                const json = await converter.convert(result, testIssueData);
                expect(json.tests[0].status).to.eq("still pending");
                expect(json.tests[1].status).to.eq("still pending");
                expect(json.tests[2].status).to.eq("still pending");
                expect(json.tests[3].status).to.eq("still pending");
            });

            it("uses custom skipped statuses", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultSkipped.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-123": "This is",
                    "CYP-456": "a summary",
                };
                testIssueData.testTypes = {
                    "CYP-123": "Generic",
                    "CYP-456": "Manual",
                };
                options.xray.statusSkipped = "omit";
                const json = await converter.convert(result, testIssueData);
                expect(json.tests[1].status).to.eq("omit");
            });

            it("includes step updates", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                options.xray.steps.update = true;
                const json = await converter.convert(result, testIssueData);
                expect(json.tests).to.have.length(3);
                expect(json.tests[0].testInfo.steps).to.have.length(1);
                expect(json.tests[0].testInfo.steps[0].action).to.be.a("string");
                expect(json.tests[1].testInfo.steps).to.have.length(1);
                expect(json.tests[1].testInfo.steps[0].action).to.be.a("string");
                expect(json.tests[2].testInfo.steps).to.have.length(1);
                expect(json.tests[2].testInfo.steps[0].action).to.be.a("string");
            });

            it("skips step updates if disabled", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                const json = await converter.convert(result, testIssueData);
                expect(json.tests).to.have.length(3);
                // No step updates? No test info.
                expect(json.tests[0].testInfo).to.be.undefined;
                expect(json.tests[1].testInfo).to.be.undefined;
                expect(json.tests[2].testInfo).to.be.undefined;
            });

            it("truncates step actions to 8000 characters by default", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultLongBodies.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-123": "Summary 1",
                    "CYP-456": "Summary 2",
                    "CYP-789": "Summary 3",
                };
                testIssueData.testTypes = {
                    "CYP-123": "Manual",
                    "CYP-456": "Manual",
                    "CYP-789": "Manual",
                };
                options.xray.steps.update = true;
                const json = await converter.convert(result, testIssueData);
                expect(json.tests[0].testInfo.steps[0].action).to.eq(`${"x".repeat(7997)}...`);
                expect(json.tests[1].testInfo.steps[0].action).to.eq(`${"x".repeat(8000)}`);
                expect(json.tests[2].testInfo.steps[0].action).to.eq(`${"x".repeat(2000)}`);
            });

            it("truncates step actions to custom lengths if enabled", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultLongBodies.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-123": "1st summary",
                    "CYP-456": "2nd summary",
                    "CYP-789": "3rd summary",
                };
                testIssueData.testTypes = {
                    "CYP-123": "Manual",
                    "CYP-456": "Manual",
                    "CYP-789": "Manual",
                };
                options.xray.steps.update = true;
                options.xray.steps.maxLengthAction = 5;
                const json = await converter.convert(result, testIssueData);
                expect(json.tests[0].testInfo.steps[0].action).to.eq("xx...");
                expect(json.tests[1].testInfo.steps[0].action).to.eq("xx...");
                expect(json.tests[2].testInfo.steps[0].action).to.eq("xx...");
            });

            it("includes issue summaries if step updates are enabled", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                options.xray.steps.update = true;
                const json = await converter.convert(result, testIssueData);
                expect(json.tests).to.have.length(3);
                expect(json.tests[0].testInfo.summary).to.eq("This is");
                expect(json.tests[1].testInfo.summary).to.eq("a distributed");
                expect(json.tests[2].testInfo.summary).to.eq("summary");
            });

            it("includes test issue keys", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                const json = await converter.convert(result, testIssueData);
                expect(json.tests).to.have.length(3);
                expect(json.tests[0].testKey).to.eq("CYP-40");
                expect(json.tests[1].testKey).to.eq("CYP-41");
                expect(json.tests[2].testKey).to.eq("CYP-49");
            });

            it("skips tests with missing test type", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Manual",
                    "CYP-41": "Manual",
                };
                options.xray.steps.update = false;
                const { stubbedWarning } = stubLogging();
                const json = await converter.convert(result, testIssueData);
                expect(json.tests).to.be.an("array").with.length(2);
                expect(stubbedWarning).to.have.been.calledWith(
                    dedent(`
                        Skipping result upload for test: cypress xray plugin CYP-49 failling test case with test issue key

                        Test type of corresponding issue is missing: CYP-49
                    `)
                );
            });

            it("skips tests with missing summaries", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Manual",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                options.xray.steps.update = false;
                const { stubbedWarning } = stubLogging();
                const json = await converter.convert(result, testIssueData);
                expect(json.tests).to.be.an("array").with.length(2);
                expect(stubbedWarning).to.have.been.calledWith(
                    dedent(`
                        Skipping result upload for test: cypress xray plugin CYP-49 failling test case with test issue key

                        Summary of corresponding issue is missing: CYP-49
                    `)
                );
            });

            it("adds test execution issue keys", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                options.jira.testExecutionIssueKey = "CYP-123";
                const json = await converter.convert(result, testIssueData);
                expect(json.testExecutionKey).to.eq("CYP-123");
            });

            it("adds test plan issue keys", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                options.jira.testPlanIssueKey = "CYP-123";
                const json = await converter.convert(result, testIssueData);
                expect(json.info.testPlanKey).to.eq("CYP-123");
            });

            it("does not add test execution issue keys on its own", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                const json = await converter.convert(result, testIssueData);
                expect(json.testExecutionKey).to.be.undefined;
            });

            it("does not add test plan issue keys on its own", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                const json = await converter.convert(result, testIssueData);
                expect(json.info.testPlanKey).to.be.undefined;
            });

            it("includes a custom test execution summary if provided", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                options.jira.testExecutionIssueSummary = "Jeffrey's Test";
                const json = await converter.convert(result, testIssueData);
                expect(json.info.summary).to.eq("Jeffrey's Test");
            });

            it("uses a timestamp as test execution summary by default", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                const json = await converter.convert(result, testIssueData);
                expect(json.info.summary).to.eq("Execution Results [1669657272234]");
            });

            it("includes a custom test execution description if provided", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                options.jira.testExecutionIssueDescription = "Very Useful Text";
                const json = await converter.convert(result, testIssueData);
                expect(json.info.description).to.eq("Very Useful Text");
            });

            it("uses versions as test execution description by default", async () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                testIssueData.summaries = {
                    "CYP-40": "This is",
                    "CYP-41": "a distributed",
                    "CYP-49": "summary",
                };
                testIssueData.testTypes = {
                    "CYP-40": "Generic",
                    "CYP-41": "Manual",
                    "CYP-49": "Cucumber",
                };
                const json = await converter.convert(result, testIssueData);
                expect(json.info.description).to.eq(
                    "Cypress version: 11.1.0 Browser: electron (106.0.5249.51)"
                );
            });
        });
    });
});
