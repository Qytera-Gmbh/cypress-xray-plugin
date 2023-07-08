/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import { initOptions } from "../../../../src/context";
import { ImportExecutionResultsConverterServer } from "../../../../src/conversion/importExecutionResults/importExecutionResultsConverterServer";
import { InternalOptions } from "../../../../src/types/plugin";
import { stubLogWarning } from "../../../constants";

describe("the import execution results converter (server)", () => {
    let options: InternalOptions;

    beforeEach(() => {
        options = initOptions({
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
    });

    it("should upload screenshots by default", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const converter = new ImportExecutionResultsConverterServer(options);
        const json = converter.convertExecutionResults(result);
        expect(json.tests[0].evidence).to.not.exist;
        expect(json.tests[1].evidence).to.be.an("array").with.length(1);
        expect(json.tests[1].evidence[0].filename).to.eq("turtle.png");
        expect(json.tests[2].evidence).to.be.an("array").with.length(2);
        expect(json.tests[2].evidence[0].filename).to.eq("turtle.png");
        expect(json.tests[2].evidence[1].filename).to.eq("turtle.png");
    });

    it("should be able to skip screenshot upload if disabled", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        options.xray.uploadScreenshots = false;
        const converter = new ImportExecutionResultsConverterServer(options);
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
        const converter = new ImportExecutionResultsConverterServer(options);
        const json = converter.convertExecutionResults(result);
        expect(json.tests[0].evidence[0].filename).to.eq("t_rtle_with_problem_tic_name.png");
    });

    it("should not normalize screenshot filenames by default", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultProblematicScreenshot.json", "utf-8")
        );
        const converter = new ImportExecutionResultsConverterServer(options);
        const json = converter.convertExecutionResults(result);
        expect(json.tests[0].evidence[0].filename).to.eq("tûrtle with problemätic name.png");
    });

    it("should use PASS as default status name for passed tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const converter = new ImportExecutionResultsConverterServer(options);
        const json = converter.convertExecutionResults(result);
        expect(json.tests[0].status).to.eq("PASS");
        expect(json.tests[1].status).to.eq("PASS");
    });

    it("should use FAIL as default status name for failed tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const converter = new ImportExecutionResultsConverterServer(options);
        const json = converter.convertExecutionResults(result);
        expect(json.tests[2].status).to.eq("FAIL");
    });

    it("should use TODO as default status name for pending tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultPending.json", "utf-8")
        );
        const converter = new ImportExecutionResultsConverterServer(options);
        const json = converter.convertExecutionResults(result);
        expect(json.tests[0].status).to.eq("TODO");
        expect(json.tests[1].status).to.eq("TODO");
        expect(json.tests[2].status).to.eq("TODO");
        expect(json.tests[3].status).to.eq("TODO");
    });

    it("should use FAIL as default status name for skipped tests", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultSkipped.json", "utf-8")
        );
        const converter = new ImportExecutionResultsConverterServer(options);
        const json = converter.convertExecutionResults(result);
        expect(json.tests[0].status).to.eq("FAIL");
        expect(json.tests[1].status).to.eq("FAIL");
    });

    it("should be able to use custom passed statuses", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        options.xray.statusPassed = "it worked";
        const converter = new ImportExecutionResultsConverterServer(options);
        const json = converter.convertExecutionResults(result);
        expect(json.tests[0].status).to.eq("it worked");
        expect(json.tests[1].status).to.eq("it worked");
    });

    it("should be able to use custom failed statuses", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        options.xray.statusFailed = "it did not work";
        const converter = new ImportExecutionResultsConverterServer(options);
        const json = converter.convertExecutionResults(result);
        expect(json.tests[2].status).to.eq("it did not work");
    });

    it("should be able to use custom pending statuses", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultPending.json", "utf-8")
        );
        options.xray.statusPending = "still pending";
        const converter = new ImportExecutionResultsConverterServer(options);
        const json = converter.convertExecutionResults(result);
        expect(json.tests[0].status).to.eq("still pending");
        expect(json.tests[1].status).to.eq("still pending");
        expect(json.tests[2].status).to.eq("still pending");
        expect(json.tests[3].status).to.eq("still pending");
    });

    it("should be able to use custom skipped statuses", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultSkipped.json", "utf-8")
        );
        options.xray.statusSkipped = "omit";
        const converter = new ImportExecutionResultsConverterServer(options);
        const json = converter.convertExecutionResults(result);
        expect(json.tests[0].status).to.eq("FAIL");
        expect(json.tests[1].status).to.eq("omit");
    });

    it("should skip tests when encountering unknown statuses", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultUnknownStatus.json", "utf-8")
        );
        const stubbedWarning = stubLogWarning();
        const converter = new ImportExecutionResultsConverterServer(options);
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
        const converter = new ImportExecutionResultsConverterServer(options);
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
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        options.xray.steps.update = false;
        const converter = new ImportExecutionResultsConverterServer(options);
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
        const converter = new ImportExecutionResultsConverterServer(options);
        const json = converter.convertExecutionResults(result);
        expect(json.tests[0].testInfo.steps[0].action).to.eq(`${"x".repeat(7997)}...`);
        expect(json.tests[1].testInfo.steps[0].action).to.eq(`${"x".repeat(8000)}`);
        expect(json.tests[2].testInfo.steps[0].action).to.eq(`${"x".repeat(2000)}`);
    });

    it("should truncate step actions to custom lengths if enabled", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResultLongBodies.json", "utf-8")
        );
        options.xray.steps.maxLengthAction = 5;
        const converter = new ImportExecutionResultsConverterServer(options);
        const json = converter.convertExecutionResults(result);
        expect(json.tests[0].testInfo.steps[0].action).to.eq("xx...");
        expect(json.tests[1].testInfo.steps[0].action).to.eq("xx...");
        expect(json.tests[2].testInfo.steps[0].action).to.eq("xx...");
    });
});
