/// <reference types="cypress" />

import { expect } from "chai";
import { readFileSync } from "fs";
import { stubLogging } from "../../../test/util";
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
        readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
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

            it("should include all tagged features and tests", () => {
                const { stubbedWarning } = stubLogging();
                const multipart = converter.convert(result, parameters);
                expect(multipart.features).to.be.an("array").with.length(1);
                expect(multipart.features[0].elements).to.be.an("array").with.length(3);
                expect(stubbedWarning).to.have.been.calledOnceWithExactly(
                    "No test issue key found in scenario tags. Skipping result upload for scenario: TC - Development"
                );
            });

            it("should use the configured project key", () => {
                const multipart = converter.convert([result[0]], parameters);
                expect(multipart.info.fields.project).to.deep.eq({
                    key: "CYP",
                });
            });

            it("should use the configured test execution summary", () => {
                options.jira.testExecutionIssueSummary = "A summary";
                const multipart = converter.convert([result[0]], parameters);
                expect(multipart.info.fields.summary).to.eq("A summary");
            });

            it("should use the configured test execution issue description", () => {
                options.jira.testExecutionIssueDescription = "This is a nice description";
                const multipart = converter.convert([result[0]], parameters);
                expect(multipart.info.fields.description).to.eq("This is a nice description");
            });

            it("should use the configured test execution issue key", () => {
                options.jira.testExecutionIssueKey = "CYP-456";
                const multipart = converter.convert([result[0], result[0]], parameters);
                expect(multipart.features[0].tags[0]).to.deep.eq({ name: "@CYP-456" });
                expect(multipart.features[1].tags[0]).to.deep.eq({ name: "@CYP-456" });
            });

            it("should use the configured test execution issue details", () => {
                options.jira.testExecutionIssueDetails = {
                    name: options.jira.testExecutionIssueType,
                    subtask: false,
                };
                const multipart = converter.convert([result[0]], parameters);
                expect(multipart.info.fields.issuetype).to.deep.eq({
                    name: "Test Execution",
                    subtask: false,
                });
            });

            it("should include screenshots by default", () => {
                const multipart = converter.convert([result[0]], parameters);
                expect(multipart.features[0].elements[2].steps[1].embeddings).to.have.length(1);
                expect(multipart.features[0].elements[2].steps[1].embeddings[0].data).to.be.a(
                    "string"
                );
                expect(multipart.features[0].elements[2].steps[1].embeddings[0].mime_type).to.eq(
                    "image/png"
                );
            });

            it("should skip embeddings if screenshots are disabled", () => {
                options.xray.uploadScreenshots = false;
                const multipart = converter.convert([result[0]], parameters);
                expect(multipart.features[0].elements[0].steps[0].embeddings).to.be.empty;
                expect(multipart.features[0].elements[0].steps[1].embeddings).to.be.empty;
                expect(multipart.features[0].elements[1].steps[0].embeddings).to.be.empty;
                expect(multipart.features[0].elements[1].steps[1].embeddings).to.be.empty;
                expect(multipart.features[0].elements[2].steps[0].embeddings).to.be.empty;
                expect(multipart.features[0].elements[2].steps[1].embeddings).to.be.empty;
            });
        });
    });
});
