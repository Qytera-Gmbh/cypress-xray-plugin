/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import { initOptions } from "../../context";
import { InternalOptions } from "../../types/plugin";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { ConversionParameters } from "./importExecutionCucumberMultipartConverter";
import { ImportExecutionCucumberMultipartConverterCloud } from "./importExecutionCucumberMultipartConverterCloud";
import { ImportExecutionCucumberMultipartConverterServer } from "./importExecutionCucumberMultipartConverterServer";

describe("the import execution cucumber multipart converters", () => {
    let options: InternalOptions;
    let converter:
        | ImportExecutionCucumberMultipartConverterServer
        | ImportExecutionCucumberMultipartConverterCloud;
    let result: CucumberMultipartFeature[];
    const parameters: ConversionParameters = JSON.parse(
        readFileSync("./test/resources/runResult.json", "utf-8")
    );

    ["server", "cloud"].forEach((converterType) => {
        describe(converterType, () => {
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
                        ? new ImportExecutionCucumberMultipartConverterServer(options)
                        : new ImportExecutionCucumberMultipartConverterCloud(options);
                result =
                    converterType === "server"
                        ? JSON.parse(
                              readFileSync(
                                  "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                                  "utf-8"
                              )
                          )
                        : JSON.parse(
                              readFileSync(
                                  "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                                  "utf-8"
                              )
                          );
            });

            it("should include all encountered features and tests", () => {
                const multipart = converter.convert(result, parameters);
                expect(multipart.features).to.be.an("array").with.length(2);
                expect(multipart.features[0].elements).to.be.an("array").with.length(3);
                expect(multipart.features[1].elements).to.be.an("array").with.length(1);
            });

            it("should use the configured project key", () => {
                const multipart = converter.convert(result, parameters);
                expect(multipart.info.fields.project).to.deep.eq({
                    key: "CYP",
                });
            });

            it("should use the configured test execution summary", () => {
                options.jira.testExecutionIssueSummary = "A summary";
                const multipart = converter.convert(result, parameters);
                expect(multipart.info.fields.summary).to.eq("A summary");
            });

            it("should use the configured test execution issue description", () => {
                options.jira.testExecutionIssueDescription = "This is a nice description";
                const multipart = converter.convert(result, parameters);
                expect(multipart.info.fields.description).to.eq("This is a nice description");
            });

            it("should use the configured test execution issue key", () => {
                options.jira.testExecutionIssueKey = "CYP-456";
                const multipart = converter.convert(result, parameters);
                expect(multipart.features[0].tags[0]).to.deep.eq({ name: "@CYP-456" });
                expect(multipart.features[1].tags[0]).to.deep.eq({ name: "@CYP-456" });
            });

            it("should use the configured test execution issue details", () => {
                options.jira.testExecutionIssueDetails = {
                    name: options.jira.testExecutionIssueType,
                    subtask: false,
                };
                const multipart = converter.convert(result, parameters);
                expect(multipart.info.fields.issuetype).to.deep.eq({
                    name: "Test Execution",
                    subtask: false,
                });
            });
        });
    });
    /*

    it("should be able to add test plan issue keys", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        options.jira.testPlanIssueKey = "CYP-123";
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convert(result);
        expect(json.info.testPlanKey).to.eq("CYP-123");
    });



    it("should be able to create test issues with summary overwriting disabled", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        options.plugin.overwriteIssueSummary = false;
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convert(result);
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
        const json: XrayTestExecutionResultsCloud = converter.convert(result);
        expect(json.info.summary).to.eq("Jeffrey's Test");
    });

    it("should use a timestamp as test execution summary by default", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convert(result);
        expect(json.info.summary).to.eq("Execution Results [1669657272234]");
    });

    it("should include a custom test execution description if provided", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        options.jira.testExecutionIssueDescription = "Very Useful Text";
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convert(result);
        expect(json.info.description).to.eq("Very Useful Text");
    });

    it("should use versions as test execution description by default", () => {
        const result: CypressCommandLine.CypressRunResult = JSON.parse(
            readFileSync("./test/resources/runResult.json", "utf-8")
        );
        const converter = new ImportExecutionConverterCloud(options);
        const json: XrayTestExecutionResultsCloud = converter.convert(result);
        expect(json.info.description).to.eq(
            "Cypress version: 11.1.0 Browser: electron (106.0.5249.51)"
        );
    });
*/
});
