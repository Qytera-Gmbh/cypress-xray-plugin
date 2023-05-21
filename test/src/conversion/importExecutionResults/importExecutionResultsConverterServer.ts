/// <reference types="cypress" />
import { expect } from "chai";
import { readFileSync } from "fs";
import { CONTEXT, initContext } from "../../../../src/context";
import { ImportExecutionResultsConverterServer } from "../../../../src/conversion/importExecutionResults/importExecutionResultsConverterServer";
import { stubLogWarning } from "../../../constants";
import { expectToExist } from "../../helpers";

describe("the import execution results converter (server)", () => {
    let converter: ImportExecutionResultsConverterServer;

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
        converter = new ImportExecutionResultsConverterServer();
    });

    it("should upload screenshots by default", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expect(json.tests[0].evidence).to.not.exist;
        expectToExist(json.tests[1].evidence);
        expect(json.tests[1].evidence).to.be.an("array").with.length(1);
        expect(json.tests[1].evidence[0].filename).to.eq("turtle.png");
        expectToExist(json.tests[2].evidence);
        expect(json.tests[2].evidence).to.be.an("array").with.length(2);
        expect(json.tests[2].evidence[0].filename).to.eq("turtle.png");
        expect(json.tests[2].evidence[1].filename).to.eq("turtle.png");
    });

    it("should be able to skip screenshot upload if disabled", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        expectToExist(CONTEXT.config.xray);
        CONTEXT.config.xray.uploadScreenshots = false;
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expect(json.tests).to.have.length(3);
        expect(json.tests[0].evidence).to.be.undefined;
        expect(json.tests[1].evidence).to.be.undefined;
        expect(json.tests[2].evidence).to.be.undefined;
    });

    it("should normalize screenshot filenames if enabled", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
        );
        expectToExist(CONTEXT.config.plugin);
        CONTEXT.config.plugin.normalizeScreenshotNames = true;
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expectToExist(json.tests[0].evidence);
        expect(json.tests[0].evidence[0].filename).to.eq("t_rtle_with_problem_tic_name.png");
    });

    it("should not normalize screenshot filenames by default", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
        );
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expectToExist(json.tests[0].evidence);
        expect(json.tests[0].evidence[0].filename).to.eq("tûrtle with problemätic name.png");
    });

    it("should use PASS as default status name for passed tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expect(json.tests[0].status).to.eq("PASS");
        expect(json.tests[1].status).to.eq("PASS");
    });

    it("should use FAIL as default status name for failed tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expect(json.tests[2].status).to.eq("FAIL");
    });

    it("should use TODO as default status name for pending tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultPending.json", "utf-8")
        );
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expect(json.tests[0].status).to.eq("TODO");
        expect(json.tests[1].status).to.eq("TODO");
        expect(json.tests[2].status).to.eq("TODO");
        expect(json.tests[3].status).to.eq("TODO");
    });

    it("should use FAIL as default status name for skipped tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultSkipped.json", "utf-8")
        );
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expect(json.tests[0].status).to.eq("FAIL");
        expect(json.tests[1].status).to.eq("FAIL");
    });

    it("should be able to use custom passed statuses", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        expectToExist(CONTEXT.config.xray);
        CONTEXT.config.xray.statusPassed = "it worked";
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expect(json.tests[0].status).to.eq("it worked");
        expect(json.tests[1].status).to.eq("it worked");
    });

    it("should be able to use custom failed statuses", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        expectToExist(CONTEXT.config.xray);
        CONTEXT.config.xray.statusFailed = "it did not work";
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expect(json.tests[2].status).to.eq("it did not work");
    });

    it("should be able to use custom pending statuses", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultPending.json", "utf-8")
        );
        expectToExist(CONTEXT.config.xray);
        CONTEXT.config.xray.statusPending = "still pending";
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expect(json.tests[0].status).to.eq("still pending");
        expect(json.tests[1].status).to.eq("still pending");
        expect(json.tests[2].status).to.eq("still pending");
        expect(json.tests[3].status).to.eq("still pending");
    });

    it("should be able to use custom skipped statuses", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultSkipped.json", "utf-8")
        );
        expectToExist(CONTEXT.config.xray);
        CONTEXT.config.xray.statusSkipped = "omit";
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expect(json.tests[0].status).to.eq("FAIL");
        expect(json.tests[1].status).to.eq("omit");
    });

    it("should skip tests when encountering unknown statuses", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultUnknownStatus.json", "utf-8")
        );
        const stubbedWarning = stubLogWarning();
        const json = converter.convertExecutionResults(result);
        expect(stubbedWarning).to.have.been.calledWith(
            "Unknown Cypress test status: 'broken'. Skipping result upload for test \"TodoMVC hides footer initially\"."
        );
        expect(stubbedWarning).to.have.been.calledWith(
            "Unknown Cypress test status: 'california'. Skipping result upload for test \"TodoMVC adds 2 todos\"."
        );
        expect(json.tests).to.be.undefined;
    });

    it("should include step updates by default", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expect(json.tests).to.have.length(3);
        expectToExist(json.tests[0].testInfo);
        expectToExist(json.tests[0].testInfo.steps);
        expect(json.tests[0].testInfo.steps).to.have.length(1);
        expect(json.tests[0].testInfo.steps[0].action).to.be.a("string");
        expectToExist(json.tests[1].testInfo);
        expectToExist(json.tests[1].testInfo.steps);
        expect(json.tests[1].testInfo.steps).to.have.length(1);
        expect(json.tests[1].testInfo.steps[0].action).to.be.a("string");
        expectToExist(json.tests[2].testInfo);
        expectToExist(json.tests[2].testInfo.steps);
        expect(json.tests[2].testInfo.steps).to.have.length(1);
        expect(json.tests[2].testInfo.steps[0].action).to.be.a("string");
    });

    it("should skip step updates if disabled", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        expectToExist(CONTEXT.config.xray);
        CONTEXT.config.xray.steps = {
            update: false,
        };
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expect(json.tests).to.have.length(3);
        expectToExist(json.tests[0].testInfo);
        expect(json.tests[0].testInfo.steps).to.be.undefined;
        expectToExist(json.tests[1].testInfo);
        expect(json.tests[1].testInfo.steps).to.be.undefined;
        expectToExist(json.tests[2].testInfo);
        expect(json.tests[2].testInfo.steps).to.be.undefined;
    });

    it("should truncate step actions to 8000 characters by default", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultLongBodies.json", "utf-8")
        );
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expectToExist(json.tests[0].testInfo);
        expectToExist(json.tests[0].testInfo.steps);
        expect(json.tests[0].testInfo.steps[0].action).to.eq(`${"x".repeat(7997)}...`);
        expectToExist(json.tests[1].testInfo);
        expectToExist(json.tests[1].testInfo.steps);
        expect(json.tests[1].testInfo.steps[0].action).to.eq(`${"x".repeat(8000)}`);
        expectToExist(json.tests[2].testInfo);
        expectToExist(json.tests[2].testInfo.steps);
        expect(json.tests[2].testInfo.steps[0].action).to.eq(`${"x".repeat(2000)}`);
    });

    it("should truncate step actions to custom lengths if enabled", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultLongBodies.json", "utf-8")
        );
        expectToExist(CONTEXT.config.xray?.steps);
        CONTEXT.config.xray.steps.maxLengthAction = 5;
        const json = converter.convertExecutionResults(result);
        expectToExist(json.tests);
        expectToExist(json.tests[0].testInfo);
        expectToExist(json.tests[0].testInfo.steps);
        expect(json.tests[0].testInfo.steps[0].action).to.eq("xx...");
        expectToExist(json.tests[1].testInfo);
        expectToExist(json.tests[1].testInfo.steps);
        expect(json.tests[1].testInfo.steps[0].action).to.eq("xx...");
        expectToExist(json.tests[2].testInfo);
        expectToExist(json.tests[2].testInfo.steps);
        expect(json.tests[2].testInfo.steps[0].action).to.eq("xx...");
    });
});
