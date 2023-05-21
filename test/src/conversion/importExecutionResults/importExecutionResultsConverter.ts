/// <reference types="cypress" />
import { expect } from "chai";
import { readFileSync } from "fs";
import { CONTEXT, initContext } from "../../../../src/context";
import { ImportExecutionResultsConverterCloud } from "../../../../src/conversion/importExecutionResults/importExecutionResultsConverterCloud";
import { XrayTestExecutionResultsCloud } from "../../../../src/types/xray/importTestExecutionResults";
import { stubLogWarning } from "../../../constants";
import { expectToExist } from "../../helpers";

describe("the import execution results converter", () => {
    let converter: ImportExecutionResultsConverterCloud;
    beforeEach(() => {
        initContext({
            jira: {
                projectKey: "CYP",
            },
            xray: {
                testType: "Manual",
                uploadResults: true,
            },
            cucumber: {
                featureFileExtension: ".feature",
            },
        });
        converter = new ImportExecutionResultsConverterCloud();
    });

    it("should be able to convert test results into Xray JSON", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(result);

        expect(json.tests).to.have.length(3);
    });

    it("should log warnings when unable to create test issues", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        CONTEXT.config.jira.createTestIssues = false;
        const stubbedWarning = stubLogWarning();
        const json = converter.convertExecutionResults(result);
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
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(result);
        expect(json.info?.startDate).to.eq("2022-11-28T17:41:12Z");
        expect(json.info?.finishDate).to.eq("2022-11-28T17:41:19Z");
    });

    it("should be able to detect re-use of existing test issues", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
        );
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(result);
        expectToExist(json.tests);
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
        CONTEXT.config.jira.testExecutionIssueKey = "CYP-123";
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(result);
        expect(json.testExecutionKey).to.eq("CYP-123");
    });

    it("should be able to add test plan issue keys", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        CONTEXT.config.jira.testPlanIssueKey = "CYP-123";
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(result);
        expectToExist(json.info);
        expect(json.info.testPlanKey).to.eq("CYP-123");
    });

    it("should not add test execution issue keys on its own", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(result);
        expect(json.testExecutionKey).to.be.undefined;
    });

    it("should not add test plan issue keys on its own", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(result);
        expectToExist(json.info);
        expect(json.info.testPlanKey).to.be.undefined;
    });

    it("should be able to overwrite existing test issues if specified", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
        );
        expectToExist(CONTEXT.config.plugin);
        CONTEXT.config.plugin.overwriteIssueSummary = true;
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(result);
        expectToExist(json.tests);
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
        CONTEXT.config.plugin = {
            overwriteIssueSummary: false,
        };
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expect(json.tests).to.have.length(3);
        expect(json.tests[0].testInfo).to.exist;
        expect(json.tests[1].testInfo).to.exist;
        expect(json.tests[2].testInfo).to.exist;
    });

    it("should include a custom test execution summary if provided", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        expectToExist(CONTEXT.config.jira);
        CONTEXT.config.jira.testExecutionIssueSummary = "Jeffrey's Test";
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(result);
        expectToExist(json.info);
        expect(json.info.summary).to.eq("Jeffrey's Test");
    });

    it("should use a timestamp as test execution summary by default", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        expectToExist(CONTEXT.config.jira);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(result);
        expectToExist(json.info);
        expect(json.info.summary).to.eq("Execution Results [1669657272234]");
    });

    it("should include a custom test execution description if provided", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        expectToExist(CONTEXT.config.jira);
        CONTEXT.config.jira.testExecutionIssueDescription = "Very Useful Text";
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(result);
        expectToExist(json.info);
        expect(json.info.description).to.eq("Very Useful Text");
    });

    it("should use versions as test execution description by default", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        expectToExist(CONTEXT.config.jira);
        const json: XrayTestExecutionResultsCloud = converter.convertExecutionResults(result);
        expectToExist(json.info);
        expect(json.info.description).to.eq(
            "Cypress version: 11.1.0 Browser: electron (106.0.5249.51)"
        );
    });
});
