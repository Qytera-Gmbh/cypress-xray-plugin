import { expect } from "chai";
import { readFileSync } from "fs";
import { initOptions } from "../../context";
import { InternalOptions } from "../../types/plugin";
import { TestIssueData } from "./importExecutionConverter";
import { ImportExecutionConverterServer } from "./importExecutionConverterServer";
describe("the import execution results converter (server)", () => {
    let options: InternalOptions;
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
        testIssueData = { summaries: {}, testTypes: {} };
    });

    it("uses PASS as default status name for passed tests", async () => {
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
        const converter = new ImportExecutionConverterServer(options);
        const json = await converter.convert(result, testIssueData);
        expect(json.tests[0].status).to.eq("PASS");
        expect(json.tests[1].status).to.eq("PASS");
    });

    it("uses FAIL as default status name for failed tests", async () => {
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
        const converter = new ImportExecutionConverterServer(options);
        const json = await converter.convert(result, testIssueData);
        expect(json.tests[2].status).to.eq("FAIL");
    });

    it("uses TODO as default status name for pending tests", async () => {
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
        const converter = new ImportExecutionConverterServer(options);
        const json = await converter.convert(result, testIssueData);
        expect(json.tests[0].status).to.eq("TODO");
        expect(json.tests[1].status).to.eq("TODO");
        expect(json.tests[2].status).to.eq("TODO");
        expect(json.tests[3].status).to.eq("TODO");
    });

    it("uses FAIL as default status name for skipped tests", async () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultSkipped.json", "utf-8")
        );
        testIssueData.summaries = {
            "CYP-123": "Summary #0",
            "CYP-456": "Summary #1",
        };
        testIssueData.testTypes = {
            "CYP-123": "Generic",
            "CYP-456": "Cucumber",
        };
        const converter = new ImportExecutionConverterServer(options);
        const json = await converter.convert(result, testIssueData);
        expect(json.tests[0].status).to.eq("FAIL");
        expect(json.tests[1].status).to.eq("FAIL");
    });

    it("includes test types if step updates are enabled", async () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultSkipped.json", "utf-8")
        );
        testIssueData.summaries = {
            "CYP-123": "Summary #0",
            "CYP-456": "Summary #1",
        };
        testIssueData.testTypes = {
            "CYP-123": "Generic",
            "CYP-456": "Cucumber",
        };
        const converter = new ImportExecutionConverterServer(options);
        options.xray.steps.update = true;
        const json = await converter.convert(result, testIssueData);
        expect(json.tests[0].testInfo.testType).to.eq("Generic");
        expect(json.tests[1].testInfo.testType).to.eq("Cucumber");
    });
});
