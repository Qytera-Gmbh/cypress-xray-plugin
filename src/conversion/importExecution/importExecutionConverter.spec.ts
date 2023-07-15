/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import { stubLogging } from "../../../test/util";
import { initOptions } from "../../context";
import { InternalOptions } from "../../types/plugin";
import { XrayTestExecutionResultsCloud } from "../../types/xray/importTestExecutionResults";
import { ImportExecutionConverterCloud } from "./importExecutionConverterCloud";

describe("the import execution results converter", () => {
    let options: InternalOptions;
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
    });

    it("should be able to convert test results into Xray JSON", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(
            result,
            result.runs
        );

        expect(json.tests).to.have.length(3);
    });

    it("should log warnings when unable to create test issues", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        options.jira.createTestIssues = false;
        const { stubbedWarning } = stubLogging();
        const converter = new ImportExecutionConverterCloud(options);
        const json = converter.convertExecutionResults(result, result.runs);
        expect(json.tests).to.not.exist;
        expect(stubbedWarning).to.have.been.called.with.callCount(3);
        expect(stubbedWarning).to.have.been.calledWith(
            'No test issue key found in test title and the plugin is not allowed to create new test issues. Skipping result upload for test "xray upload demo should look for paragraph elements".'
        );
        expect(stubbedWarning).to.have.been.calledWith(
            'No test issue key found in test title and the plugin is not allowed to create new test issues. Skipping result upload for test "xray upload demo should look for the anchor element".'
        );
        expect(stubbedWarning).to.have.been.calledWith(
            'No test issue key found in test title and the plugin is not allowed to create new test issues. Skipping result upload for test "xray upload demo should fail".'
        );
    });

    it("should be able to erase milliseconds from timestamps", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(
            result,
            result.runs
        );
        expect(json.info?.startDate).to.eq("2022-11-28T17:41:12Z");
        expect(json.info?.finishDate).to.eq("2022-11-28T17:41:19Z");
    });

    it("should be able to detect re-use of existing test issues", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
        );
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(
            result,
            result.runs
        );
        expect(json.tests).to.have.length(3);
        expect(json.tests[0].testKey).to.eq("CYP-40");
        expect(json.tests[1].testKey).to.eq("CYP-41");
        expect(json.tests[2].testKey).to.eq("CYP-49");
        expect(json.tests[0].testInfo).to.be.undefined;
        expect(json.tests[1].testInfo).to.be.undefined;
        expect(json.tests[2].testInfo).to.be.undefined;
    });

    it("should be able to add test execution issue keys", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        options.jira.testExecutionIssueKey = "CYP-123";
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(
            result,
            result.runs
        );
        expect(json.testExecutionKey).to.eq("CYP-123");
    });

    it("should be able to add test plan issue keys", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        options.jira.testPlanIssueKey = "CYP-123";
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(
            result,
            result.runs
        );
        expect(json.info.testPlanKey).to.eq("CYP-123");
    });

    it("should not add test execution issue keys on its own", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(
            result,
            result.runs
        );
        expect(json.testExecutionKey).to.be.undefined;
    });

    it("should not add test plan issue keys on its own", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(
            result,
            result.runs
        );
        expect(json.info.testPlanKey).to.be.undefined;
    });

    it("should be able to overwrite existing test issues if specified", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
        );
        options.plugin.overwriteIssueSummary = true;
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(
            result,
            result.runs
        );
        expect(json.tests).to.have.length(3);
        expect(json.tests[0].testKey).to.eq("CYP-40");
        expect(json.tests[1].testKey).to.eq("CYP-41");
        expect(json.tests[2].testKey).to.eq("CYP-49");
        expect(json.tests[0].testInfo).to.not.be.undefined;
        expect(json.tests[1].testInfo).to.not.be.undefined;
        expect(json.tests[2].testInfo).to.not.be.undefined;
    });

    it("should be able to create test issues with summary overwriting disabled", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        options.plugin.overwriteIssueSummary = false;
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(
            result,
            result.runs
        );
        expect(json.tests).to.have.length(3);
        expect(json.tests[0].testInfo).to.exist;
        expect(json.tests[1].testInfo).to.exist;
        expect(json.tests[2].testInfo).to.exist;
    });

    it("should include a custom test execution summary if provided", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        options.jira.testExecutionIssueSummary = "Jeffrey's Test";
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(
            result,
            result.runs
        );
        expect(json.info.summary).to.eq("Jeffrey's Test");
    });

    it("should use a timestamp as test execution summary by default", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(
            result,
            result.runs
        );
        expect(json.info.summary).to.eq("Execution Results [1669657272234]");
    });

    it("should include a custom test execution description if provided", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        options.jira.testExecutionIssueDescription = "Very Useful Text";
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(
            result,
            result.runs
        );
        expect(json.info.description).to.eq("Very Useful Text");
    });

    it("should use versions as test execution description by default", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(
            result,
            result.runs
        );
        expect(json.info.description).to.eq(
            "Cypress version: 11.1.0 Browser: electron (106.0.5249.51)"
        );
    });
});
