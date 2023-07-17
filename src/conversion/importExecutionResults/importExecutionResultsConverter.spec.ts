import { expect } from "chai";
import dedent from "dedent";
import { readFileSync } from "fs";
import { stubLogging } from "../../../test/util";
import { initOptions } from "../../context";
import { InternalOptions } from "../../types/plugin";
import { ImportExecutionResultsConverterCloud } from "./importExecutionResultsConverterCloud";
import { ImportExecutionResultsConverterServer } from "./importExecutionResultsConverterServer";

describe("the import execution results converters", () => {
    ["server", "cloud"].forEach((converterType: string) => {
        describe(converterType, () => {
            let options: InternalOptions;
            let converter:
                | ImportExecutionResultsConverterServer
                | ImportExecutionResultsConverterCloud;
            beforeEach(() => {
                options = initOptions(
                    {},
                    {
                        jira: {
                            projectKey: "CYP",
                            url: "https://example.org",
                        },
                        xray: {
                            testType: "Manual",
                            uploadResults: true,
                        },
                        cucumber: {
                            featureFileExtension: ".feature",
                        },
                    }
                );
                converter =
                    converterType === "server"
                        ? new ImportExecutionResultsConverterServer(options)
                        : new ImportExecutionResultsConverterCloud(options);
            });

            it("should convert test results into xray json", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                const json = converter.convertExecutionResults(result);
                expect(json.tests).to.have.length(3);
            });

            it("should log warnings for missing test issue keys", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResult.json", "utf-8")
                );
                const { stubbedWarning } = stubLogging();
                const json = converter.convertExecutionResults(result);
                expect(json.tests).to.not.exist;
                expect(stubbedWarning).to.have.been.called.with.callCount(3);
                expect(stubbedWarning.firstCall).to.have.been.calledWithExactly(
                    dedent(`
                        Skipping result upload for test: xray upload demo should look for paragraph elements:

                        No test issue keys found in the test's title.
                        You can target existing test issues by adding a corresponding issue key:

                        it("CYP-123 xray upload demo should look for paragraph elements", () => {
                            // ...
                        });

                        For more information, visit:
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
                expect(stubbedWarning.secondCall).to.have.been.calledWithExactly(
                    dedent(`
                        Skipping result upload for test: xray upload demo should look for the anchor element:

                        No test issue keys found in the test's title.
                        You can target existing test issues by adding a corresponding issue key:

                        it("CYP-123 xray upload demo should look for the anchor element", () => {
                            // ...
                        });

                        For more information, visit:
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
                expect(stubbedWarning.thirdCall).to.have.been.calledWithExactly(
                    dedent(`
                        Skipping result upload for test: xray upload demo should fail:

                        No test issue keys found in the test's title.
                        You can target existing test issues by adding a corresponding issue key:

                        it("CYP-123 xray upload demo should fail", () => {
                            // ...
                        });

                        For more information, visit:
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
            });

            it("should log warnings for multiple test issue keys", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync(
                        "./test/resources/runResultExistingTestIssuesMultiple.json",
                        "utf-8"
                    )
                );
                const { stubbedWarning } = stubLogging();
                const json = converter.convertExecutionResults(result);
                expect(json.tests).to.not.exist;
                expect(stubbedWarning).to.have.been.calledOnceWith(
                    dedent(`
                        Skipping result upload for test: cypress xray plugin CYP-123 should throw an error CYP-456:

                        Multiple test keys found in the test's title.
                        The plugin cannot decide for you which one to use:

                        it("CYP-123 should throw an error CYP-456", () => {
                            ^^^^^^^                       ^^^^^^^
                            // ...
                        });

                        For more information, visit:
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
            });

            it("should skip tests when encountering unknown statuses", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultUnknownStatus.json", "utf-8")
                );
                const { stubbedWarning } = stubLogging();
                const json = converter.convertExecutionResults(result);
                expect(stubbedWarning.firstCall).to.have.been.calledWith(
                    dedent(`
                        Skipping result upload for test: TodoMVC hides footer initially:

                        Unknown Cypress test status: broken
                    `)
                );
                expect(stubbedWarning.secondCall).to.have.been.calledWith(
                    dedent(`
                        Skipping result upload for test: TodoMVC adds 2 todos:

                        Unknown Cypress test status: california
                    `)
                );
                expect(json.tests).to.be.undefined;
            });

            it("should erase milliseconds from timestamps", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                const json = converter.convertExecutionResults(result);
                expect(json.info?.startDate).to.eq("2022-11-28T17:41:12Z");
                expect(json.info?.finishDate).to.eq("2022-11-28T17:41:19Z");
            });

            it("should upload screenshots by default", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                const json = converter.convertExecutionResults(result);
                expect(json.tests[0].evidence).to.be.undefined;
                expect(json.tests[1].evidence).to.be.undefined;
                expect(json.tests[2].evidence).to.be.an("array").with.length(1);
                expect(json.tests[2].evidence[0].filename).to.eq("turtle.png");
            });

            it("should skip screenshot upload if disabled", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                options.xray.uploadScreenshots = false;
                const json = converter.convertExecutionResults(result);
                expect(json.tests).to.have.length(3);
                expect(json.tests[0].evidence).to.be.undefined;
                expect(json.tests[1].evidence).to.be.undefined;
                expect(json.tests[2].evidence).to.be.undefined;
            });

            it("should normalize screenshot filenames if enabled", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
                );
                options.plugin.normalizeScreenshotNames = true;
                const json = converter.convertExecutionResults(result);
                expect(json.tests[0].evidence[0].filename).to.eq(
                    "t_rtle_with_problem_tic_name.png"
                );
            });

            it("should not normalize screenshot filenames by default", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
                );
                const json = converter.convertExecutionResults(result);
                expect(json.tests[0].evidence[0].filename).to.eq(
                    "tûrtle with problemätic name.png"
                );
            });

            it("should use custom passed statuses", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                options.xray.statusPassed = "it worked";
                const json = converter.convertExecutionResults(result);
                expect(json.tests[0].status).to.eq("it worked");
                expect(json.tests[1].status).to.eq("it worked");
            });

            it("should use custom failed statuses", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                options.xray.statusFailed = "it did not work";
                const json = converter.convertExecutionResults(result);
                expect(json.tests[2].status).to.eq("it did not work");
            });

            it("should use custom pending statuses", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultPending.json", "utf-8")
                );
                options.xray.statusPending = "still pending";
                const json = converter.convertExecutionResults(result);
                expect(json.tests[0].status).to.eq("still pending");
                expect(json.tests[1].status).to.eq("still pending");
                expect(json.tests[2].status).to.eq("still pending");
                expect(json.tests[3].status).to.eq("still pending");
            });

            it("should use custom skipped statuses", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultSkipped.json", "utf-8")
                );
                options.xray.statusSkipped = "omit";
                const json = converter.convertExecutionResults(result);
                expect(json.tests[1].status).to.eq("omit");
            });

            it("should include step updates if overwrite issue summaries is enabled", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                options.plugin.overwriteIssueSummary = true;
                const json = converter.convertExecutionResults(result);
                expect(json.tests).to.have.length(3);
                expect(json.tests[0].testInfo.steps).to.have.length(1);
                expect(json.tests[0].testInfo.steps[0].action).to.be.a("string");
                expect(json.tests[1].testInfo.steps).to.have.length(1);
                expect(json.tests[1].testInfo.steps[0].action).to.be.a("string");
                expect(json.tests[2].testInfo.steps).to.have.length(1);
                expect(json.tests[2].testInfo.steps[0].action).to.be.a("string");
            });

            it("should skip step updates if disabled", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                options.plugin.overwriteIssueSummary = true;
                options.xray.steps.update = false;
                const json = converter.convertExecutionResults(result);
                expect(json.tests).to.have.length(3);
                expect(json.tests[0].testInfo.steps).to.be.undefined;
                expect(json.tests[1].testInfo.steps).to.be.undefined;
                expect(json.tests[2].testInfo.steps).to.be.undefined;
            });

            it("should truncate step actions to 8000 characters by default", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultLongBodies.json", "utf-8")
                );
                options.plugin.overwriteIssueSummary = true;
                const json = converter.convertExecutionResults(result);
                expect(json.tests[0].testInfo.steps[0].action).to.eq(`${"x".repeat(7997)}...`);
                expect(json.tests[1].testInfo.steps[0].action).to.eq(`${"x".repeat(8000)}`);
                expect(json.tests[2].testInfo.steps[0].action).to.eq(`${"x".repeat(2000)}`);
            });

            it("should truncate step actions to custom lengths if enabled", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultLongBodies.json", "utf-8")
                );
                options.plugin.overwriteIssueSummary = true;
                options.xray.steps.maxLengthAction = 5;
                const json = converter.convertExecutionResults(result);
                expect(json.tests[0].testInfo.steps[0].action).to.eq("xx...");
                expect(json.tests[1].testInfo.steps[0].action).to.eq("xx...");
                expect(json.tests[2].testInfo.steps[0].action).to.eq("xx...");
            });

            it("should detect re-use of existing test issues", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                const json = converter.convertExecutionResults(result);
                expect(json.tests).to.have.length(3);
                expect(json.tests[0].testKey).to.eq("CYP-40");
                expect(json.tests[1].testKey).to.eq("CYP-41");
                expect(json.tests[2].testKey).to.eq("CYP-49");
                expect(json.tests[0].testInfo).to.be.undefined;
                expect(json.tests[1].testInfo).to.be.undefined;
                expect(json.tests[2].testInfo).to.be.undefined;
            });

            it("should add test execution issue keys", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                options.jira.testExecutionIssueKey = "CYP-123";
                const json = converter.convertExecutionResults(result);
                expect(json.testExecutionKey).to.eq("CYP-123");
            });

            it("should add test plan issue keys", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                options.jira.testPlanIssueKey = "CYP-123";
                const json = converter.convertExecutionResults(result);
                expect(json.info.testPlanKey).to.eq("CYP-123");
            });

            it("should not add test execution issue keys on its own", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                const json = converter.convertExecutionResults(result);
                expect(json.testExecutionKey).to.be.undefined;
            });

            it("should not add test plan issue keys on its own", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                const json = converter.convertExecutionResults(result);
                expect(json.info.testPlanKey).to.be.undefined;
            });

            it("should overwrite existing test issues if specified", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                options.plugin.overwriteIssueSummary = true;
                const json = converter.convertExecutionResults(result);
                expect(json.tests).to.have.length(3);
                expect(json.tests[0].testKey).to.eq("CYP-40");
                expect(json.tests[1].testKey).to.eq("CYP-41");
                expect(json.tests[2].testKey).to.eq("CYP-49");
                expect(json.tests[0].testInfo).to.not.be.undefined;
                expect(json.tests[1].testInfo).to.not.be.undefined;
                expect(json.tests[2].testInfo).to.not.be.undefined;
            });

            it("should not update test information with summary overwriting disabled", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                options.plugin.overwriteIssueSummary = false;
                const json = converter.convertExecutionResults(result);
                expect(json.tests).to.have.length(3);
                expect(json.tests[0].testInfo).to.not.exist;
                expect(json.tests[1].testInfo).to.not.exist;
                expect(json.tests[2].testInfo).to.not.exist;
            });

            it("should include a custom test execution summary if provided", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                options.jira.testExecutionIssueSummary = "Jeffrey's Test";
                const json = converter.convertExecutionResults(result);
                expect(json.info.summary).to.eq("Jeffrey's Test");
            });

            it("should use a timestamp as test execution summary by default", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                const json = converter.convertExecutionResults(result);
                expect(json.info.summary).to.eq("Execution Results [1669657272234]");
            });

            it("should include a custom test execution description if provided", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                options.jira.testExecutionIssueDescription = "Very Useful Text";
                const json = converter.convertExecutionResults(result);
                expect(json.info.description).to.eq("Very Useful Text");
            });

            it("should use versions as test execution description by default", () => {
                const result: CypressCommandLine.CypressRunResult = JSON.parse(
                    readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
                );
                const json = converter.convertExecutionResults(result);
                expect(json.info.description).to.eq(
                    "Cypress version: 11.1.0 Browser: electron (106.0.5249.51)"
                );
            });
        });
    });
});
