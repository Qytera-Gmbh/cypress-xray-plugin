/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import { CONTEXT, initContext } from "../../../src/context";
import { toXrayJSON } from "../../../src/conversion/conversion";
import { XrayExecutionResults } from "../../../src/types/xray/xray";
import { DummyClient, expectToExist } from "../helpers";

describe("the conversion function", () => {
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
        CONTEXT.client = new DummyClient();
    });

    it("should be able to convert test results into Xray JSON", () => {
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const json: XrayExecutionResults = toXrayJSON(result);
        expect(json.tests).to.have.length(3);
    });

    it("should be able to erase milliseconds from timestamps", () => {
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const json: XrayExecutionResults = toXrayJSON(result);
        expect(json.info?.startDate).to.eq("2022-11-28T17:41:12Z");
        expect(json.info?.finishDate).to.eq("2022-11-28T17:41:19Z");
    });

    it("should be able to detect re-use of existing test issues", () => {
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync(
                "./test/resources/runResultExistingTestIssues.json",
                "utf-8"
            )
        );
        const json: XrayExecutionResults = toXrayJSON(result);
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
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        CONTEXT.config.jira.testExecutionIssueKey = "CYP-123";
        const json: XrayExecutionResults = toXrayJSON(result);
        expect(json.testExecutionKey).to.eq("CYP-123");
    });

    it("should be able to add test plan issue keys", () => {
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        CONTEXT.config.jira.testPlanIssueKey = "CYP-123";
        const json: XrayExecutionResults = toXrayJSON(result);
        expectToExist(json.info);
        expect(json.info.testPlanKey).to.eq("CYP-123");
    });

    it("should not add test execution issue keys on its own", () => {
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const json: XrayExecutionResults = toXrayJSON(result);
        expect(json.testExecutionKey).to.be.undefined;
    });

    it("should not add test plan issue keys on its own", () => {
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const json: XrayExecutionResults = toXrayJSON(result);
        expectToExist(json.info);
        expect(json.info.testPlanKey).to.be.undefined;
    });

    it("should be able to overwrite existing test issues if specified", () => {
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync(
                "./test/resources/runResultExistingTestIssues.json",
                "utf-8"
            )
        );
        expectToExist(CONTEXT.config.plugin);
        CONTEXT.config.plugin.overwriteIssueSummary = true;
        const json: XrayExecutionResults = toXrayJSON(result);
        expectToExist(json.tests);
        expect(json.tests).to.have.length(3);
        expect(json.tests[0].testKey).to.eq("CYP-40");
        expect(json.tests[1].testKey).to.eq("CYP-41");
        expect(json.tests[2].testKey).to.eq("CYP-49");
        expect(json.tests[0].testInfo).to.not.be.undefined;
        expect(json.tests[1].testInfo).to.not.be.undefined;
        expect(json.tests[2].testInfo).to.not.be.undefined;
    });

    it("should not be able to deal with multiple existing test issues", () => {
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync(
                "./test/resources/runResultExistingTestIssuesMultipleError.json",
                "utf-8"
            )
        );
        const title = "CYP-123 should throw an error CYP-456";
        const matches = "CYP-123,CYP-456";
        expect(() => {
            toXrayJSON(result);
        }).to.throw(
            `Multiple test keys found in test case title "${title}": ${matches}`
        );
    });

    it("should be able to normalize screenshot filenames", () => {
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync(
                "./test/resources/runResultProblematicScreenshot.json",
                "utf-8"
            )
        );
        expectToExist(CONTEXT.config.plugin);
        CONTEXT.config.plugin.normalizeScreenshotNames = true;
        const json: XrayExecutionResults = toXrayJSON(result);
        expectToExist(json.tests);
        expect(json.tests).to.have.length(1);
        expect(json.tests[0].evidence).to.have.length(1);
        expectToExist(json.tests[0].evidence);
        expect(json.tests[0].evidence[0].filename).to.eq(
            "t_rtle_with_problem_tic_name.png"
        );
    });

    it("should be able to use custom passed/failed statuses", () => {
        let result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        expectToExist(CONTEXT.config.xray);
        CONTEXT.config.xray.statusPassed = "it worked";
        CONTEXT.config.xray.statusFailed = "it did not work";
        const json: XrayExecutionResults = toXrayJSON(result);
        expectToExist(json.tests);
        expect(json.tests[0].status).to.eq("it worked");
        expect(json.tests[1].status).to.eq("it worked");
        expect(json.tests[2].status).to.eq("it did not work");
    });
});
