import { expect } from "chai";
import { readFileSync } from "fs";
import { expectToExist, stubLogging } from "../../../test/util";
import { initOptions } from "../../context";
import { InternalOptions } from "../../types/plugin";
import { dedent } from "../../util/dedent";
import { ImportExecutionConverter, TestIssueData } from "./importExecutionConverter";

describe("the import execution converter", () => {
    let options: InternalOptions;
    let converter: ImportExecutionConverter;
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
        converter = new ImportExecutionConverter(options, false);
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
        expectToExist(json.tests);
        expect(json.tests[0].evidence).to.be.undefined;
        expect(json.tests[1].evidence).to.be.undefined;
        expect(json.tests[2].evidence).to.be.an("array").with.length(1);
        expectToExist(json.tests[2].evidence);
        expect(json.tests[2].evidence[0].filename).to.eq("small.png");
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
        expectToExist(json.tests);
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
        expectToExist(json.tests);
        expectToExist(json.tests[0].evidence);
        expect(json.tests[0].evidence[0].filename).to.eq("t_rtle_with_problem_tic_name.png");
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
        expectToExist(json.tests);
        expectToExist(json.tests[0].evidence);
        expect(json.tests[0].evidence[0].filename).to.eq("tûrtle with problemätic name.png");
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
        options.xray.status = { passed: "it worked" };
        const json = await converter.convert(result, testIssueData);
        expectToExist(json.tests);
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
        options.xray.status = { failed: "it did not work" };
        const json = await converter.convert(result, testIssueData);
        expectToExist(json.tests);
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
        options.xray.status = { pending: "still pending" };
        const json = await converter.convert(result, testIssueData);
        expectToExist(json.tests);
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
        options.xray.status = { skipped: "omit" };
        const json = await converter.convert(result, testIssueData);
        expectToExist(json.tests);
        expect(json.tests[1].status).to.eq("omit");
    });

    it("does not include step updates", async () => {
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
        expectToExist(json.tests);
        expect(json.tests).to.have.length(3);
        expect(json.tests[0].testInfo?.steps).to.be.undefined;
        expect(json.tests[1].testInfo?.steps).to.be.undefined;
        expect(json.tests[2].testInfo?.steps).to.be.undefined;
    });

    it("includes issue summaries", async () => {
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
        expectToExist(json.tests);
        expect(json.tests[0].testInfo?.summary).to.eq("This is");
        expect(json.tests[1].testInfo?.summary).to.eq("a distributed");
        expect(json.tests[2].testInfo?.summary).to.eq("summary");
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
        expectToExist(json.tests);
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
        const { stubbedWarning } = stubLogging();
        const json = await converter.convert(result, testIssueData);
        expect(json.tests).to.be.an("array").with.length(2);
        expect(stubbedWarning).to.have.been.calledWith(
            dedent(`
                Skipping result upload for test: cypress xray plugin CYP-49 failling test case with test issue key

                Test type of corresponding issue is unknown: CYP-49
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
        const { stubbedWarning } = stubLogging();
        const json = await converter.convert(result, testIssueData);
        expect(json.tests).to.be.an("array").with.length(2);
        expect(stubbedWarning).to.have.been.calledWith(
            dedent(`
                Skipping result upload for test: cypress xray plugin CYP-49 failling test case with test issue key

                Summary of corresponding issue is unknown: CYP-49
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
        expect(json?.info?.testPlanKey).to.eq("CYP-123");
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
        expect(json?.info?.testPlanKey).to.be.undefined;
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
        expect(json?.info?.summary).to.eq("Jeffrey's Test");
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
        expect(json?.info?.summary).to.eq("Execution Results [1669657272234]");
    });

    it("does not add the default test execution summary if omitted and a key is given", async () => {
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
        options.jira.testExecutionIssueKey = "CYP-100";
        const json = await converter.convert(result, testIssueData);
        expect(json?.info?.summary).to.be.undefined;
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
        expect(json?.info?.description).to.eq("Very Useful Text");
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
        expect(json?.info?.description).to.eq(
            dedent(`
                Cypress version: 11.1.0
                Browser: electron (106.0.5249.51)
            `)
        );
    });

    it("does not add the default test execution description if omitted and a key is given", async () => {
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
        options.jira.testExecutionIssueKey = "CYP-100";
        const json = await converter.convert(result, testIssueData);
        expect(json?.info?.description).to.be.undefined;
    });

    it("uses a cloud converted if specified", async () => {
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
        converter = new ImportExecutionConverter(options, true);
        const json = await converter.convert(result, testIssueData);
        expectToExist(json.tests);
        expect(json.tests).to.have.length(3);
        expect(json.tests[0].status).to.eq("PASSED");
        expect(json.tests[1].status).to.eq("PASSED");
        expect(json.tests[2].status).to.eq("FAILED");
    });
});
