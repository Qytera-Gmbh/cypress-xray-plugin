/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import { stubLogging } from "../../../test/util";
import { BasicAuthCredentials } from "../../authentication/credentials";
import { initOptions } from "../../context";
import { ImportExecutionResultsConverterCloud } from "../../conversion/importExecutionResults/importExecutionResultsConverterCloud";
import { InternalOptions } from "../../types/plugin";
import { XrayClientServer } from "./xrayClientServer";

describe("the Xray Server client", () => {
    let details: CypressCommandLine.CypressRunResult;
    const client: XrayClientServer = new XrayClientServer(
        "https://example.org",
        new BasicAuthCredentials("user", "xyz")
    );

    let options: InternalOptions;

    beforeEach(() => {
        options = initOptions({
            jira: {
                projectKey: "CYP",
            },
            xray: {
                testType: "Manual",
            },
            cucumber: {
                featureFileExtension: ".feature",
            },
        });
        details = JSON.parse(readFileSync("./test/resources/runResult.json", "utf-8"));
    });

    it("should be able to skip empty test uploads", async () => {
        details.runs.forEach((run, i) =>
            run.tests.forEach((test, j) => (test.title = ["nothing", i.toString(), j.toString()]))
        );
        options.jira.createTestIssues = false;
        const { stubbedWarning } = stubLogging();
        const results = new ImportExecutionResultsConverterCloud(options).convertExecutionResults(
            details
        );
        const result = await client.importExecution(results);
        expect(result).to.be.null;
        expect(stubbedWarning).to.have.been.called.with.callCount(4);
        expect(stubbedWarning).to.have.been.calledWith(
            'No test issue key found in test title and the plugin is not allowed to create new test issues. Skipping result upload for test "nothing 0 0".'
        );
        expect(stubbedWarning).to.have.been.calledWith(
            'No test issue key found in test title and the plugin is not allowed to create new test issues. Skipping result upload for test "nothing 0 1".'
        );
        expect(stubbedWarning).to.have.been.calledWith(
            'No test issue key found in test title and the plugin is not allowed to create new test issues. Skipping result upload for test "nothing 0 2".'
        );
        expect(stubbedWarning).to.have.been.calledWith(
            "No tests linked to Xray were executed. Skipping upload."
        );
    });

    describe("the URLs", () => {
        describe("export cucumber", () => {
            it("keys", () => {
                expect(client.getUrlExportCucumber(["CYP-123", "CYP-456"])).to.eq(
                    "https://example.org/rest/raven/latest/export/test?keys=CYP-123;CYP-456&fz=true"
                );
            });
            it("filter", () => {
                expect(client.getUrlExportCucumber(undefined, 56)).to.eq(
                    "https://example.org/rest/raven/latest/export/test?filter=56&fz=true"
                );
            });
            it("keys and filter", () => {
                expect(client.getUrlExportCucumber(["CYP-123", "CYP-456"], 56)).to.eq(
                    "https://example.org/rest/raven/latest/export/test?keys=CYP-123;CYP-456&filter=56&fz=true"
                );
            });
            it("neither keys nor filter", () => {
                expect(() => client.getUrlExportCucumber()).to.throw(
                    "One of issueKeys or filter must be provided to export feature files"
                );
            });
        });
        it("import execution", () => {
            expect(client.getUrlImportExecution()).to.eq(
                "https://example.org/rest/raven/latest/import/execution"
            );
        });
        it("import feature", () => {
            expect(client.getUrlImportFeature("CYP")).to.eq(
                "https://example.org/rest/raven/latest/import/feature?projectKey=CYP"
            );
        });
    });
});
